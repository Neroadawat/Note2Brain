from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from db import get_prisma
import bcrypt
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    email: str
    password: str
    confirm_password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/register")
async def register(data: RegisterRequest):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    prisma = await get_prisma()
    user = await prisma.user.find_unique(where={"email": data.email})
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user = await prisma.user.create(
        data={
            "email": data.email,
            "hashedPassword": hashed,
        }
    )
    return {"message": "User created", "user_id": user.id}

@app.post("/login")
async def login(data: LoginRequest):
    prisma = await get_prisma()
    user = await prisma.user.find_unique(where={"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not bcrypt.checkpw(data.password.encode(), user.hashedPassword.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"message": "Login successful", "user_id": user.id}