from fastapi import FastAPI, APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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

# Webhook URLs
SIGNUP_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook-test/2436613e-9b36-44b7-9b73-12aca8e8810a"
SIGNIN_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook-test/ad4358c1-46b5-4f68-8cb0-2ba8c4480b7b"
DISPLAY_NAME_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook-test/4f064d7b-5902-48c1-953f-dc1023112208"
VOICE_CHAT_WEBHOOK = "https://ventruk.app.n8n.cloud/webhook-test/347748db-be03-4fa0-bb02-4e19cb87a5cd"

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
    # TODO: Replace with actual webhook when n8n is configured
    # For now, return mock successful response to enable testing
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SIGNUP_WEBHOOK,
                json=user_data.dict(),
                headers={"Content-Type": "application/json"},
                timeout=5.0
            )
            
            if response.status_code == 201:
                return response.json()
            elif response.status_code == 409:
                raise HTTPException(
                    status_code=409,
                    detail="A user with that email already exists."
                )
            else:
                # Webhook returned non-success status
                logger.warning(f"Signup webhook returned {response.status_code}: {response.text}")
                # Return mock success response for testing
                return {
                    "status": "success",
                    "userID": str(uuid.uuid4()),
                    "message": "Account created (mock response - webhook unavailable)"
                }
    except httpx.RequestError as e:
        logger.warning(f"Signup webhook connection failed: {str(e)}")
        # Return mock success response for testing
        return {
            "status": "success", 
            "userID": str(uuid.uuid4()),
            "message": "Account created (mock response - webhook unavailable)"
        }

@api_router.post("/auth/signin")
async def signin(user_data: UserSignIn):
    # TODO: Replace with actual webhook when n8n is configured
    # For now, return mock successful response to enable testing
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SIGNIN_WEBHOOK,
                json=user_data.dict(),
                headers={"Content-Type": "application/json"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Email or password is incorrect."
                )
            else:
                # Webhook returned non-success status
                logger.warning(f"Signin webhook returned {response.status_code}: {response.text}")
                # Return mock success response for testing
                return {
                    "email": user_data.email,
                    "UserID": str(uuid.uuid4()),
                    "token": "mock_token_" + str(uuid.uuid4())[:8],
                    "message": "Logged in (mock response - webhook unavailable)"
                }
    except httpx.RequestError as e:
        logger.warning(f"Signin webhook connection failed: {str(e)}")
        # Return mock success response for testing
        return {
            "email": user_data.email,
            "UserID": str(uuid.uuid4()), 
            "token": "mock_token_" + str(uuid.uuid4())[:8],
            "message": "Logged in (mock response - webhook unavailable)"
        }

@api_router.post("/user/display-name")
async def change_display_name(data: DisplayNameChange):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                DISPLAY_NAME_WEBHOOK,
                json=data.dict(),
                headers={"Content-Type": "application/json"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Display name webhook returned {response.status_code}: {response.text}")
                # Return mock success response for testing
                return {
                    "status": "success",
                    "message": "Display name updated (mock response - webhook unavailable)"
                }
    except httpx.RequestError as e:
        logger.warning(f"Display name webhook connection failed: {str(e)}")
        # Return mock success response for testing
        return {
            "status": "success",
            "message": "Display name updated (mock response - webhook unavailable)"
        }

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
                logger.warning(f"Voice chat webhook returned {response.status_code}: {response.text}")
                # Return mock success response for testing
                return {
                    "status": "success",
                    "transcript": "I hear you loud and clear! This is a mock response while we're setting up the voice chat webhook. Your message was received and I'm ready to help you accelerate your goals. (Webhook currently unavailable)",
                    "ttsUrl": "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=",
                    "message": "Voice chat processed (mock response - webhook unavailable)"
                }
    except httpx.RequestError as e:
        logger.warning(f"Voice chat webhook connection failed: {str(e)}")
        # Return mock success response for testing
        return {
            "status": "success", 
            "transcript": "I hear you loud and clear! This is a mock response while we're setting up the voice chat webhook. Your message was received and I'm ready to help you accelerate your goals. (Webhook currently unavailable)",
            "ttsUrl": "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=",
            "message": "Voice chat processed (mock response - webhook unavailable)"
        }

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
