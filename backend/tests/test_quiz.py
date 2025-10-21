# tests/test_quiz.py (แก้ import ให้ส่ง FastAPI instance ให้ ASGITransport)
import pytest
import types
from httpx import AsyncClient, ASGITransport
from unittest.mock import Mock, patch, AsyncMock
import json

# แก้ตรงนี้: นำเข้า FastAPI instance (ชื่อใน backend/app.py เป็น `app`)
from app import app as fastapi_app

import quiz  # โมดูลที่มีฟังก์ชัน generate_quiz_from_llm / parse_quiz_text / router

# ----------------------------
# 1) Unit: parse_quiz_text
# ----------------------------
def test_parse_quiz_text_basic_english():
    src = """
    Q1: What is the capital of France?
    A) Paris
    B) London
    C) Berlin
    D) Rome
    Answer: A
    Explanation: Because Paris is the capital.
    """
    out = quiz.parse_quiz_text(src)
    assert isinstance(out, list)
    assert len(out) >= 1
    first = out[0]
    assert "question" in first and "optionA" in first and "correctAnswer" in first
    assert first["correctAnswer"] == "A"
    assert "Paris" in first["optionA"]


def test_parse_quiz_text_thai_and_numbered():
    src = """
    ข้อ 1. ข้อใดคือสีของท้องฟ้า?
    A. น้ำเงิน
    B. แดง
    C. เขียว
    D. เหลือง
    เฉลย: A
    """
    out = quiz.parse_quiz_text(src)
    assert isinstance(out, list)
    assert len(out) >= 1
    assert out[0]["correctAnswer"] == "A"


# ----------------------------
# 2) Unit: generate_quiz_from_llm (JSON path)
# ----------------------------
def test_generate_quiz_from_llm_json_parse(monkeypatch):
    # จำลอง response ของ LLM ที่คืนเป็น JSON (ใน content)
    fake_quiz = [
        {
            "question": "Q?",
            "optionA": "A1",
            "optionB": "B1",
            "optionC": "C1",
            "optionD": "D1",
            "correctAnswer": "B",
            "explanation": "Because"
        }
    ]
    # LLM content will be JSON stringified
    content = json.dumps(fake_quiz)
    resp = Mock()
    resp.status_code = 200
    resp.json = lambda: {"choices": [{"message": {"content": content}}]}

    # patch requests.post inside quiz module
    with patch("quiz.requests.post", return_value=resp):
        out = quiz.generate_quiz_from_llm("some summary", "medium", 1)
    assert isinstance(out, list)
    assert out[0]["question"] == "Q?"


# ----------------------------
# 3) Unit: generate_quiz_from_llm fallback to text parser
# ----------------------------
def test_generate_quiz_from_llm_fallback_to_text_parser(monkeypatch):
    # LLM returns plain text (not JSON) — should fallback to parse_quiz_text
    text_content = """
    Question 1: Which planet is known as the Red Planet?
    A) Earth
    B) Mars
    C) Venus
    D) Jupiter
    Answer: B
    """
    resp = Mock()
    resp.status_code = 200
    resp.json = lambda: {"choices": [{"message": {"content": text_content}}]}

    with patch("quiz.requests.post", return_value=resp):
        out = quiz.generate_quiz_from_llm("summary text", "easy", 1)
    assert isinstance(out, list)
    assert out[0]["correctAnswer"] == "B"
    assert "Mars" in out[0]["optionB"] or "Mars" in out[0]["question"]


