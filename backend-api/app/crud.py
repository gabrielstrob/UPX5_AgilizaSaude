from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2.shape import to_shape
from geoalchemy2.elements import WKTElement

from . import models, schemas

from sqlalchemy import cast
from geoalchemy2 import Geography

from sqlalchemy import text
from uuid import UUID

import_datetime = __import__("datetime")

def calcular_tempo_espera_mock():
    hora_atual = import_datetime.datetime.now().hour
    if 0 <= hora_atual <= 6:
        return 5
    elif 7 <= hora_atual <= 11:
        return 30
    elif 12 <= hora_atual <= 14:
        return 45
    elif 15 <= hora_atual <= 18:
        return 25
    else:
        return 15

def get_clinicas_proximas(db: Session, lat: float, lng: float, raio_km: float = 10.0, limit: int = 10):
    ponto_origem = f"SRID=4326;POINT({lng} {lat})"
    raio_metros = raio_km * 1000

    query = text("""
        SELECT 
            id, nome, endereco, telefone, aberto_24h, horarios, foto_url, avaliacao_media, total_avaliacoes,
            ST_Y(localizacao::geometry) as latitude,
            ST_X(localizacao::geometry) as longitude,
            ST_Distance(localizacao::geography, ST_GeographyFromText(:ponto)) / 1000.0 as distancia_km
        FROM clinicas
        WHERE ST_DWithin(localizacao::geography, ST_GeographyFromText(:ponto), :raio)
        ORDER BY distancia_km
        LIMIT :limit
    """)

    clinicas_db = db.execute(query, {"ponto": ponto_origem, "raio": raio_metros, "limit": limit}).fetchall()

    resultados = []
    for row in clinicas_db:
        # Montar o objeto schema a partir do row (que age como dicionário/tupla)
        clinica_dict = {
            "id": row.id,
            "nome": row.nome,
            "endereco": row.endereco,
            "telefone": row.telefone,
            "aberto_24h": row.aberto_24h,
            "horarios": row.horarios,
            "foto_url": row.foto_url,
            "avaliacao_media": row.avaliacao_media,
            "total_avaliacoes": row.total_avaliacoes,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "distancia_km": round(row.distancia_km, 2),
            "tempo_espera_minutos": calcular_tempo_espera_mock()
        }
        resultados.append(schemas.ClinicaResponse(**clinica_dict))
    
    return resultados

def criar_clinica(db: Session, clinica: schemas.ClinicaCreate):
    # Converter lat/lng para WKTPoint
    ponto = f"POINT({clinica.longitude} {clinica.latitude})"
    wkt_element = WKTElement(ponto, srid=4326)

    db_clinica = models.Clinica(
        nome=clinica.nome,
        endereco=clinica.endereco,
        telefone=clinica.telefone,
        aberto_24h=clinica.aberto_24h,
        horarios=clinica.horarios,
        foto_url=clinica.foto_url,
        avaliacao_media=clinica.avaliacao_media,
        total_avaliacoes=clinica.total_avaliacoes,
        localizacao=wkt_element
    )
    
    db.add(db_clinica)
    db.commit()
    db.refresh(db_clinica)
    
    shape = to_shape(db_clinica.localizacao)
    db_clinica.latitude = shape.y
    db_clinica.longitude = shape.x

    return db_clinica

def get_clinica_por_id(db: Session, clinica_id: UUID):
    query = text("""
        SELECT 
            id, nome, endereco, telefone, aberto_24h, horarios, foto_url, avaliacao_media, total_avaliacoes,
            ST_Y(localizacao::geometry) as latitude,
            ST_X(localizacao::geometry) as longitude,
            0.0 as distancia_km
        FROM clinicas
        WHERE id = :id
    """)
    row = db.execute(query, {"id": clinica_id}).fetchone()
    if not row:
        return None
    clinica_dict = {
        "id": row.id,
        "nome": row.nome,
        "endereco": row.endereco,
        "telefone": row.telefone,
        "aberto_24h": row.aberto_24h,
        "horarios": row.horarios,
        "foto_url": row.foto_url,
        "avaliacao_media": row.avaliacao_media,
        "total_avaliacoes": row.total_avaliacoes,
        "latitude": row.latitude,
        "longitude": row.longitude,
        "distancia_km": 0.0,
        "tempo_espera_minutos": calcular_tempo_espera_mock()
    }
    return schemas.ClinicaResponse(**clinica_dict)

def get_todas_clinicas(db: Session):
    query = text("""
        SELECT 
            id, nome, endereco, telefone, aberto_24h, horarios, foto_url, avaliacao_media, total_avaliacoes,
            ST_Y(localizacao::geometry) as latitude,
            ST_X(localizacao::geometry) as longitude,
            0.0 as distancia_km
        FROM clinicas
        ORDER BY nome ASC
    """)
    resultados = db.execute(query).fetchall()
    
    clinicas = []
    for row in resultados:
        clinica_dict = {
            "id": row.id,
            "nome": row.nome,
            "endereco": row.endereco,
            "telefone": row.telefone,
            "aberto_24h": row.aberto_24h,
            "horarios": row.horarios,
            "foto_url": row.foto_url,
            "avaliacao_media": row.avaliacao_media,
            "total_avaliacoes": row.total_avaliacoes,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "distancia_km": 0.0,
            "tempo_espera_minutos": calcular_tempo_espera_mock()
        }
        clinicas.append(schemas.ClinicaResponse(**clinica_dict))
    return clinicas

def delete_clinica(db: Session, clinica_id: UUID):
    clinica = db.query(models.Clinica).filter(models.Clinica.id == clinica_id).first()
    if clinica:
        db.delete(clinica)
        db.commit()
        return True
    return False

def update_clinica(db: Session, clinica_id: UUID, dados: schemas.ClinicaUpdate):
    clinica = db.query(models.Clinica).filter(models.Clinica.id == clinica_id).first()
    if not clinica:
        return None
    
    if dados.horarios is not None:
        clinica.horarios = dados.horarios
    if dados.foto_url is not None:
        clinica.foto_url = dados.foto_url
        
    db.commit()
    db.refresh(clinica)
    
    return get_clinica_por_id(db, clinica_id)
