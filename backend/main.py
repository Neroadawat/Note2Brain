from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from db import get_prisma
import crud
import uvicorn

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    async with get_prisma() as prisma:
        try:
            existing_email = await crud.get_user_by_email(prisma, user.email)
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            existing_username = await crud.get_user_by_username(prisma, user.username)
            if existing_username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            
            new_user = await crud.create_user(prisma, user.email, user.username, user.password)
            return {"message": "User created successfully", "user_id": new_user.id}
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    async with get_prisma() as prisma:
        try:
            user = await crud.get_user_by_username(prisma, form_data.username)
            if not user or not crud.verify_password(form_data.password, user.hashedPassword):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password"
                )
            return {"message": "Login successful", "user_id": user.id}
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)