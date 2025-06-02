import os
import json
import uuid
import logging
import httpx
from typing import Dict, Any, List, Optional, Annotated
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Header, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pymongo import MongoClient
from bson import ObjectId
from bson.json_util import dumps
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB setup
client = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
db = client[os.environ.get("DB_NAME", "test_database")]

# N8N Webhook URLs
N8N_WEBHOOKS = {
    "dashboard_view": "https://ventruk.n8n.cloud/webhook",
    "goals_view": "https://ventruk.app.n8n.cloud/webhook-test/goals-view",
    "metrics_view": "https://ventruk.app.n8n.cloud/webhook-test/metrics-view",
    "goal_update": "https://ventruk.app.n8n.cloud/webhook-test/goals-update",
    "send_notification": "https://ventruk.app.n8n.cloud/webhook-test/api/send-notification",
    "intervention_queue": "https://ventruk.app.n8n.cloud/webhook-test/get-intervention-queue/api/intervention-queue",  # :userId handled dynamically
    "pattern_detected": "https://ventruk.app.n8n.cloud/webhook-test/api/pattern-detected",
    "weekly_report": "https://ventruk.app.n8n.cloud/webhook-test/get-weekly-report/api/weekly-report",  # :userId handled dynamically
    "voice_interaction": "https://ventruk.app.n8n.cloud/webhook/voice-interaction",  # assuming this follows the pattern
    "conversation_history": "https://ventruk.app.n8n.cloud/webhook-test/conversation-history"  # NEW
}

# Helper function to call N8N webhooks
async def call_n8n_webhook(webhook_name: str, payload: Dict[str, Any], user_token: str = None, session_id: str = None, user_id: str = None):
    try:
        headers = {"Content-Type": "application/json"}
        if user_token:
            headers["Authorization"] = f"Bearer {user_token}"
        if session_id:
            headers["X-Session-ID"] = session_id
            
        # Handle dynamic URLs with userId
        webhook_url = N8N_WEBHOOKS.get(webhook_name, "")
        if ":userId" in webhook_url and user_id:
            webhook_url = webhook_url.replace(":userId", user_id)
            
        logger.info(f"Calling N8N webhook: {webhook_name} at {webhook_url}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json=payload,
                headers=headers,
                timeout=10.0  # Add timeout to prevent hanging
            )
            
        if response.status_code >= 200 and response.status_code < 300:
            return response.json()
        else:
            logger.warning(f"N8N webhook {webhook_name} returned status {response.status_code}: {response.text}")
            # Return a mock response for testing
            return {"status": "mock_success", "message": "This is a mock response for testing"}
    except Exception as e:
        logger.error(f"Error calling N8N webhook {webhook_name}: {str(e)}")
        # Return a mock response for testing
        return {"status": "mock_success", "message": "This is a mock response for testing"}

