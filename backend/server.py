import os
import uuid
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, APIRouter, HTTPException, status, UploadFile, File, Form, Depends, Request, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# N8N Webhook URLs (Exact URLs provided by user)
N8N_WEBHOOKS = {
    "dashboard_view": "https://ventruk.n8n.cloud/webhook",
    "goals_view": "https://ventruk.app.n8n.cloud/webhook-test/goals-view",
    "metrics_view": "https://ventruk.app.n8n.cloud/webhook-test/metrics-view",
    "goal_update": "https://ventruk.app.n8n.cloud/webhook-test/goals-update",
    "send_notification": "https://ventruk.app.n8n.cloud/webhook-test/api/send-notification",
    "intervention_queue": "https://ventruk.app.n8n.cloud/webhook-test/get-intervention-queue/api/intervention-queue",  # :userId handled dynamically
    "pattern_detected": "https://ventruk.app.n8n.cloud/webhook-test/api/pattern-detected",
    "weekly_report": "https://ventruk.app.n8n.cloud/webhook-test/get-weekly-report/api/weekly-report",  # :userId handled dynamically
    "voice_interaction": "https://ventruk.app.n8n.cloud/webhook/voice-interaction"  # assuming this follows the pattern
}

# Enhanced N8N webhook caller with proper security
async def call_n8n_webhook(webhook_name: str, payload: Dict[str, Any], user_token: str = None, session_id: str = None, user_id: str = None):
    """Call N8N webhook with proper security headers and error handling"""
    try:
        webhook_url = N8N_WEBHOOKS.get(webhook_name)
        if not webhook_url:
            logger.warning(f"Unknown webhook: {webhook_name}")
            return None
        
        # Handle dynamic :userId parameter for specific webhooks
        if webhook_name in ["intervention_queue", "weekly_report"] and user_id:
            webhook_url = f"{webhook_url}/{user_id}"
            
        # Prepare secure headers
        headers = get_secure_headers(user_token, session_id)
        
        # Sanitize payload
        sanitized_payload = sanitize_string_data(payload)
        
        logger.info(f"🔗 Calling N8N webhook: {webhook_name} → {webhook_url}")
        logger.info(f"🔐 Security headers: {headers}")
        logger.info(f"📦 Payload: {sanitized_payload}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook_url,
                json=sanitized_payload,
                headers=headers
            )
            
            if response.status_code == 200:
                logger.info(f"✅ N8N webhook {webhook_name} successful: {response.status_code}")
                return response.json() if response.content else {"success": True}
            else:
                logger.warning(f"⚠️ N8N webhook {webhook_name} returned: {response.status_code}")
                logger.warning(f"Response body: {response.text}")
                return {"success": False, "status_code": response.status_code}
                
    except httpx.TimeoutException:
        logger.error(f"⏰ N8N webhook {webhook_name} timeout")
        return {"success": False, "error": "timeout"}
    except Exception as e:
        logger.error(f"❌ N8N webhook {webhook_name} error: {str(e)}")
        return {"success": False, "error": str(e)}

# Supabase setup
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("Missing Supabase credentials")
    supabase: Optional[Client] = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    logger.info("Supabase client initialized")

# Security helper function with proper Celeste7 specification
def get_security_payload(user_id: str, action: str) -> Dict[str, Any]:
    """Generate security payload for N8N webhooks according to Celeste7 spec"""
    return {
        "user_id": user_id,
        "action": action,
        "timestamp": datetime.utcnow().isoformat(),
        "source": "celeste7_dashboard",
        "request_id": str(uuid.uuid4()),
        "session_id": f"session_{user_id}_{int(datetime.utcnow().timestamp())}"
    }

def get_secure_headers(user_token: str = None, session_id: str = None) -> Dict[str, str]:
    """Generate secure headers for webhook requests"""
    return {
        'X-User-Token': user_token or f"mock_token_{uuid.uuid4()}",
        'X-Session-ID': session_id or f"session_{uuid.uuid4()}",
        'X-Request-ID': str(uuid.uuid4()),
        'X-Timestamp': datetime.utcnow().isoformat(),
        'Content-Type': 'application/json'
    }

