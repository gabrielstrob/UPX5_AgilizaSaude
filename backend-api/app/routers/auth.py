import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

from ..auth import get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(request: LoginRequest):
    temp_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    try:
        response = temp_client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": str(response.user.id),
                "email": response.user.email
            }
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")


@router.get("/me")
def get_me(user=Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email}


@router.post("/logout")
def logout(user=Depends(get_current_user)):
    return {"message": "Logout realizado com sucesso"}
