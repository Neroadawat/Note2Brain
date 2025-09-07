# quiz.py
from fastapi import APIRouter, Query, Depends, HTTPException
from pydantic import BaseModel
from db import get_prisma
import requests
import json
import os
import re

router = APIRouter()

# ⚡ ใช้ environment variable แทน hardcode key
TYPHOON_API_KEY = "sk-CZSRGqZVrGBdNuGgNGUXVs1R4HWjBlBSi65nIW4oTmy4Z8EC"


# ==============================
# Pydantic request model
# ==============================
class QuizGenerateRequest(BaseModel):
    document_id: str
    difficulty: str = "medium"  # easy, medium, hard
    question_count: int = 3


# ==============================
# Robust Text Parser
# ==============================
def parse_quiz_text(llm_text: str):
    """
    แปลง text ของ LLM (ไม่เป็น JSON) ให้เป็น list ของ dict
    [{
        "question": "...",
        "optionA": "...",
        "optionB": "...",
        "optionC": "...",
        "optionD": "...",
        "correctAnswer": "A|B|C|D",
        "explanation": "..."
    }]
    """
    quizzes = []

    # แบ่ง block ตาม pattern: Q1, Q2, ... หรือ "Question 1"
    blocks = re.split(r"(?:Q\d+|Question \d+)\s*[:.\-]?", llm_text, flags=re.IGNORECASE)
    
    for block in blocks:
        block = block.strip()
        if not block:
            continue

        # ดึง question
        question_match = re.search(r"(.*?)(?:\n|$)", block)
        question = question_match.group(1).strip() if question_match else "No question found"

        # ดึง options A-D
        options = {}
        for opt in ["A", "B", "C", "D"]:
            opt_match = re.search(rf"{opt}\s*[:.\-]?\s*(.*?)(?:\n|$)", block)
            options[f"option{opt}"] = opt_match.group(1).strip() if opt_match else f"Option {opt}"

        # ดึง correctAnswer
        answer_match = re.search(r"(Answer|Correct answer)\s*[:.\-]?\s*([A-D])", block, re.IGNORECASE)
        correct = answer_match.group(2).strip().upper() if answer_match else "A"

        # ดึง explanation (ถ้ามี)
        expl_match = re.search(r"(Explanation|Reason|Because)\s*[:.\-]?\s*(.*)", block, re.IGNORECASE)
        explanation = expl_match.group(2).strip() if expl_match else ""

        quizzes.append({
            "question": question,
            "optionA": options["optionA"],
            "optionB": options["optionB"],
            "optionC": options["optionC"],
            "optionD": options["optionD"],
            "correctAnswer": correct,
            "explanation": explanation
        })

    return quizzes


# ==============================
# Typhoon LLM Quiz Generator
# ==============================
def generate_quiz_from_llm(summary: str, difficulty: str, count: int):
    """
    ส่งข้อความ summary ไปให้ Typhoon LLM
    และให้ generate quiz แบบ multiple-choice
    """
    url = "https://api.opentyphoon.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {TYPHOON_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
สร้าง {count} ข้อคำถาม multiple-choice เกี่ยวกับข้อความนี้
รูปแบบ **JSON array**:
[
  {{
    "question": "...",
    "optionA": "...",
    "optionB": "...",
    "optionC": "...",
    "optionD": "...",
    "correctAnswer": "A|B|C|D",
    "explanation": "..."
  }}
]
ความยาก: {difficulty}

ข้อความ:
{summary}
"""


    payload = {
        "model": "typhoon-v2.1-12b-instruct",
        "messages": [
            {"role": "system", "content": "คุณคือผู้ช่วยสร้างข้อสอบ multiple-choice"},
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"LLM Error: {response.text}")

    content = response.json()["choices"][0]["message"]["content"]

    # ==============================
    # Parser: ลอง JSON ก่อน ถ้า error ใช้ robust text parser
    # ==============================
    try:
        quiz_data = json.loads(content)
    except json.JSONDecodeError:
        quiz_data = parse_quiz_text(content)

    return quiz_data


# ==============================
# Generate Quiz Endpoint
# ==============================
@router.post("/generate-quiz")
async def generate_quiz(
    request: QuizGenerateRequest,
    user_id: int = Query(...),
    prisma = Depends(get_prisma)
):
    # 1️⃣ ตรวจสอบ document ของ user
    document = await prisma.document.find_first(
        where={
            "id": request.document_id,
            "ownerId": user_id
        }
    )
    if not document:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสารหรือไม่มีสิทธิ์เข้าถึง")

    # 2️⃣ สร้าง quiz ผ่าน LLM
    quiz_data = generate_quiz_from_llm(
        document.summary,
        request.difficulty,
        request.question_count
    )

    # 3️⃣ Save Quiz + Questions ลง DB
    quiz = await prisma.quiz.create(
        data={
            "userId": user_id,
            "documentId": request.document_id,
            "difficulty": request.difficulty,
            "questions": {
                "create": [
                    {
                        "question": q["question"],
                        "optionA": q["optionA"],
                        "optionB": q["optionB"],
                        "optionC": q["optionC"],
                        "optionD": q["optionD"],
                        "correctAnswer": q["correctAnswer"],
                        "explanation": q.get("explanation")
                    }
                    for q in quiz_data
                ]
            }
        },
        include={
            "questions": True,
            "document": True
        }
    )

    return {"success": True, "data": quiz}
