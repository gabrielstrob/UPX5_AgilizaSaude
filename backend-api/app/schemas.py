from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class ClinicaBase(BaseModel):
    nome: str
    endereco: str
    telefone: Optional[str] = None
    aberto_24h: bool = False
    horarios: Optional[Dict[str, Any]] = None
    foto_url: Optional[str] = None
    avaliacao_media: float = 0.0
    total_avaliacoes: int = 0
    review_texto: Optional[str] = None
    review_autor: Optional[str] = None
    review_nota: Optional[float] = None
    review_data: Optional[str] = None
    google_place_id: Optional[str] = None

class ClinicaUpdate(BaseModel):
    horarios: Optional[Dict[str, Any]] = None
    foto_url: Optional[str] = None

class ClinicaCreate(ClinicaBase):
    latitude: float
    longitude: float

class ClinicaResponse(ClinicaBase):
    id: UUID
    latitude: float
    longitude: float
    distancia_km: Optional[float] = None  # Calculado dinamicamente via PostGIS na query
    lotacao_status: Optional[str] = None
    lotacao_nivel: Optional[int] = None
    lotacao_atualizada_em: Optional[datetime] = None

    class Config:
        from_attributes = True