# ----------------------------
# 4) Endpoint: POST /generate-quiz
# ----------------------------
@pytest.mark.asyncio
async def test_generate_quiz_endpoint_success(fake_prisma):
    # เตรียม document ใน fake_prisma
    created_doc = await fake_prisma.document.create({
        "filename": "doc.pdf",
        "fullText": "text",
        "summary": "This is the document summary to base questions on",
        "ownerId": 1
    })
    doc_id = created_doc["id"]

    # quiz_list ที่เราต้องการให้ LLM คืน
    quiz_list = [
        {
            "question": "Q1",
            "optionA": "A1",
            "optionB": "B1",
            "optionC": "C1",
            "optionD": "D1",
            "correctAnswer": "A",
            "explanation": "exp"
        },
        {
            "question": "Q2",
            "optionA": "A2",
            "optionB": "B2",
            "optionC": "C2",
            "optionD": "D2",
            "correctAnswer": "B",
            "explanation": "exp2"
        }
    ]

    # สร้าง mock "quiz" object ที่มี attribute และ dict() เพื่อให้ FastAPI แปลงเป็น JSON ได้
    class QuizResult:
        def __init__(self, id, questions, document):
            self.id = id
            self.questions = questions
            self.document = document
        def dict(self):
            # คืนเป็น dict ที่ JSON-serializable (convert nested SimpleNamespace ถ้ามี)
            def q_to_dict(q):
                if hasattr(q, "__dict__"):
                    return q.__dict__
                return q
            return {
                "id": self.id,
                "questions": [q_to_dict(q) for q in self.questions],
                "document": self.document if isinstance(self.document, dict) else getattr(self.document, "__dict__", self.document)
            }

    created_quiz = QuizResult(
        id="quiz123",
        questions=[types.SimpleNamespace(
            id="q1", question=q["question"], optionA=q["optionA"],
            optionB=q["optionB"], optionC=q["optionC"], optionD=q["optionD"],
            correctAnswer=q["correctAnswer"], explanation=q.get("explanation","")
        ) for q in quiz_list],
        document={"filename": "doc.pdf"}
    )

    # ให้ fake_prisma.quiz.create คืน object นี้
    fake_prisma.quiz = AsyncMock()
    fake_prisma.quiz.create = AsyncMock(return_value=created_quiz)

    # Patch the function that calls LLM to return our quiz_list
    with patch("quiz.generate_quiz_from_llm", return_value=quiz_list):
        transport = ASGITransport(app=fastapi_app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/generate-quiz",
                                 json={"document_id": doc_id, "difficulty": "medium", "question_count": 2},
                                 params={"user_id": 1})

    # debug: ถ้ายัง fail ให้ print(resp.text) เพื่อดู stack trace / message
    assert resp.status_code == 200, f"status {resp.status_code}: {resp.text}"
    body = resp.json()
    assert body["success"] is True
    assert body["quiz_id"] == "quiz123"
    assert body["question_count"] == 2



# ----------------------------
# 5) Endpoint: GET /quizzes
# ----------------------------
@pytest.mark.asyncio
async def test_get_quizzes_endpoint(fake_prisma):
    # prepare fake data
    fake_prisma.quiz = AsyncMock()
    fake_prisma.quiz.find_many = AsyncMock(return_value=[
        {"id": "q1", "difficulty": "medium", "document": {"filename": "d1"}},
        {"id": "q2", "difficulty": "easy", "document": {"filename": "d2"}}
    ])

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/quizzes", params={"user_id": 1})

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
    assert len(body["data"]) == 2


# ----------------------------
# 6) Endpoint: GET /quiz/{quiz_id}
# ----------------------------
@pytest.mark.asyncio
async def test_get_quiz_detail_endpoint(fake_prisma):
    # prepare quiz object
    fake_prisma.quiz = AsyncMock()
    fake_prisma.quiz.find_first = AsyncMock(return_value={
        "id": "quiz42",
        "userId": 1,
        "questions": [{"id": "q1", "question": "Q1", "correctAnswer": "A", "explanation": ""}],
        "document": {"filename": "doc.pdf"}
    })

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/quiz/quiz42", params={"user_id": 1})

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["id"] == "quiz42"


# ----------------------------
# 7) Endpoint: POST /submit-quiz
# ----------------------------
@pytest.mark.asyncio
async def test_submit_quiz_calculation_and_save(fake_prisma):
    # prepare quiz with questions as objects (so code can do question.id, question.correctAnswer)
    q1 = types.SimpleNamespace(id="q1", question="Q1", correctAnswer="A", explanation="e1")
    q2 = types.SimpleNamespace(id="q2", question="Q2", correctAnswer="B", explanation="e2")
    fake_prisma.quiz = AsyncMock()
    fake_prisma.quiz.find_first = AsyncMock(return_value=types.SimpleNamespace(questions=[q1, q2]))

    # prepare quizattempt.create to return an object with id
    fake_prisma.quizattempt = AsyncMock()
    fake_prisma.quizattempt.create = AsyncMock(return_value=types.SimpleNamespace(id="attempt123"))

    # user answers: one correct, one wrong
    payload = {
        "quiz_id": "quiz123",
        "answers": {"q1": "A", "q2": "C"}
    }

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/submit-quiz", json=payload, params={"user_id": 1})

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["score"] == 1
    assert body["total"] == 2
    assert body["attempt_id"] == "attempt123"


# ----------------------------
# 8) Endpoint: GET /quiz-history
# ----------------------------
@pytest.mark.asyncio
async def test_get_quiz_history_endpoint(fake_prisma):
    fake_prisma.quizattempt = AsyncMock()
    fake_prisma.quizattempt.find_many = AsyncMock(return_value=[
        {"id": "a1", "score": 2, "quiz": {"document": {"filename": "d1"}}},
        {"id": "a2", "score": 1, "quiz": {"document": {"filename": "d2"}}}
    ])

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/quiz-history", params={"user_id": 1})

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
    assert len(body["data"]) == 2
