from prisma import Prisma
from contextlib import asynccontextmanager
from typing import AsyncGenerator

prisma = Prisma()

@asynccontextmanager
async def get_prisma() -> AsyncGenerator[Prisma, None]:
    try:
        if not prisma.is_connected():
            await prisma.connect()
        yield prisma
    finally:
        if prisma.is_connected():
            await prisma.disconnect()