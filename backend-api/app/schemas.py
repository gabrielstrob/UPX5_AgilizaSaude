from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID

class ClinicaBase(BaseModel):
    nome: str
    endereco: str
    telefone: Optional[str] = None
    aberto_24h: bool = False
    horarios: Optional[Dict[str, Any]] = None
    foto_url: Optional[str] = None
    avaliacao_media: float = 0.0
    total_avaliacoes: int = 0

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
    tempo_espera_minutos: Optional[int] = 15 # Mock dinâmico para a UI

    class Config:
        from_attributes = True
