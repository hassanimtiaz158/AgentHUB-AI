from fastapi import APIRouter, HTTPException

from app.database import users
from app.models.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=201)
def create_user(payload: UserCreate):
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=422, detail="name is required")
    if not payload.email or "@" not in payload.email:
        raise HTTPException(status_code=422, detail="valid email is required")

    existing = users.find(email=payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="email already registered")

    row = users.insert({
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "role": (payload.role or "client").value,
    })
    return UserResponse(**row)
