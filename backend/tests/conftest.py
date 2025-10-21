# backend/tests/conftest.py
import sys
from pathlib import Path
import types
import pytest
from importlib import import_module

# เพิ่ม backend folder (root ของ backend) ลงใน sys.path ก่อน import โมดูลภายใน backend
ROOT = Path(__file__).resolve().parents[1]  # backend/
sys.path.insert(0, str(ROOT))

# นำเข้า app (FastAPI instance) และ get_prisma จาก db
try:
    from app import app
except Exception as e:
    raise ImportError(f"ไม่สามารถ import FastAPI app ได้: {e}")

try:
    from db import get_prisma
except Exception as e:
    raise ImportError(f"ไม่สามารถ import db.get_prisma ได้: {e}")


@pytest.fixture
def fake_prisma():
    class FakeUser:
        def __init__(self):
            self._users = {}
            self._id = 1

        async def find_unique(self, where):
            # คืนค่า object หรือ None เหมือน prisma user
            # where อาจเป็น {"email": "..."} หรือ {"id": ...}
            key = where.get("email") or where.get("id")
            return self._users.get(key)

        async def create(self, data):
            user = types.SimpleNamespace(
                id=self._id,
                email=data["email"],
                hashedPassword=data.get("hashedPassword") or data.get("hashed_password")
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
            return docs

        async def find_unique(self, where):
            """
            find_unique มักใช้กับ unique key เช่น id หรือ filename
            คืน dict (เหมือน create) เพื่อความเข้ากันกับเทสต์อื่น
            """
            doc_id = where.get("id")
            if doc_id is not None:
                return self._docs.get(str(doc_id))
            filename = where.get("filename")
            if filename:
                for d in self._docs.values():
                    if d.get("filename") == filename:
                        return d
            return None

        async def find_first(self, where=None):
            """
            Emulate prisma.find_first(where={...}) BUT คืน object ที่มี attribute
            (types.SimpleNamespace) เพราะโค้ดในบาง endpoint จะเข้าถึง document.summary
            """
            if not where:
                first = next(iter(self._docs.values()), None)
                return types.SimpleNamespace(**first) if first is not None else None

            doc_id = where.get("id")
            owner = where.get("ownerId")

            if doc_id is not None:
                doc = self._docs.get(str(doc_id))
                if doc is None:
                    return None
                if owner is not None and doc.get("ownerId") != owner:
                    return None
                return types.SimpleNamespace(**doc)

            if owner is not None:
                for d in self._docs.values():
                    if d.get("ownerId") == owner:
                        return types.SimpleNamespace(**d)
                return None

            # fallback: คืน first as namespace
            first = next(iter(self._docs.values()), None)
            return types.SimpleNamespace(**first) if first is not None else None

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

    # เก็บค่าเดิมของ dependency_overrides เพื่อ restore คืนใน finally
    original_overrides = dict(app.dependency_overrides)

    # 1) override FastAPI dependency
    app.dependency_overrides[get_prisma] = _get_prisma

    # 2) patch db.get_prisma และโมดูลอื่นๆ ที่มี attribute ชื่อ get_prisma
    patched = []  # list ของ (module, original_value) เพื่อ restore ทีหลัง

    try:
        # patch โมดูล db โดยตรง
        try:
            db_mod = import_module("db")
        except ModuleNotFoundError:
            db_mod = None

        if db_mod is not None:
            if hasattr(db_mod, "get_prisma"):
                original = getattr(db_mod, "get_prisma")
                patched.append((db_mod, original))
                setattr(db_mod, "get_prisma", _get_prisma)
            else:
                patched.append((db_mod, None))
                setattr(db_mod, "get_prisma", _get_prisma)

        # patch โมดูลอื่น ๆ ที่อาจ import get_prisma ไว้ (เช่น main, app, routes)
        for name, module in list(sys.modules.items()):
            if module is None:
                continue
            # ข้ามตัว db ที่ patch แล้ว
            if db_mod is not None and module is db_mod:
                continue
            if hasattr(module, "get_prisma"):
                try:
                    cur = getattr(module, "get_prisma")
                except Exception:
                    continue
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
        # restore app overrides (คืนค่าเดิมทั้งหมด)
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides)

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