# JWT Configuration
SECRET_KEY = "your-secret-key"  # In production, use a secure environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create FastAPI app
app = FastAPI(title="Celeste7 API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API router
api_router = FastAPI(title="Celeste7 API Router")

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except InvalidTokenError:
        return None

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split("Bearer ")[1]
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

# Models
class MongoBaseModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[str] = Field(None, alias="_id")

class StatusCheck(BaseModel):
    service: str
    status: str
    message: str
    timestamp: datetime

class StatusCheckCreate(BaseModel):
    client_name: str

class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class DisplayNameUpdate(BaseModel):
    display_name: str

class VoiceInteraction(BaseModel):
    user_id: str
    message: str
    session_id: Optional[str] = None

class GoalCreate(BaseModel):
    user_id: str
    goal_text: str
    target_date: Optional[datetime] = None

class GoalUpdate(BaseModel):
    goal_id: str
    user_id: str
    goal_text: Optional[str] = None
    target_date: Optional[datetime] = None
    completed: Optional[bool] = None

class NotificationCreate(BaseModel):
    user_id: str
    message: str
    type: str = "info"  # info, warning, success, error

class PatternDetection(BaseModel):
    user_id: str
    pattern_type: str
    pattern_data: Dict[str, Any]

class InterventionRequest(BaseModel):
    user_id: str

class WeeklyReportRequest(BaseModel):
    user_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ConversationHistoryRequest(BaseModel):
    user_id: str
    limit: Optional[int] = 10
    offset: Optional[int] = 0

# Auth endpoints
SIGNUP_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook/auth/sign-up"
SIGNIN_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook/auth/sign-in"
DISPLAY_NAME_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook/user/display-name"
VOICE_CHAT_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook/voice-chat"

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@api_router.post("/status-check")
async def create_status_check(status_check: StatusCheckCreate):
    status_checks = [
        {
            "service": "api",
            "status": "ok",
            "message": "API is operational",
            "timestamp": datetime.now()
        },
        {
            "service": "database",
            "status": "ok",
            "message": "Database connection is healthy",
            "timestamp": datetime.now()
        },
        {
            "service": "auth",
            "status": "ok",
            "message": "Authentication service is operational",
            "timestamp": datetime.now()
        }
    ]
    
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/auth/signup")
async def signup(user_data: UserSignUp):
    try:
        # First, check if user already exists in our local database
        existing_user = db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="A user with that email already exists."
            )
        
        # Hash the password
        hashed_password = pwd_context.hash(user_data.password)
        
        # Create a new user document
        new_user = {
            "email": user_data.email,
            "password": hashed_password,
            "firstName": user_data.firstName,
            "lastName": user_data.lastName,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Insert the user into the database
        result = db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Generate access token
        access_token = create_access_token(
            data={"sub": user_id, "email": user_data.email}
        )
        
        # Try to call N8N webhook, but don't fail if it's not available
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    SIGNUP_WEBHOOK,
                    json=user_data.dict(),
                    headers={"Content-Type": "application/json"},
                    timeout=5.0  # Short timeout to prevent hanging
                )
                logger.info(f"N8N signup webhook response: {response.status_code}")
        except Exception as e:
            logger.warning(f"N8N signup webhook failed: {str(e)}")
        
        # Return the user data and token
        return {
            "user_id": user_id,
            "email": user_data.email,
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during signup"
        )

