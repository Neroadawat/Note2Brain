from fastapi import FastAPI, UploadFile, File
import requests
import openai
import os

app = FastAPI()

# ตั้งค่า API key
TYPHOON_API_KEY = "sk-CZSRGqZVrGBdNuGgNGUXVs1R4HWjBlBSi65nIW4oTmy4Z8EC"
OPENAI_API_KEY = "YOUR_OPENAI_KEY"
openai.api_key = OPENAI_API_KEY


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # 1. OCR → ส่งไฟล์ไปยัง Typhoon API
    ocr_result = requests.post(
        "https://api.typhoonocr.com/ocr",
        headers={"Authorization": f"Bearer {TYPHOON_API_KEY}"},
        files={"file": (file.filename, file.file, file.content_type)}
    )
    ocr_text = ocr_result.json().get("text", "")

    if not ocr_text:
        return {"error": "OCR ไม่สามารถอ่านไฟล์ได้"}

    # 2. สรุปเนื้อหา → เรียก LLM API
    summary = summarize_text(ocr_text)

    return {
        "filename": file.filename,
        "ocr_text": ocr_text,
        "summary": summary
    }


def summarize_text(text: str):
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "คุณคือผู้ช่วยที่เก่งในการสรุปเนื้อหา"},
            {"role": "user", "content": f"สรุปเนื้อหาต่อไปนี้ให้อ่านง่าย กระชับ:\n\n{text}"}
        ]
    )
    return response["choices"][0]["message"]["content"]