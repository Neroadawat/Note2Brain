# backend/flashcard.py
from fastapi import APIRouter, Depends, HTTPException, Body
from db import get_prisma
import requests
import json
import os

router = APIRouter()

TYPHOON_API_KEY = os.getenv("TYPHOON_API_KEY", "sk-CZSRGqZVrGBdNuGgNGUXVs1R4HWjBlBSi65nIW4oTmy4Z8EC")

def generate_flashcards(summary: str, num_questions: int = 10):
    url = "https://api.opentyphoon.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {TYPHOON_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Dynamic JSON template
    json_template = []
    for i in range(1, num_questions + 1):
        json_template.append(f'{{"question": "คำถาม {i}", "answer": "คำตอบ {i}"}}')
    
    prompt = f"""
สร้าง flashcard จากข้อความต่อไปนี้ ให้ครบ {num_questions} ข้อ
ตอบเป็น JSON array เท่านั้น ไม่ต้องมีข้อความอื่น:

[
  {',\n  '.join(json_template)}
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
            {"role": "system", "content": f"คุณคือผู้ช่วยสร้าง flashcard ตอบเป็น JSON array ที่มี {num_questions} ข้อเท่านั้น"},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 3000 if num_questions > 10 else 2000,
        "temperature": 0.8
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
        
        # ตรวจสอบจำนวนข้อ
        if len(flashcards) < num_questions:
            # เพิ่มข้อเติมถ้าไม่ครบ
            while len(flashcards) < num_questions:
                flashcards.append({
                    "question": f"Additional question {len(flashcards) + 1}",
                    "answer": "Answer from the content studied"
                })
        elif len(flashcards) > num_questions:
            # ตัดให้เหลือตามจำนวนที่ต้องการ
            flashcards = flashcards[:num_questions]
            
        return flashcards
        
    except requests.Timeout:
        raise Exception("Request timeout. Please try again.")
    except json.JSONDecodeError:
        raise Exception("Failed to parse AI response. Please try again.")
    except Exception as e:
        raise Exception(f"Error occurred: {str(e)}")

@router.post("/flashcards/generate")
async def generate_flashcards_endpoint(
    document_id: str = Body(...),
    num_questions: int = Body(10),
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
            
        # สร้าง flashcards ตามจำนวนที่เลือก
        flashcards = generate_flashcards(document.summary, num_questions)
        
        return {"flashcards": flashcards, "count": len(flashcards)}
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        if "API" in error_message:
            raise HTTPException(status_code=503, detail=f"AI service unavailable: {error_message}")
        elif "timeout" in error_message.lower():
            raise HTTPException(status_code=408, detail="Request timeout. Please try again.")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {error_message}")