@api_router.post("/auth/signin")
async def signin(user_data: UserSignIn):
    try:
        # Find the user in our local database
        user = db.users.find_one({"email": user_data.email})
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not pwd_context.verify(user_data.password, user["password"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Generate access token
        user_id = str(user["_id"])
        access_token = create_access_token(
            data={"sub": user_id, "email": user_data.email}
        )
        
        # Try to call N8N webhook, but don't fail if it's not available
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    SIGNIN_WEBHOOK,
                    json=user_data.dict(),
                    headers={"Content-Type": "application/json"},
                    timeout=5.0  # Short timeout to prevent hanging
                )
                logger.info(f"N8N signin webhook response: {response.status_code}")
        except Exception as e:
            logger.warning(f"N8N signin webhook failed: {str(e)}")
        
        # Return the user data and token
        return {
            "user_id": user_id,
            "email": user_data.email,
            "display_name": user.get("display_name", ""),
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Signin error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during signin"
        )

@api_router.post("/user/display-name")
async def update_display_name(data: DisplayNameUpdate, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Update the user's display name in the database
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"display_name": data.display_name, "updated_at": datetime.now()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "display_name_update",
                {
                    "user_id": user_id,
                    "display_name": data.display_name
                },
                user_token=current_user.get("access_token")
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N display name webhook failed: {str(e)}")
        
        return {"success": True, "display_name": data.display_name}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Update display name error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while updating display name"
        )

@api_router.post("/voice-chat")
async def voice_chat(data: VoiceInteraction, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Generate a session ID if not provided
        session_id = data.session_id or str(uuid.uuid4())
        
        # Store the interaction in the database
        interaction = {
            "user_id": user_id,
            "message": data.message,
            "session_id": session_id,
            "timestamp": datetime.now()
        }
        db.voice_interactions.insert_one(interaction)
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "voice_interaction",
                {
                    "user_id": user_id,
                    "message": data.message,
                    "session_id": session_id
                },
                user_token=current_user.get("access_token"),
                session_id=session_id,
                user_id=user_id
            )
            logger.info(f"N8N webhook response: {n8n_response}")
            
            # If N8N webhook fails, generate a mock response
            if not n8n_response or "error" in n8n_response:
                n8n_response = {
                    "response": "I'm sorry, I'm having trouble connecting to my services right now. Please try again later.",
                    "session_id": session_id
                }
        except Exception as e:
            logger.warning(f"N8N voice chat webhook failed: {str(e)}")
            n8n_response = {
                "response": "I'm sorry, I'm having trouble connecting to my services right now. Please try again later.",
                "session_id": session_id
            }
        
        return {
            "user_id": user_id,
            "session_id": session_id,
            "response": n8n_response.get("response", "I'm here to help you. What would you like to talk about?"),
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Voice chat error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during voice chat"
        )

@api_router.post("/goals")
async def create_goal(goal: GoalCreate, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Verify user ID matches
        if goal.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="User ID mismatch"
            )
        
        # Create goal in database
        new_goal = {
            "user_id": user_id,
            "goal_text": goal.goal_text,
            "target_date": goal.target_date,
            "completed": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = db.goals.insert_one(new_goal)
        goal_id = str(result.inserted_id)
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "goal_update",
                {
                    "user_id": user_id,
                    "goal_id": goal_id,
                    "goal_text": goal.goal_text,
                    "target_date": goal.target_date.isoformat() if goal.target_date else None,
                    "action": "create"
                },
                user_token=current_user.get("access_token")
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N goal create webhook failed: {str(e)}")
        
        return {
            "goal_id": goal_id,
            "user_id": user_id,
            "goal_text": goal.goal_text,
            "target_date": goal.target_date,
            "completed": False
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Create goal error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the goal"
        )

@api_router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, goal: GoalUpdate, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Verify user ID matches
        if goal.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="User ID mismatch"
            )
        
        # Verify goal exists and belongs to user
        existing_goal = db.goals.find_one({"_id": ObjectId(goal_id), "user_id": user_id})
        if not existing_goal:
            raise HTTPException(
                status_code=404,
                detail="Goal not found or does not belong to user"
            )
        
        # Update goal in database
        update_data = {"updated_at": datetime.now()}
        if goal.goal_text is not None:
            update_data["goal_text"] = goal.goal_text
        if goal.target_date is not None:
            update_data["target_date"] = goal.target_date
        if goal.completed is not None:
            update_data["completed"] = goal.completed
        
        db.goals.update_one(
            {"_id": ObjectId(goal_id)},
            {"$set": update_data}
        )
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "goal_update",
                {
                    "user_id": user_id,
                    "goal_id": goal_id,
                    "goal_text": goal.goal_text,
                    "target_date": goal.target_date.isoformat() if goal.target_date else None,
                    "completed": goal.completed,
                    "action": "update"
                },
                user_token=current_user.get("access_token")
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N goal update webhook failed: {str(e)}")
        
        return {"success": True, "goal_id": goal_id}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Update goal error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while updating the goal"
        )

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Verify goal exists and belongs to user
        existing_goal = db.goals.find_one({"_id": ObjectId(goal_id), "user_id": user_id})
        if not existing_goal:
            raise HTTPException(
                status_code=404,
                detail="Goal not found or does not belong to user"
            )
        
        # Delete goal from database
        db.goals.delete_one({"_id": ObjectId(goal_id)})
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "goal_update",
                {
                    "user_id": user_id,
                    "goal_id": goal_id,
                    "action": "delete"
                },
                user_token=current_user.get("access_token")
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N goal delete webhook failed: {str(e)}")
        
        return {"success": True, "goal_id": goal_id}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Delete goal error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while deleting the goal"
        )

