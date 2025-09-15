import pytest
from httpx import AsyncClient, ASGITransport
from main import app


class FakeUser:
    def __init__(self, email, hashedPassword="hashedpw"):
        self.email = email
        self.hashedPassword = hashedPassword
        self.id = 1


class FakePrisma:
    def __init__(self, user_exists=False):
        self._user_exists = user_exists
        self.user = self

    async def find_unique(self, where):
        if self._user_exists:
            return FakeUser(where["email"])
        return None

    async def create(self, data):
        return FakeUser(data["email"], data["hashedPassword"])


transport = ASGITransport(app=app)


@pytest.mark.asyncio
async def test_register_password_mismatch():
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/register", json={
            "email": "user@example.com",
            "password": "Password123",
            "confirm_password": "Password321"
        })
    assert response.status_code == 400
    assert response.json()["detail"] == "Passwords do not match"


@pytest.mark.asyncio
async def test_register_duplicate_email(monkeypatch):
    async def fake_get_prisma():
        return FakePrisma(user_exists=True)

    monkeypatch.setattr("main.get_prisma", fake_get_prisma)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/register", json={
            "email": "duplicate@example.com",
            "password": "Password123",
            "confirm_password": "Password123"
        })
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


@pytest.mark.asyncio
async def test_login_invalid_email(monkeypatch):
    async def fake_get_prisma():
        return FakePrisma(user_exists=False)

    monkeypatch.setattr("main.get_prisma", fake_get_prisma)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/login", json={
            "email": "notfound@example.com",
            "password": "Password123"
        })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"
