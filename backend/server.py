import os
import uuid
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, APIRouter, HTTPException, status, UploadFile, File, Form, Depends
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

# Supabase setup
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("Missing Supabase credentials")
    supabase: Optional[Client] = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    logger.info("Supabase client initialized")

# Security helper function (placeholder until we get the security file)
def get_security_payload(user_id: str, action: str) -> Dict[str, Any]:
    """Generate security payload for N8N webhooks"""
    return {
        "user_id": user_id,
        "action": action,
        "timestamp": datetime.utcnow().isoformat(),
        "source": "celeste7_dashboard",
        # TODO: Add security parameters from the PDF file
        "security_token": "placeholder_token"
    }

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
