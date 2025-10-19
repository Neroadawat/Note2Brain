import pytest
from httpx import AsyncClient, ASGITransport
from app import app


@pytest.mark.asyncio
async def test_register_success():
    """สมัครสำเร็จ (email ยังไม่ซ้ำ, password ตรงกัน)"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/register", json={
            "email": "a@example.com",
            "password": "pass123",
            "confirm_password": "pass123"
        })
    assert resp.status_code == 200
    assert resp.json()["message"] == "User created"


@pytest.mark.asyncio
async def test_register_duplicate_email():
    """สมัครด้วย email ที่มีอยู่แล้ว"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # สมัครครั้งแรก
        await ac.post("/register", json={
            "email": "dup@example.com",
            "password": "abc",
            "confirm_password": "abc"
        })
        # สมัครซ้ำ
        resp = await ac.post("/register", json={
            "email": "dup@example.com",
            "password": "abc",
            "confirm_password": "abc"
        })
    assert resp.status_code == 400
    assert "email already registered" in resp.text.lower()


@pytest.mark.asyncio
async def test_register_password_mismatch():
    """password != confirm_password"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/register", json={
            "email": "b@example.com",
            "password": "a",
            "confirm_password": "b"
        })
    assert resp.status_code == 400
    assert "password" in resp.text.lower()


@pytest.mark.asyncio
async def test_login_success():
    """login สำเร็จ (hash ตรงกัน)"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # สมัคร user ก่อน
        await ac.post("/register", json={
            "email": "c@example.com",
            "password": "p",
            "confirm_password": "p"
        })
        # login
        resp = await ac.post("/login", json={
            "email": "c@example.com",
            "password": "p"
        })
    assert resp.status_code == 200
    assert resp.json()["message"] == "Login successful"


@pytest.mark.asyncio
async def test_login_invalid_email():
    """email ไม่มีในระบบ"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/login", json={
            "email": "noone@example.com",
            "password": "whatever"
        })
    assert resp.status_code == 401
    assert "invalid" in resp.text.lower()


@pytest.mark.asyncio
async def test_login_wrong_password():
    """password ผิด"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # สมัคร user ก่อน
        await ac.post("/register", json={
            "email": "wrongpass@example.com",
            "password": "right",
            "confirm_password": "right"
        })
        # login ผิด password
        resp = await ac.post("/login", json={
            "email": "wrongpass@example.com",
            "password": "wrong"
        })
    assert resp.status_code == 401
    assert "invalid" in resp.text.lower()
