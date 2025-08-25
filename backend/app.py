from fastapi import FastAPI, UploadFile, File
import requests
import json

app = FastAPI()

TYPHOON_API_KEY = "sk-CZSRGqZVrGBdNuGgNGUXVs1R4HWjBlBSi65nIW4oTmy4Z8EC"


def typhoon_ocr(file: UploadFile):
    url = "https://api.opentyphoon.ai/v1/ocr"

    files = {"file": (file.filename, file.file, file.content_type)}
    params = {
        "model": "typhoon-ocr-preview",
        "task_type": "default",
        "max_tokens": 16000,
        "temperature": 0.1,
        "top_p": 0.6,
        "repetition_penalty": 1.2,
        "pages": [1]
    }
    data = {"params": json.dumps(params)}
    headers = {"Authorization": f"Bearer {TYPHOON_API_KEY}"}

    response = requests.post(url, files=files, data=data, headers=headers)


def typhoon_summary(text: str):
    url = "https://api.opentyphoon.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {TYPHOON_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "typhoon-v2.1-12b-instruct",   # เลือกรุ่น LLM ที่มี
        "messages": [
            {"role": "system", "content": "สรุปข้อความให้อ่านง่าย กระชับ"},
            {"role": "user", "content": text}
        ]
    }

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        raise Exception(f"Summary Error {response.status_code}: {response.text}")

    return response.json()["choices"][0]["message"]["content"]


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # 1. OCR
    ocr_text = typhoon_ocr(file)
    if not ocr_text:
        return {"error": "OCR ไม่สามารถอ่านไฟล์ได้"}

    # 2. Summarize
    summary = typhoon_summary(ocr_text)

    return {
        "filename": file.filename,
        "ocr_text": ocr_text,
        "summary": summary
    }
