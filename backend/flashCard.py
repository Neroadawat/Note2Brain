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
สร้าง flashcard จากข้อความต่อไปนี้ ให้ครบ 10 ข้อ
ตอบเป็น JSON array เท่านั้น ไม่ต้องมีข้อความอื่น:

[
  {{"question": "คำถาม 1", "answer": "คำตอบ 1"}},
  {{"question": "คำถาม 2", "answer": "คำตอบ 2"}},
  {{"question": "คำถาม 3", "answer": "คำตอบ 3"}},
  {{"question": "คำถาม 4", "answer": "คำตอบ 4"}},
  {{"question": "คำถาม 5", "answer": "คำตอบ 5"}},
  {{"question": "คำถาม 6", "answer": "คำตอบ 6"}},
  {{"question": "คำถาม 7", "answer": "คำตอบ 7"}},
  {{"question": "คำถาม 8", "answer": "คำตอบ 8"}},
  {{"question": "คำถาม 9", "answer": "คำตอบ 9"}},
  {{"question": "คำถาม 10", "answer": "คำตอบ 10"}}
]

คำถามควรครอบคลุมเนื้อหาสำคัญ ได้แก่:
- แนวคิดหลัก
- คำศัพท์สำคัญ
- ข้อมูลเชิงข้อเท็จจริง
- การประยุกต์ใช้
- ตัวอย่างที่สำคัญ

ข้อความ:
{summary}
"""

    payload = {
        "model": "typhoon-v2.1-12b-instruct",
        "messages": [
            {"role": "system", "content": "คุณคือผู้ช่วยสร้าง flashcard ตอบเป็น JSON array ที่มี 10 ข้อเท่านั้น"},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 2000,
        "temperature": 0.7
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=90)
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
        
        # ตรวจสอบว่ามี 10 ข้อหรือไม่
        if len(flashcards) < 10:
            # เพิ่มข้อเติมถ้าไม่ครบ
            while len(flashcards) < 10:
                flashcards.append({
                    "question": f"Additional question {len(flashcards) + 1}",
                    "answer": "Answer from the content studied"
                })
        elif len(flashcards) > 10:
            # ตัดให้เหลือ 10 ข้อ
            flashcards = flashcards[:10]
            
        return flashcards
        
    except requests.Timeout:
        raise Exception("Request timeout. Please try again.")
    except json.JSONDecodeError:
        raise Exception("Failed to parse AI response. Please try again.")
    except Exception as e:
        raise Exception(f"Error occurred: {str(e)}")

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
            raise HTTPException(status_code=404, detail="Document not found")
        
        if not document.summary:
            raise HTTPException(status_code=400, detail="Document summary not available. Please upload document again.")
            
        # พยายามสร้าง flashcards
        flashcards = generate_flashcards(document.summary)
        
        return {"flashcards": flashcards}
        
    except HTTPException:
        # ส่งต่อ HTTPException เดิม
        raise
    except Exception as e:
        # แปลง error ทั้งหมดเป็น HTTPException
        error_message = str(e)
        if "API" in error_message:
            raise HTTPException(status_code=503, detail=f"AI service unavailable: {error_message}")
        elif "timeout" in error_message.lower():
            raise HTTPException(status_code=408, detail="Request timeout. Please try again.")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {error_message}")