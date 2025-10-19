# conftest.py
import sys
from pathlib import Path
import types
import pytest
from importlib import import_module

# เพิ่ม backend root เข้า sys.path ก่อน import app/db
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# นำเข้า app (FastAPI instance) และฟังก์ชันของ db เพื่อใช้เป็น key ใน dependency_overrides
from app import app
from db import get_prisma  # ใช้เพื่อ set app.dependency_overrides key


@pytest.fixture
def fake_prisma():
    class FakeUser:
        def __init__(self):
            self._users = {}
            self._id = 1

        async def find_unique(self, where):
            # คืนค่า object หรือ None เหมือน prisma user
            return self._users.get(where.get("email"))

        async def create(self, data):
            user = types.SimpleNamespace(
                id=self._id,
                email=data["email"],
                hashedPassword=data["hashedPassword"]
            )
            self._users[user.email] = user
            self._id += 1
            return user

    class FakeDocument:
        def __init__(self):
            self._docs = {}
            self._id = 1

        async def create(self, data):
            """
            เก็บเป็น dict เพื่อให้ FastAPI สามารถ return -> JSON ได้ตรง
            """
            doc_id = str(self._id)
            obj = {
                "id": doc_id,
                "filename": data.get("filename"),
                "fullText": data.get("fullText"),
                "summary": data.get("summary"),
                "ownerId": data.get("ownerId"),
                "createdAt": data.get("createdAt")
            }
            self._docs[doc_id] = obj
            self._id += 1
            return obj

        async def find_many(self, where=None, order=None):
            """
            คืน list ของ dict
            ถ้ามี where={"ownerId": X} ให้กรองตาม ownerId
            """
            docs = list(self._docs.values())
            if where and "ownerId" in where:
                owner = where["ownerId"]
                docs = [d for d in docs if d.get("ownerId") == owner]
            # สามารถรองรับ order ถ้าต้องการ (ตอนนี้ไม่จำเป็น)
            return docs

        async def find_unique(self, where):
            doc_id = where.get("id")
            return self._docs.get(doc_id)

    class FakePrisma:
        def __init__(self):
            self.user = FakeUser()
            self.document = FakeDocument()

        async def connect(self):
            pass

        def is_connected(self):
            return True

    return FakePrisma()


@pytest.fixture(autouse=True)
def override_get_prisma(fake_prisma):
    """
    ทำสองอย่าง:
    1) override FastAPI dependency (app.dependency_overrides)
    2) patch db.get_prisma และ patch get_prisma ในโมดูลอื่นๆ (เช่น main/app) ที่อาจ import ไว้แล้ว
    """
    async def _get_prisma():
        return fake_prisma

    # 1) override FastAPI dependency
    app.dependency_overrides[get_prisma] = _get_prisma

    # 2) patch db.get_prisma และโมดูลอื่นๆ ที่มี attribute ชื่อ get_prisma
    patched = []  # list ของ (module, original_value) เพื่อ restore ทีหลัง

    try:
        # patch โมดูล db โดยตรง
        db_mod = import_module("db")
        if hasattr(db_mod, "get_prisma"):
            original = getattr(db_mod, "get_prisma")
            patched.append((db_mod, original))
            setattr(db_mod, "get_prisma", _get_prisma)
        else:
            # ถ้าไม่มี attribute เดิม ให้สร้าง attribute ใหม่แล้วบันทึก original เป็น None
            patched.append((db_mod, None))
            setattr(db_mod, "get_prisma", _get_prisma)

        # patch โมดูลอื่น ๆ ที่อาจ import get_prisma ไว้ (เช่น main, app, routes)
        # จะตรวจทุกโมดูลที่โหลดใน sys.modules และแทนเฉพาะถ้า attribute มีอยู่จริงและยังไม่ถูกแทนด้วย _get_prisma
        for name, module in list(sys.modules.items()):
            if module is None:
                continue
            # ข้ามตัว db ที่ patch แล้ว
            if module is db_mod:
                continue
            if hasattr(module, "get_prisma"):
                cur = getattr(module, "get_prisma")
                # อย่าแทนถ้ามันอยู่แล้วเป็นฟังก์ชันเรา
                if cur is not _get_prisma:
                    patched.append((module, cur))
                    try:
                        setattr(module, "get_prisma", _get_prisma)
                    except Exception:
                        # ถ้าไม่สามารถ setattr ได้ ให้ข้าม
                        pass

        yield

    finally:
        # restore app overrides
        app.dependency_overrides.clear()
        # คืนค่าทุกโมดูลที่เรา patch
        for module, original in patched:
            try:
                if original is None:
                    # ถ้าไม่มี original ให้ลบ attribute ถ้าเป็นไปได้
                    if hasattr(module, "get_prisma"):
                        try:
                            delattr(module, "get_prisma")
                        except Exception:
                            # ถ้า delattr ไม่ได้ ให้ตั้งค่าเป็น stub ที่โยน error (ปลอดภัยกว่าคงค่าผิดพลาด)
                            def _missing():
                                raise RuntimeError("original get_prisma missing")
                            try:
                                setattr(module, "get_prisma", _missing)
                            except Exception:
                                pass
                else:
                    setattr(module, "get_prisma", original)
            except Exception:
                # อย่าให้การ restore ทำให้ test ล้มอีกครั้ง
                pass