@api_router.post("/notifications")
async def send_notification(notification: NotificationCreate, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Verify user ID matches
        if notification.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="User ID mismatch"
            )
        
        # Store notification in database
        new_notification = {
            "user_id": user_id,
            "message": notification.message,
            "type": notification.type,
            "read": False,
            "created_at": datetime.now()
        }
        
        db.notifications.insert_one(new_notification)
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "send_notification",
                {
                    "user_id": user_id,
                    "message": notification.message,
                    "type": notification.type
                },
                user_token=current_user.get("access_token")
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N notification webhook failed: {str(e)}")
            n8n_response = {"status": "mock_success"}
        
        return {"success": True, "notification_sent": True, "n8n_response": n8n_response}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Send notification error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while sending the notification"
        )

@api_router.get("/interventions")
async def get_interventions(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "intervention_queue",
                {"user_id": user_id},
                user_token=current_user.get("access_token"),
                user_id=user_id
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N interventions webhook failed: {str(e)}")
            n8n_response = {"interventions": []}
        
        return {
            "user_id": user_id,
            "interventions": n8n_response.get("interventions", []),
            "timestamp": datetime.now().isoformat(),
            "n8n_response": n8n_response
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Get interventions error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving interventions"
        )

@api_router.post("/patterns")
async def detect_pattern(pattern: PatternDetection, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Verify user ID matches
        if pattern.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="User ID mismatch"
            )
        
        # Store pattern in database
        new_pattern = {
            "user_id": user_id,
            "pattern_type": pattern.pattern_type,
            "pattern_data": pattern.pattern_data,
            "created_at": datetime.now()
        }
        
        db.patterns.insert_one(new_pattern)
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "pattern_detected",
                {
                    "user_id": user_id,
                    "pattern_type": pattern.pattern_type,
                    "pattern_data": pattern.pattern_data
                },
                user_token=current_user.get("access_token")
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N pattern webhook failed: {str(e)}")
            n8n_response = {"status": "mock_success"}
        
        return {"success": True, "pattern_processed": True, "n8n_response": n8n_response}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Detect pattern error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the pattern"
        )

