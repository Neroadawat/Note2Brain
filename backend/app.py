from fastapi import FastAPI, UploadFile, File, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
from PyPDF2 import PdfReader
import tempfile
import io
from db import get_prisma
from quiz import router as quiz_router

app = FastAPI()

app.include_router(quiz_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TYPHOON_API_KEY = "sk-CZSRGqZVrGBdNuGgNGUXVs1R4HWjBlBSi65nIW4oTmy4Z8EC"


def typhoon_ocr(file: UploadFile):
    url = "https://api.opentyphoon.ai/v1/ocr"


    file_bytes = file.file.read()
    pdf_stream = io.BytesIO(file_bytes)


    reader = PdfReader(pdf_stream)
    num_pages = len(reader.pages)
    pages = list(range(1, num_pages + 1)) 

   
    pdf_stream.seek(0)

    files = {"file": (file.filename, pdf_stream, file.content_type)}
    params = {
        "model": "typhoon-ocr-preview",
        "task_type": "default",
        "max_tokens": 16000,
        "temperature": 0.1,
        "top_p": 0.6,
        "repetition_penalty": 1.2,
        "pages": pages
    }
    data = {"params": json.dumps(params)}
    headers = {"Authorization": f"Bearer {TYPHOON_API_KEY}"}

    response = requests.post(url, files=files, data=data, headers=headers)
    if response.status_code != 200:
        raise Exception(f"OCR Error {response.status_code}: {response.text}")

    result = response.json()

    # ✅ รวมข้อความจากทุกหน้า
    ocr_texts = []
    for item in result.get("results", []):
        try:
            content_str = item["message"]["choices"][0]["message"]["content"]
            try:
                content_json = json.loads(content_str)
                page_text = content_json.get("natural_text", "")
            except json.JSONDecodeError:
                page_text = content_str

            if page_text:
                ocr_texts.append(page_text.strip())
        except Exception as inner_e:
            print("Parse page error:", inner_e)

    return "\n".join(ocr_texts).strip()

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
async def upload_file(
    file: UploadFile = File(...),
    user_id: int = Query(...),  # เพิ่ม user_id parameter
    prisma = Depends(get_prisma)  # เพิ่ม prisma dependency
):
    # 1. OCR
    ocr_text = typhoon_ocr(file)
    if not ocr_text:
        return {"error": "OCR ไม่สามารถอ่านไฟล์ได้"}

    # 2. Summarize
    summary = typhoon_summary(ocr_text)

    # 3. Save to database (เพิ่มใหม่)
    document = await prisma.document.create(
        data={
            "filename": file.filename,
            "fullText": ocr_text,
            "summary": summary,
            "ownerId": user_id
        }
    )
    return {
        "filename": file.filename,
        "ocr_text": ocr_text,
        "summary": summary
    }

@app.get("/documents")
async def get_documents(user_id: int, prisma=Depends(get_prisma)):
    docs = await prisma.document.find_many(
        where={"ownerId": user_id},
        order={"createdAt": "desc"}
    )
    return docs

@app.get("/document/{id}")
async def get_document(id: str, prisma=Depends(get_prisma)):
    doc = await prisma.document.find_unique(where={"id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc