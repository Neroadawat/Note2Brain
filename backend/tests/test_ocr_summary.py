# tests/test_ocr_summary.py
import types
from io import BytesIO
from unittest.mock import Mock, patch

import app


def make_response(status_code: int, json_data):
    m = Mock()
    m.status_code = status_code
    m.json = lambda: json_data
    return m


class FakePdfReader:
    """
    Fake PdfReader ที่มี attribute .pages (list) เพื่อให้โค้ดที่เรียก
    len(reader.pages) ทำงานได้โดยไม่ต้องอ่าน PDF จริง
    """
    def __init__(self, stream):
        # ไม่อ่าน stream จริง ๆ — แค่จำลองว่ามี 1 หน้า
        self.pages = [1]


def test_ocr_process_text_from_image():
    """OCR คืนข้อความจากไฟล์ PDF (ทดสอบ path ที่ response เป็น JSON-string)"""
    # เตรียม UploadFile-like object (มี .file)
    dummy_file = types.SimpleNamespace(file=BytesIO(b"%PDF-1.4 fake pdf"), filename="test.pdf", content_type="application/pdf")

    # จำลอง response จาก Typhoon OCR: results list ที่ message.choices[0].message.content เป็น JSON string
    result_json = {
        "results": [
            {
                "message": {
                    "choices": [
                        {"message": {"content": '{"natural_text": "Extracted page text"}'}}
                    ]
                }
            }
        ]
    }

    # Patch ทั้ง PdfReader และ requests.post
    with patch("app.PdfReader", FakePdfReader):
        with patch("app.requests.post", return_value=make_response(200, result_json)):
            out = app.typhoon_ocr(dummy_file)

    assert isinstance(out, str)
    assert "Extracted page text" in out


def test_summarization_short_text():
    """สรุปข้อความสั้นได้ (mock Typhoon summary API)"""
    text = "Software engineering focuses on software development process."

    summary_json = {"choices": [{"message": {"content": "Focus on software process."}}]}
    with patch("app.requests.post", return_value=make_response(200, summary_json)):
        out = app.typhoon_summary(text)

    assert isinstance(out, str)
    assert len(out) < len(text)
    assert "software" in out.lower()