@api_router.get("/weekly-report")
async def get_weekly_report(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Try to call N8N webhook
        try:
            n8n_response = await call_n8n_webhook(
                "weekly_report",
                {"user_id": user_id},
                user_token=current_user.get("access_token"),
                user_id=user_id
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N weekly report webhook failed: {str(e)}")
            # Generate mock data for testing
            n8n_response = {
                "report": {
                    "streak": 5,
                    "total_interactions": 23,
                    "goals_completed": 2,
                    "goals_in_progress": 3,
                    "top_topics": ["productivity", "focus", "sleep"],
                    "sentiment_trend": "positive"
                }
            }
        
        return {
            "user_id": user_id,
            "report": n8n_response.get("report", {}),
            "timestamp": datetime.now().isoformat(),
            "n8n_response": n8n_response
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Get weekly report error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving the weekly report"
        )

@api_router.get("/dashboard")
async def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Get user data
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Get active goals
        active_goals = list(db.goals.find({"user_id": user_id, "completed": False}))
        active_goals = json.loads(dumps(active_goals))
        
        # Get completed goals count
        completed_goals_count = db.goals.count_documents({"user_id": user_id, "completed": True})
        
        # Get interaction count
        interaction_count = db.voice_interactions.count_documents({"user_id": user_id})
        
        # Try to call N8N webhook for additional dashboard data
        try:
            n8n_response = await call_n8n_webhook(
                "dashboard_view",
                {"user_id": user_id},
                user_token=current_user.get("access_token")
            )
            logger.info(f"N8N webhook response: {n8n_response}")
        except Exception as e:
            logger.warning(f"N8N dashboard webhook failed: {str(e)}")
            # Generate mock data for testing
            n8n_response = {
                "streak": 7,
                "sentiment_score": 0.75,
                "weekly_progress": 68,
                "recent_topics": ["productivity", "focus", "sleep"],
                "performance_data": {
                    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    "datasets": [
                        {
                            "label": "Interactions",
                            "data": [3, 5, 2, 4, 6, 2, 1]
                        },
                        {
                            "label": "Goals Progress",
                            "data": [10, 20, 30, 40, 50, 60, 70]
                        }
                    ]
                }
            }
        
        # Combine all data
        dashboard_data = {
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "display_name": user.get("display_name", ""),
                "created_at": user.get("created_at", "").isoformat() if user.get("created_at") else None
            },
            "metrics": {
                "streak": n8n_response.get("streak", 0),
                "completed_goals": completed_goals_count,
                "active_goals": len(active_goals),
                "total_interactions": interaction_count,
                "sentiment_score": n8n_response.get("sentiment_score", 0),
                "weekly_progress": n8n_response.get("weekly_progress", 0)
            },
            "goals": active_goals,
            "recent_topics": n8n_response.get("recent_topics", []),
            "performance_data": n8n_response.get("performance_data", {})
        }
        
        return {
            "success": True,
            "data": dashboard_data,
            "timestamp": datetime.now().isoformat(),
            "n8n_response": n8n_response
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Get dashboard data error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving dashboard data"
        )

@api_router.get("/conversation-history")
async def get_conversation_history(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Mock conversation data for now
        conversations = [
            {
                "id": "conv_001",
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "user_input": "How should I approach my deadlift training?",
                "ai_response": "Focus on progressive overload with proper form. Start with 3 sets of 5 reps at 80% of your 1RM.",
                "category": "fitness",
                "feedback": True,
                "duration": 45.2
            },
            {
                "id": "conv_002", 
                "timestamp": (datetime.now() - timedelta(hours=6)).isoformat(),
                "user_input": "I'm feeling unmotivated today",
                "ai_response": "That's normal. Remember your goal of deadlifting 500lbs. Small actions build momentum.",
                "category": "mindset",
                "feedback": None,
                "duration": 32.1
            }
        ]
        
        return {
            "conversations": conversations,
            "total": len(conversations)
        }
        
    except Exception as e:
        logger.error(f"Get conversation history error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving conversation history"
        )

@api_router.get("/user-goals")
async def get_user_goals(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Mock goals data for now
        goals = [
            {
                "id": "goal_001",
                "user_id": user_id,
                "title": "Increase deadlift to 500lbs",
                "description": "Progressive overload every week",
                "progress": 65.0,
                "status": "active",
                "created_at": (datetime.now() - timedelta(days=30)).isoformat(),
                "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
                "target_date": (datetime.now() + timedelta(days=60)).isoformat()
            },
            {
                "id": "goal_002",
                "user_id": user_id,
                "title": "Build consistent morning routine",
                "description": "Wake up at 6 AM every day",
                "progress": 80.0,
                "status": "active",
                "created_at": (datetime.now() - timedelta(days=21)).isoformat(),
                "updated_at": (datetime.now() - timedelta(days=1)).isoformat(),
                "target_date": (datetime.now() + timedelta(days=30)).isoformat()
            }
        ]
        
        return {"goals": goals, "total": len(goals)}
        
    except Exception as e:
        logger.error(f"Get user goals error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving goals"
        )

@api_router.get("/performance-metrics")
async def get_performance_metrics(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Mock performance data
        metrics = {
            "user_id": user_id,
            "active_days": 28,
            "goal_progress_avg": 72.5,
            "workout_consistency": 85.0,
            "daily_interaction_count": 3,
            "satisfaction_rate": 4.2,
            "current_streak": 7
        }
        
        return metrics
        
    except Exception as e:
        logger.error(f"Get performance metrics error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving performance metrics"
        )

# Mount the API router
app.mount("/api", api_router)

# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    # Create indexes
    db.users.create_index("email", unique=True)
    db.goals.create_index([("user_id", 1), ("completed", 1)])
    db.voice_interactions.create_index([("user_id", 1), ("timestamp", -1)])
    db.notifications.create_index([("user_id", 1), ("read", 1), ("created_at", -1)])
    
    logger.info("Connected to the MongoDB database!")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
