from fastapi import APIRouter, Depends, HTTPException, Body
from db import get_prisma
import requests
import json
import os

router = APIRouter()

TYPHOON_API_KEY = "sk-CZSRGqZVrGBdNuGgNGUXVs1R4HWjBlBSi65nIW4oTmy4Z8EC" # ใช้ env variable จริง

def generate_flashcards(summary: str):
    url = "https://api.opentyphoon.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {TYPHOON_API_KEY}",
        "Content-Type": "application/json"
    }
    prompt = """
สร้าง flashcard (คำถาม-คำตอบ) จากข้อความนี้
รูปแบบ JSON array:
[
  {"question": "...", "answer": "..."},
  ...
]
ข้อความ:
""" + summary

    payload = {
        "model": "typhoon-v2.1-12b-instruct",
        "messages": [
            {"role": "system", "content": "คุณคือผู้ช่วยสร้าง flashcard"},
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        raise Exception(f"Flashcard Error {response.status_code}: {response.text}")
    content = response.json()["choices"][0]["message"]["content"]
    try:
        flashcards = json.loads(content)
    except Exception:
        flashcards = []
    return flashcards

@router.post("/flashcards/generate")
async def generate_flashcards_endpoint(
    document_id: str = Body(...),
    user_id: int = Body(...),
    prisma = Depends(get_prisma)
):
    document = await prisma.document.find_first(
        where={"id": document_id, "ownerId": user_id}
    )
    if not document:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสารหรือไม่มีสิทธิ์เข้าถึง")
    flashcards = generate_flashcards(document.summary)
    # สามารถบันทึก flashcards ลงฐานข้อมูลได้ที่นี่ถ้าต้องการ
    return {"flashcards": flashcards}