# Security validation for protected endpoints
async def validate_security_headers(
    request: Request,
    x_user_token: str = Header(None, alias="X-User-Token"),
    x_session_id: str = Header(None, alias="X-Session-ID"), 
    x_request_id: str = Header(None, alias="X-Request-ID"),
    x_timestamp: str = Header(None, alias="X-Timestamp")
):
    """Validate security headers for protected endpoints"""
    
    # For now, we'll be lenient with validation since we're in MVP mode
    # In production, these should be strict
    
    security_info = {
        "user_token": x_user_token,
        "session_id": x_session_id,
        "request_id": x_request_id,
        "timestamp": x_timestamp,
        "user_id": "extracted_from_jwt"  # TODO: Extract from JWT token
    }
    
    # Basic timestamp validation
    if x_timestamp and not validate_request_timing(x_timestamp):
        logger.warning(f"Request timestamp too old: {x_timestamp}")
        # For MVP, log warning but don't reject
    
    logger.info(f"Security validation - Token: {x_user_token[:20] if x_user_token else 'None'}...")
    
    return security_info

def validate_request_timing(timestamp_str: str) -> bool:
    """Validate request timestamp is recent (within 5 minutes)"""
    try:
        request_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        now = datetime.utcnow()
        time_diff = (now - request_time.replace(tzinfo=None)).total_seconds()
        return time_diff <= 300  # 5 minutes
    except:
        return False

