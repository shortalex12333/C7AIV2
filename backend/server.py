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
    "text_chat": "https://ventruk.app.n8n.cloud/webhook/text-chat",
    "voice_chat": "https://ventruk.app.n8n.cloud/webhook/voice-chat",
    "auth_signup": "https://ventruk.app.n8n.cloud/webhook/auth/signup",
    "auth_login": "https://ventruk.app.n8n.cloud/webhook/auth/login",
    "auth_verify_token": "https://ventruk.app.n8n.cloud/webhook/auth/verify-token",
    "auth_logout": "https://ventruk.app.n8n.cloud/webhook/auth/logout",
    "auth_refresh": "https://ventruk.app.n8n.cloud/webhook/auth/refresh"
}

# Helper function to call N8N webhooks
async def call_n8n_webhook(webhook_name: str, payload: Dict[str, Any], user_token: str = None, session_id: str = None, user_id: str = None):
    try:
        headers = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        }
        if user_token:
            headers["Authorization"] = f"Bearer {user_token}"
        if session_id:
            headers["X-Session-ID"] = session_id
            
        # Get webhook URL
        webhook_url = N8N_WEBHOOKS.get(webhook_name, "")
        if not webhook_url:
            logger.error(f"Unknown webhook: {webhook_name}")
            return {"error": "Unknown webhook"}
            
        logger.info(f"Calling N8N webhook: {webhook_name} at {webhook_url}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json=payload,
                headers=headers,
                timeout=30.0  # Increased timeout for AI processing
            )
            
        if response.status_code >= 200 and response.status_code < 300:
            try:
                return response.json()
            except:
                return {"response": response.text}
        else:
            logger.warning(f"N8N webhook {webhook_name} returned status {response.status_code}: {response.text}")
            return {"error": f"Webhook returned status {response.status_code}"}
    except Exception as e:
        logger.error(f"Error calling N8N webhook {webhook_name}: {str(e)}")
        return {"error": str(e)}

# JWT Configuration
SECRET_KEY = "your-secret-key"  # In production, use a secure environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create FastAPI app
app = FastAPI(title="AI Chat Interface API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://voice-text-agent.preview.emergentagent.com",
        "https://b3c8dfa8-1dea-4a86-b15c-c3663969b21c.preview.emergentagent.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# API router
api_router = FastAPI(title="AI Chat Interface API Router")

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
    
    # Verify token with N8N webhook
    try:
        verify_response = await call_n8n_webhook("auth_verify_token", {"token": token})
        
        if verify_response and verify_response.get("valid"):
            return verify_response.get("user", {})
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Models
class MongoBaseModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[str] = Field(None, alias="_id")

class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class TextChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class VoiceChatMessage(BaseModel):
    audio_data: str  # base64 encoded audio
    session_id: Optional[str] = None

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# OPTIONS handlers for auth endpoints to handle CORS preflight
@api_router.options("/auth/signup")
async def auth_signup_options():
    return JSONResponse(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "300"
        }
    )

@api_router.options("/auth/signin")
async def auth_signin_options():
    return JSONResponse(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "300"
        }
    )

@api_router.post("/auth/signup")
async def signup(user_data: UserSignUp):
    try:
        # Call N8N signup webhook
        signup_payload = {
            "email": user_data.email,
            "password": user_data.password,
            "firstName": user_data.firstName,
            "lastName": user_data.lastName
        }
        
        n8n_response = await call_n8n_webhook("auth_signup", signup_payload)
        
        if n8n_response and not n8n_response.get("error"):
            # Return the response from N8N with CORS headers
            return JSONResponse(
                content=n8n_response,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        else:
            error_msg = n8n_response.get("error", "Signup failed")
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
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
        # Call N8N login webhook
        login_payload = {
            "email": user_data.email,
            "password": user_data.password
        }
        
        n8n_response = await call_n8n_webhook("auth_login", login_payload)
        
        if n8n_response and not n8n_response.get("error"):
            # Return the response from N8N with CORS headers
            return JSONResponse(
                content=n8n_response,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        else:
            error_msg = n8n_response.get("error", "Login failed")
            raise HTTPException(
                status_code=401,
                detail=error_msg
            )
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Signin error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during signin"
        )

@api_router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    try:
        # Call N8N logout webhook
        logout_payload = {
            "user_id": current_user.get("id") or current_user.get("user_id")
        }
        
        n8n_response = await call_n8n_webhook("auth_logout", logout_payload)
        
        return JSONResponse(
            content=n8n_response or {"success": True, "message": "Logged out successfully"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Credentials": "true"
            }
        )
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during logout"
        )

