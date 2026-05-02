from sqlalchemy import Column, String, Boolean, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
import uuid

from .database import Base

class Clinica(Base):
    __tablename__ = "clinicas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    nome = Column(String, index=True, nullable=False)
    endereco = Column(String, nullable=False)
    telefone = Column(String, nullable=True)
    aberto_24h = Column(Boolean, default=False)
    
    # Campo JSON para horários específicos (ex: {"segunda": {"abertura": "08:00", "fechamento": "18:00"}})
    horarios = Column(JSON, nullable=True)
    
    # Foto da clínica
    foto_url = Column(String, nullable=True)
    
    # Avaliação média e total de avaliações para exibição na UI
    avaliacao_media = Column(Float, default=0.0)
    total_avaliacoes = Column(Float, default=0)

    # Coluna PostGIS para localização exata
    # SRID 4326 é o padrão para GPS (Latitude e Longitude)
    localizacao = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
