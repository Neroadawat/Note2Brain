# tests/test_file.py
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch
import types
from app import app

@pytest.mark.asyncio
async def test_upload_file_success():
    """อัปโหลดไฟล์สำเร็จ (mock file + OCR + summary)"""
    mock_prisma = AsyncMock()
    mock_prisma.document = AsyncMock()
    mock_prisma.document.create = AsyncMock(return_value={
        "id": "doc123",
        "filename": "test.pdf",
        "fullText": "OCR text example",
        "summary": "Summary example",
        "ownerId": 1
    })

    file_content = b"%PDF-1.4 mock pdf content"

    # patch app.get_prisma (route ใช้ get_prisma ที่ import เข้ามาใน app module)
    with patch("app.get_prisma", AsyncMock(return_value=mock_prisma)):
        with patch("app.typhoon_ocr", return_value="OCR text example"):
            with patch("app.typhoon_summary", return_value="Summary example"):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as ac:
                    resp = await ac.post("/upload", files={"file": ("test.pdf", file_content)}, params={"user_id": 1})

    assert resp.status_code == 200
    data = resp.json()
    assert data["ocr_text"] == "OCR text example"
    assert data["summary"] == "Summary example"
    assert data["filename"] == "test.pdf"


@pytest.mark.asyncio
async def test_upload_invalid_format():
    """ป้องกันนามสกุลไฟล์ที่ไม่รองรับ (หรือ OCR อ่านไม่ได้)"""
    mock_prisma = AsyncMock()

    # ให้ typhoon_ocr คืนค่าว่าง (endpoint ของคุณตรวจ `if not ocr_text` แล้วตอบ error payload)
    with patch("app.get_prisma", AsyncMock(return_value=mock_prisma)):
        with patch("app.typhoon_ocr", return_value=""):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post("/upload", files={"file": ("badfile.txt", b"just text")}, params={"user_id": 1})

    # endpoint ใน app.py จะ return {"error": "..."} เมื่อ OCR คืนค่าว่าง — รองรับทั้งกรณีนี้หรืออื่นๆ (>=400)
    if resp.status_code == 200:
        body = resp.json()
        assert "error" in body
    else:
        assert resp.status_code >= 400


@pytest.mark.asyncio
async def test_list_user_files(fake_prisma):
    """ผู้ใช้เห็นเฉพาะไฟล์ของตนเอง (ใช้ fake_prisma จาก conftest เพื่อเติมข้อมูล)"""
    # สร้างสองเอกสารใน fake_prisma
    await fake_prisma.document.create({
        "filename": "file1.pdf",
        "fullText": "x",
        "summary": "s",
        "ownerId": 1
    })
    await fake_prisma.document.create({
        "filename": "file2.pdf",
        "fullText": "y",
        "summary": "t",
        "ownerId": 1
    })

    # ตอนนี้ route จะใช้ fake_prisma อัตโนมัติ (autouse fixture) เพราะ conftest patch get_prisma
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/documents", params={"user_id": 1})

    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["filename"] == "file1.pdf"


@pytest.mark.asyncio
async def test_view_file_detail(fake_prisma):
    """แสดง OCR text + summary ถูกต้อง (ใช้ fake_prisma จาก conftest เพื่อเติมข้อมูล)"""
    # สร้าง document แล้วใช้ id ที่ถูกคืน
    created = await fake_prisma.document.create({
        "filename": "file.pdf",
        "fullText": "OCR text",
        "summary": "Summary text",
        "ownerId": 1
    })
    doc_id = created["id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get(f"/document/{doc_id}")

    assert resp.status_code == 200
    data = resp.json()
    assert data["fullText"] == "OCR text"
    assert data["summary"] == "Summary text"