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
import re

def calcular_status_funcionamento(aberto_24h, horarios):
    if aberto_24h:
        return "Aberta"

    if not horarios:
        return "Fechada"

    now = import_datetime.datetime.now()
    weekday = now.weekday()
    current_minutes = now.hour * 60 + now.minute

    day_numbers = {
        'segunda': 0, 'terca': 1, 'terça': 1, 'quarta': 2,
        'quinta': 3, 'sexta': 4, 'sabado': 5, 'sábado': 5, 'domingo': 6
    }

    today_value = None

    for key, value in horarios.items():
        k = key.lower().strip()
        k = re.sub(r'\s*-\s*feira\s*', '', k).strip()

        range_match = re.match(r'^(\w+)\s*_\s*a+\s*_\s*(\w+)$', k)
        if range_match:
            start = day_numbers.get(range_match.group(1))
            end = day_numbers.get(range_match.group(2))
            if start is not None and end is not None and start <= weekday <= end:
                today_value = value
                break
            continue

        if 'todos' in k:
            today_value = value
            break

        day_num = day_numbers.get(k)
        if day_num is not None and day_num == weekday:
            today_value = value
            break

    if today_value is None:
        return "Fechada"

    val = str(today_value).strip()

    if not val or val.lower() == 'fechado':
        return "Fechada"

    if '24' in val:
        return "Aberta"

    if 'urgência' in val.lower() or 'urgencia' in val.lower():
        return "Aberta"

    normalized = val.replace('–', '-').replace('—', '-')
    parts = re.split(r'\s*-\s*|\s+às\s+', normalized)

    if len(parts) >= 2:
        try:
            h_s, m_s = parts[0].strip().split(':')
            h_e, m_e = parts[-1].strip().split(':')
            start_min = int(h_s) * 60 + int(m_s)
            end_min = int(h_e) * 60 + int(m_e)

            if start_min <= current_minutes <= end_min:
                return "Aberta"
        except (ValueError, IndexError):
            pass

    return "Fechada"

def calcular_lotacao_mock():
    # Retorna o status e o nível de lotação com base no horário atual.
    # Níveis: 1 (Pouco movimentado), 2 (Não muito movimentado), 3 (Tão movimentado quanto o normal),
    # 4 (Mais movimentado do que o normal), 5 (Muito movimentado).
    hora_atual = import_datetime.datetime.now().hour
    if 0 <= hora_atual <= 6:
        return {"status": "Pouco movimentado", "nivel": 1}
    elif 7 <= hora_atual <= 11:
        return {"status": "Mais movimentado do que o normal", "nivel": 4}
    elif 12 <= hora_atual <= 14:
        return {"status": "Muito movimentado", "nivel": 5}
    elif 15 <= hora_atual <= 18:
        return {"status": "Tão movimentado quanto o normal", "nivel": 3}
    else:
        return {"status": "Não muito movimentado", "nivel": 2}

import threading

def update_clinica_lotacao_bg(clinica_id: UUID, google_place_id: str):
    from .database import SessionLocal
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[Live Crowd BG] Iniciando busca para clínica ID: {clinica_id}, Google Place ID: {google_place_id}")
    
    db = SessionLocal()
    try:
        from .services import live_crowd
        info = live_crowd.fetch_live_occupancy(google_place_id)
        if info:
            db.query(models.Clinica).filter(models.Clinica.id == clinica_id).update({
                "lotacao_status": info["status"],
                "lotacao_nivel": info["nivel"],
                "lotacao_atualizada_em": import_datetime.datetime.utcnow(),
                "populartimes_raw": info["raw"]
            })
            db.commit()
            logger.info(f"[Live Crowd BG] Lotação atualizada no banco de dados para clínica {clinica_id}")
        else:
            logger.warning(f"[Live Crowd BG] Não foi possível capturar dados novos de lotação para clínica {clinica_id}")
    except Exception as e:
        logger.error(f"[Live Crowd BG] Erro na thread de atualização em background: {e}", exc_info=True)
    finally:
        db.close()

def trigger_lotacao_update_if_stale(clinica_id: UUID, google_place_id: str, lotacao_atualizada_em):
    if not google_place_id:
        return

    agora = import_datetime.datetime.utcnow()
    precisa_atualizar = False

    if not lotacao_atualizada_em:
        precisa_atualizar = True
    else:
        if isinstance(lotacao_atualizada_em, str):
            try:
                from dateutil import parser
                lotacao_dt = parser.parse(lotacao_atualizada_em)
                if lotacao_dt.tzinfo:
                    agora_aware = import_datetime.datetime.now(lotacao_dt.tzinfo)
                    delta = agora_aware - lotacao_dt
                else:
                    delta = agora - lotacao_dt
                precisa_atualizar = delta.total_seconds() > 900
            except Exception:
                precisa_atualizar = True
        else:
            if lotacao_atualizada_em.tzinfo:
                agora_aware = import_datetime.datetime.now(lotacao_atualizada_em.tzinfo)
                delta = agora_aware - lotacao_atualizada_em
            else:
                delta = agora - lotacao_atualizada_em
            precisa_atualizar = delta.total_seconds() > 900

    if precisa_atualizar:
        import logging
        logging.getLogger(__name__).info(f"[Live Crowd] Disparando Thread de background para clínica {clinica_id}")
        t = threading.Thread(target=update_clinica_lotacao_bg, args=(clinica_id, google_place_id))
        t.daemon = True
        t.start()

