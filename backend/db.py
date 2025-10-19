# backend/db.py
from prisma import Prisma

prisma = Prisma()

async def get_prisma():
    if not prisma.is_connected():
        await prisma.connect()
    return prisma