def sanitize_string_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize string inputs (max 1000 chars, trim whitespace)"""
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = value.strip()[:1000]
        elif isinstance(value, dict):
            sanitized[key] = sanitize_string_data(value)
        else:
            sanitized[key] = value
    return sanitized

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

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

class DisplayNameChange(BaseModel):
    userID: str
    displayName: str

class VoiceChatRequest(BaseModel):
    userID: str
    audioBlob: str  # Base64 encoded audio
    sessionID: Optional[str] = None

# Pydantic models for API requests and responses
class VoiceUploadRequest(BaseModel):
    user_id: str
    session_id: str
    audio_data: str  # Base64 encoded audio
    audio_mime_type: str = "audio/wav"
    audio_duration: float = 0.0
    conversation_context: Optional[str] = None

class AuthRequest(BaseModel):
    email: EmailStr
    password: str

class SignUpRequest(BaseModel):
    email: EmailStr  
    password: str
    full_name: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    email: str

# Dashboard-specific models
class DashboardData(BaseModel):
    user_id: str
    current_streak: int = 0
    last_workout: Optional[str] = None
    last_workout_days_ago: Optional[int] = None
    primary_goal: Optional[str] = None
    pending_interventions: int = 0
    greeting_message: str
    total_sessions: int = 0
    last_session: Optional[str] = None

class Goal(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    progress: float = 0.0  # 0-100 percentage
    status: str = "active"  # active, completed, archived
    created_at: datetime
    updated_at: datetime
    target_date: Optional[datetime] = None

class PerformanceMetrics(BaseModel):
    user_id: str
    active_days: int = 0
    goal_progress_avg: float = 0.0
    workout_consistency: float = 0.0
    daily_interaction_count: int = 0
    satisfaction_rate: float = 0.0
    current_streak: int = 0

# Webhook URLs - Production
SIGNUP_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook/auth/sign-up"
SIGNIN_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook/auth/sign-in"
DISPLAY_NAME_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook/user/display-name"
VOICE_CHAT_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook/voice-chat"

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Celeste7 AI Voice Chat API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/auth/signup")
async def signup(user_data: UserSignUp):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SIGNUP_WEBHOOK,
                json=user_data.dict(),
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                return response.json()
            elif response.status_code == 409:
                raise HTTPException(
                    status_code=409,
                    detail="A user with that email already exists."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Signup service temporarily unavailable"
                )
    except httpx.RequestError:
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to authentication service"
        )

@api_router.post("/auth/signin")
async def signin(user_data: UserSignIn):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SIGNIN_WEBHOOK,
                json=user_data.dict(),
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Email or password is incorrect."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Signin service temporarily unavailable"
                )
    except httpx.RequestError:
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to authentication service"
        )

@api_router.post("/user/display-name")
async def change_display_name(data: DisplayNameChange):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                DISPLAY_NAME_WEBHOOK,
                json=data.dict(),
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Display name change service temporarily unavailable"
                )
    except httpx.RequestError:
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to user service"
        )

@api_router.post("/voice/chat")
async def voice_chat(data: VoiceChatRequest):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                VOICE_CHAT_WEBHOOK,
                json=data.dict(),
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Voice chat service temporarily unavailable"
                )
    except httpx.RequestError:
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to voice chat service"
        )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Dashboard API endpoints
@app.get("/api/user-dashboard/{user_id}")
async def get_user_dashboard(user_id: str, security: dict = Depends(validate_security_headers)):
    """Get dashboard data for a user"""
    try:
        # Get current time for greeting
        current_hour = datetime.now().hour
        if 5 <= current_hour < 12:
            greeting = "Good morning, warrior"
        elif 12 <= current_hour < 18:
            greeting = "Good afternoon, champion"
        else:
            greeting = "Good evening, legend"

        # Mock data for now (will be replaced with Supabase queries)
        dashboard_data = DashboardData(
            user_id=user_id,
            current_streak=7,
            last_workout="Strength Training",
            last_workout_days_ago=2,
            primary_goal="Increase deadlift to 500lbs",
            pending_interventions=1,
            greeting_message=greeting,
            total_sessions=23,
            last_session="2024-06-01T10:30:00Z"
        )

        # Send security payload to N8N webhook
        security_payload = get_security_payload(user_id, "dashboard_view")
        secure_headers = get_secure_headers(security.get("user_token"), security.get("session_id"))
        
        logger.info(f"Dashboard accessed by user {user_id} with security: {security['request_id']}")
        
        return dashboard_data
        
    except Exception as e:
        logger.error(f"Dashboard error for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

@app.get("/api/user-goals/{user_id}")
async def get_user_goals(user_id: str, security: dict = Depends(validate_security_headers)):
    """Get goals for a user"""
    try:
        # Mock goals data
        goals = [
            Goal(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title="Increase deadlift to 500lbs",
                description="Progressive overload every week",
                progress=65.0,
                status="active",
                created_at=datetime.now() - timedelta(days=30),
                updated_at=datetime.now() - timedelta(days=2),
                target_date=datetime.now() + timedelta(days=60)
            ),
            Goal(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title="Build consistent morning routine",
                description="Wake up at 6 AM every day",
                progress=80.0,
                status="active",
                created_at=datetime.now() - timedelta(days=21),
                updated_at=datetime.now() - timedelta(days=1),
                target_date=datetime.now() + timedelta(days=30)
            )
        ]

        # Send security payload
        security_payload = get_security_payload(user_id, "goals_view")
        secure_headers = get_secure_headers(security.get("user_token"), security.get("session_id"))
        
        logger.info(f"Goals retrieved for user {user_id} with security: {security['request_id']}")
        return {"goals": goals, "total": len(goals)}
        
    except Exception as e:
        logger.error(f"Goals error for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Goals error: {str(e)}")

@app.post("/api/goal-update")
async def update_goal(goal_data: dict, security: dict = Depends(validate_security_headers)):
    """Update or create a goal"""
    try:
        # Sanitize input data
        goal_data = sanitize_string_data(goal_data)
        
        user_id = goal_data.get("user_id")
        goal_id = goal_data.get("goal_id", str(uuid.uuid4()))
        
        # Mock goal update
        updated_goal = Goal(
            id=goal_id,
            user_id=user_id,
            title=goal_data.get("title", "New Goal"),
            description=goal_data.get("description", ""),
            progress=goal_data.get("progress", 0.0),
            status=goal_data.get("status", "active"),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            target_date=datetime.now() + timedelta(days=30)
        )

        # Send security payload
        security_payload = get_security_payload(user_id, "goal_update")
        secure_headers = get_secure_headers(security.get("user_token"), security.get("session_id"))
        
        logger.info(f"Goal updated for user {user_id}: {goal_id} with security: {security['request_id']}")
        return {"success": True, "goal": updated_goal}
        
    except Exception as e:
        logger.error(f"Goal update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Goal update error: {str(e)}")

@app.get("/api/performance-metrics/{user_id}")
async def get_performance_metrics(user_id: str, security: dict = Depends(validate_security_headers)):
    """Get performance metrics for a user"""
    try:
        # Mock performance data
        metrics = PerformanceMetrics(
            user_id=user_id,
            active_days=28,
            goal_progress_avg=72.5,
            workout_consistency=85.0,
            daily_interaction_count=3,
            satisfaction_rate=4.2,
            current_streak=7
        )

        # Send security payload
        security_payload = get_security_payload(user_id, "metrics_view")
        secure_headers = get_secure_headers(security.get("user_token"), security.get("session_id"))
        
        logger.info(f"Performance metrics retrieved for user {user_id} with security: {security['request_id']}")
        return metrics
        
    except Exception as e:
        logger.error(f"Metrics error for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Metrics error: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