def get_clinicas_proximas(db: Session, lat: float, lng: float, raio_km: float = 10.0, limit: int = 10):
    ponto_origem = f"SRID=4326;POINT({lng} {lat})"
    raio_metros = raio_km * 1000

    query = text("""
        SELECT 
            id, nome, endereco, telefone, aberto_24h, horarios, foto_url, avaliacao_media, total_avaliacoes,
            review_texto, review_autor, review_nota, review_data,
            google_place_id, lotacao_status, lotacao_nivel, lotacao_atualizada_em,
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
        # Dispara atualização em background se estiver stale
        if row.google_place_id:
            trigger_lotacao_update_if_stale(row.id, row.google_place_id, row.lotacao_atualizada_em)

        # Determina lotação: real (do banco) ou mock (caso ainda não scrapeado ou se for manual)
        status_lotacao = row.lotacao_status
        nivel_lotacao = row.lotacao_nivel
        if status_lotacao is None or nivel_lotacao is None:
            mock_info = calcular_lotacao_mock()
            status_lotacao = mock_info["status"]
            nivel_lotacao = mock_info["nivel"]

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
            "review_texto": row.review_texto,
            "review_autor": row.review_autor,
            "review_nota": row.review_nota,
            "review_data": row.review_data,
            "google_place_id": row.google_place_id,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "distancia_km": round(row.distancia_km, 2),
            "lotacao_status": status_lotacao,
            "lotacao_nivel": nivel_lotacao,
            "lotacao_atualizada_em": row.lotacao_atualizada_em,
            "status_funcionamento": calcular_status_funcionamento(row.aberto_24h, row.horarios)
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
        review_texto=clinica.review_texto,
        review_autor=clinica.review_autor,
        review_nota=clinica.review_nota,
        review_data=clinica.review_data,
        google_place_id=clinica.google_place_id,
        localizacao=wkt_element
    )
    
    db.add(db_clinica)
    db.commit()
    db.refresh(db_clinica)
    
    # Dispara a primeira atualização de lotação imediatamente em background
    if db_clinica.google_place_id:
        trigger_lotacao_update_if_stale(db_clinica.id, db_clinica.google_place_id, None)

    shape = to_shape(db_clinica.localizacao)
    db_clinica.latitude = shape.y
    db_clinica.longitude = shape.x

    return db_clinica

def get_clinica_por_id(db: Session, clinica_id: UUID):
    query = text("""
        SELECT 
            id, nome, endereco, telefone, aberto_24h, horarios, foto_url, avaliacao_media, total_avaliacoes,
            review_texto, review_autor, review_nota, review_data,
            google_place_id, lotacao_status, lotacao_nivel, lotacao_atualizada_em,
            ST_Y(localizacao::geometry) as latitude,
            ST_X(localizacao::geometry) as longitude,
            0.0 as distancia_km
        FROM clinicas
        WHERE id = :id
    """)
    row = db.execute(query, {"id": clinica_id}).fetchone()
    if not row:
        return None

    if row.google_place_id:
        trigger_lotacao_update_if_stale(row.id, row.google_place_id, row.lotacao_atualizada_em)

    status_lotacao = row.lotacao_status
    nivel_lotacao = row.lotacao_nivel
    if status_lotacao is None or nivel_lotacao is None:
        mock_info = calcular_lotacao_mock()
        status_lotacao = mock_info["status"]
        nivel_lotacao = mock_info["nivel"]

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
        "review_texto": row.review_texto,
        "review_autor": row.review_autor,
        "review_nota": row.review_nota,
        "review_data": row.review_data,
        "google_place_id": row.google_place_id,
        "latitude": row.latitude,
        "longitude": row.longitude,
        "distancia_km": 0.0,
        "lotacao_status": status_lotacao,
        "lotacao_nivel": nivel_lotacao,
        "lotacao_atualizada_em": row.lotacao_atualizada_em,
        "status_funcionamento": calcular_status_funcionamento(row.aberto_24h, row.horarios)
    }
    return schemas.ClinicaResponse(**clinica_dict)

def get_todas_clinicas(db: Session):
    query = text("""
        SELECT 
            id, nome, endereco, telefone, aberto_24h, horarios, foto_url, avaliacao_media, total_avaliacoes,
            review_texto, review_autor, review_nota, review_data,
            google_place_id, lotacao_status, lotacao_nivel, lotacao_atualizada_em,
            ST_Y(localizacao::geometry) as latitude,
            ST_X(localizacao::geometry) as longitude,
            0.0 as distancia_km
        FROM clinicas
        ORDER BY nome ASC
    """)
    resultados = db.execute(query).fetchall()
    
    clinicas = []
    for row in resultados:
        if row.google_place_id:
            trigger_lotacao_update_if_stale(row.id, row.google_place_id, row.lotacao_atualizada_em)

        status_lotacao = row.lotacao_status
        nivel_lotacao = row.lotacao_nivel
        if status_lotacao is None or nivel_lotacao is None:
            mock_info = calcular_lotacao_mock()
            status_lotacao = mock_info["status"]
            nivel_lotacao = mock_info["nivel"]

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
            "review_texto": row.review_texto,
            "review_autor": row.review_autor,
            "review_nota": row.review_nota,
            "review_data": row.review_data,
            "google_place_id": row.google_place_id,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "distancia_km": 0.0,
            "lotacao_status": status_lotacao,
            "lotacao_nivel": nivel_lotacao,
            "lotacao_atualizada_em": row.lotacao_atualizada_em,
            "status_funcionamento": calcular_status_funcionamento(row.aberto_24h, row.horarios)
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
