# backend/flashcard.py
from fastapi import APIRouter, Depends, HTTPException, Body
from db import get_prisma
import requests
import json
import os

router = APIRouter()

TYPHOON_API_KEY = os.getenv("TYPHOON_API_KEY", "sk-CZSRGqZVrGBdNuGgNGUXVs1R4HWjBlBSi65nIW4oTmy4Z8EC")

def generate_flashcards(summary: str):
    url = "https://api.opentyphoon.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {TYPHOON_API_KEY}",
        "Content-Type": "application/json"
    }
    prompt = f"""
สร้าง flashcard (คำถาม-คำตอบ) จากข้อความนี้
รูปแบบ JSON array เท่านั้น ไม่ต้องมีข้อความอื่น:
[
  {{"question": "คำถาม 1", "answer": "คำตอบ 1"}},
  {{"question": "คำถาม 2", "answer": "คำตอบ 2"}}
]

ข้อความ:
{summary}
"""

    payload = {
        "model": "typhoon-v2.1-12b-instruct",
        "messages": [
            {"role": "system", "content": "คุณคือผู้ช่วยสร้าง flashcard ตอบเป็น JSON array เท่านั้น"},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1500,  # เพิ่ม limit
        "temperature": 0.7
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)  # เพิ่ม timeout
        if response.status_code != 200:
            raise Exception(f"Flashcard Error {response.status_code}: {response.text}")
        
        content = response.json()["choices"][0]["message"]["content"]
        # ลบ ```json และ ``` ถ้ามี
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        flashcards = json.loads(content)
        return flashcards
    except requests.Timeout:
        print("Timeout error: API took too long to respond")
        return []
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        return []

@router.post("/flashcards/generate")
async def generate_flashcards_endpoint(
    document_id: str = Body(..., embed=True),
    prisma = Depends(get_prisma)
):
    try:
        document = await prisma.document.find_first(
            where={"id": document_id}
        )
        if not document:
            raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")
        
        if not document.summary:
            raise HTTPException(status_code=400, detail="เอกสารยังไม่มีสรุป")
            
        flashcards = generate_flashcards(document.summary)
        
        # ถ้า API ไม่ได้ ใช้ fallback
        if not flashcards:
            flashcards = [
                {"question": "เนื้อหาหลักของเอกสารนี้คืออะไร?", "answer": document.summary[:200] + "..."},
                {"question": "สาระสำคัญที่ควรจำคืออะไร?", "answer": "ดูจากเนื้อหาที่สรุปไว้"}
            ]
            
        return {"flashcards": flashcards}
    except Exception as e:
        print(f"Endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))