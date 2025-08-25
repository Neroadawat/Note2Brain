from prisma.client import Prisma
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_user(prisma: Prisma, user_id: int):
    return await prisma.user.find_unique(where={"id": user_id})

async def get_user_by_email(prisma: Prisma, email: str):
    return await prisma.user.find_unique(where={"email": email})

async def get_user_by_username(prisma: Prisma, username: str):
    return await prisma.user.find_unique(where={"username": username})

async def create_user(prisma: Prisma, email: str, username: str, password: str):
    hashed_password = get_password_hash(password)
    return await prisma.user.create(
        data={
            "email": email,
            "username": username,
            "hashedPassword": hashed_password,
            "isActive": True
        }
    )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)