@api_router.post("/auth/refresh")
async def refresh_token(request: Request):
    try:
        body = await request.json()
        refresh_token = body.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(
                status_code=400,
                detail="Refresh token is required"
            )
        
        # Call N8N refresh webhook
        refresh_payload = {
            "refresh_token": refresh_token
        }
        
        n8n_response = await call_n8n_webhook("auth_refresh", refresh_payload)
        
        if n8n_response and not n8n_response.get("error"):
            return JSONResponse(
                content=n8n_response,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        else:
            error_msg = n8n_response.get("error", "Token refresh failed")
            raise HTTPException(
                status_code=401,
                detail=error_msg
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Refresh token error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during token refresh"
        )

@api_router.post("/text-chat")
async def text_chat(data: TextChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get("id") or current_user.get("user_id") or current_user.get("sub")
        
        # Generate a session ID if not provided
        session_id = data.session_id or str(uuid.uuid4())
        
        # Store the interaction in the database
        interaction = {
            "user_id": user_id,
            "message": data.message,
            "session_id": session_id,
            "type": "text",
            "timestamp": datetime.now()
        }
        db.chat_interactions.insert_one(interaction)
        
        # Call N8N text chat webhook
        payload = {
            "user_id": user_id,
            "message": data.message,
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
        n8n_response = await call_n8n_webhook("text_chat", payload)
        
        # Store the response
        response_interaction = {
            "user_id": user_id,
            "message": n8n_response.get("response", "No response received"),
            "session_id": session_id,
            "type": "text_response",
            "timestamp": datetime.now()
        }
        db.chat_interactions.insert_one(response_interaction)
        
        return {
            "user_id": user_id,
            "session_id": session_id,
            "response": n8n_response.get("response", "No response received"),
            "audio_response": n8n_response.get("audio_response"),  # base64 audio if available
            "timestamp": datetime.now().isoformat(),
            "success": True
        }
    except Exception as e:
        logger.error(f"Text chat error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during text chat"
        )

@api_router.post("/voice-chat")
async def voice_chat(data: VoiceChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get("id") or current_user.get("user_id") or current_user.get("sub")
        
        # Generate a session ID if not provided
        session_id = data.session_id or str(uuid.uuid4())
        
        # Store the interaction in the database
        interaction = {
            "user_id": user_id,
            "audio_data": data.audio_data,
            "session_id": session_id,
            "type": "voice",
            "timestamp": datetime.now()
        }
        db.chat_interactions.insert_one(interaction)
        
        # Call N8N voice chat webhook
        payload = {
            "user_id": user_id,
            "audio_data": data.audio_data,
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
        n8n_response = await call_n8n_webhook("voice_chat", payload)
        
        # Store the response
        response_interaction = {
            "user_id": user_id,
            "message": n8n_response.get("response", "No response received"),
            "audio_response": n8n_response.get("audio_response"),
            "session_id": session_id,
            "type": "voice_response",
            "timestamp": datetime.now()
        }
        db.chat_interactions.insert_one(response_interaction)
        
        return {
            "user_id": user_id,
            "session_id": session_id,
            "response": n8n_response.get("response", "No response received"),
            "audio_response": n8n_response.get("audio_response"),  # base64 audio response
            "timestamp": datetime.now().isoformat(),
            "success": True
        }
    except Exception as e:
        logger.error(f"Voice chat error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during voice chat"
        )

@api_router.get("/chat-history")
async def get_chat_history(session_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["sub"]
        
        # Build query
        query = {"user_id": user_id}
        if session_id:
            query["session_id"] = session_id
        
        # Get chat history
        chat_history = list(db.chat_interactions.find(query).sort("timestamp", 1))
        
        # Convert ObjectId to string for JSON serialization
        for chat in chat_history:
            chat["_id"] = str(chat["_id"])
            if "timestamp" in chat:
                chat["timestamp"] = chat["timestamp"].isoformat()
        
        return {
            "user_id": user_id,
            "session_id": session_id,
            "chat_history": chat_history,
            "total": len(chat_history)
        }
        
    except Exception as e:
        logger.error(f"Get chat history error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving chat history"
        )

# Mount the API router
app.mount("/api", api_router)

# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    # Create indexes
    db.users.create_index("email", unique=True)
    db.chat_interactions.create_index([("user_id", 1), ("timestamp", -1)])
    db.chat_interactions.create_index([("user_id", 1), ("session_id", 1), ("timestamp", 1)])
    
    logger.info("Connected to the MongoDB database!")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
