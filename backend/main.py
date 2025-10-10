from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from db import get_prisma
import bcrypt
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str
    confirm_password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
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

@router.post("/login")
async def login(data: LoginRequest):
    prisma = await get_prisma()
    user = await prisma.user.find_unique(where={"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not bcrypt.checkpw(data.password.encode(), user.hashedPassword.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"message": "Login successful", "user_id": user.id}

@router.get("/document/{id}/quiz")
async def get_quiz_for_document(id: str, prisma=Depends(get_prisma)):
    quiz = await prisma.quiz.find_first(where={"documentId": id}, include={"questions": True, "document": True})
    if not quiz:
        return {"questions": [], "documentName": ""}
    return {
        "documentName": quiz.document.filename,
        "questions": quiz.questions
    }