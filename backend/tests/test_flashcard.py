# tests/test_flashcard.py
import pytest
from unittest.mock import AsyncMock, Mock, patch
from fastapi import HTTPException
import requests

from backend import flashcard


def test_generate_flashcards_parses_valid_json():
    """ทดสอบว่า generate_flashcards() แปลง JSON ถูกต้อง"""
    fake_content = """```json
[
  {"question": "Q1", "answer": "A1"},
  {"question": "Q2", "answer": "A2"}
]
```"""
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json = lambda: {"choices": [{"message": {"content": fake_content}}]}

    with patch("backend.flashcard.requests.post", return_value=mock_response):
        cards = flashcard.generate_flashcards("summary text")
        assert isinstance(cards, list)
        assert len(cards) >= 2
        assert "question" in cards[0]
        assert "answer" in cards[0]


def test_generate_flashcards_timeout_returns_exception():
    """ทดสอบว่าถ้า timeout จะ raise Exception"""
    with patch("backend.flashcard.requests.post", side_effect=requests.Timeout):
        with pytest.raises(Exception) as e:
            flashcard.generate_flashcards("summary")
        assert "timeout" in str(e.value).lower()


@pytest.mark.asyncio
async def test_generate_flashcards_endpoint_document_not_found():
    """document ไม่เจอ -> 404"""
    prisma = Mock()
    prisma.document = Mock()
    prisma.document.find_first = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as e:
        await flashcard.generate_flashcards_endpoint(document_id="x", prisma=prisma)
    assert e.value.status_code == 404


@pytest.mark.asyncio
async def test_generate_flashcards_endpoint_no_summary():
    """มี document แต่ summary ว่าง -> 400"""
    prisma = Mock()
    prisma.document = Mock()
    prisma.document.find_first = AsyncMock(return_value=Mock(summary=""))

    with pytest.raises(HTTPException) as e:
        await flashcard.generate_flashcards_endpoint(document_id="x", prisma=prisma)
    assert e.value.status_code == 400


@pytest.mark.asyncio
async def test_generate_flashcards_endpoint_success():
    """กรณีปกติ - สร้าง flashcard สำเร็จ"""
    prisma = Mock()
    prisma.document = Mock()
    prisma.document.find_first = AsyncMock(return_value=Mock(summary="some summary"))

    fake_cards = [{"question": "Q1", "answer": "A1"}]
    with patch("backend.flashcard.generate_flashcards", return_value=fake_cards):
        res = await flashcard.generate_flashcards_endpoint(document_id="1", prisma=prisma)
        assert isinstance(res, dict)
        assert "flashcards" in res
        assert res["flashcards"] == fake_cards
