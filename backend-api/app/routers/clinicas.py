from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from .. import crud, schemas, database
from ..auth import get_current_user

router = APIRouter(
    prefix="/api/clinicas",
    tags=["clinicas"]
)

@router.get("/proximas", response_model=List[schemas.ClinicaResponse])
def ler_clinicas_proximas(
    lat: float = Query(..., description="Latitude do usuário"),
    lng: float = Query(..., description="Longitude do usuário"),
    raio: float = Query(10.0, description="Raio de busca em KM"),
    limit: int = Query(10, description="Limite de resultados"),
    db: Session = Depends(database.get_db)
):
    """
    Retorna as clínicas mais próximas com base nas coordenadas fornecidas.
    """
    return crud.get_clinicas_proximas(db, lat=lat, lng=lng, raio_km=raio, limit=limit)

@router.post("/", response_model=schemas.ClinicaResponse)
def criar_clinica(clinica: schemas.ClinicaCreate, db: Session = Depends(database.get_db)):
    """
    Endpoint (apenas para Admin) para cadastrar novas clínicas.
    """
    return crud.criar_clinica(db, clinica)

@router.get("/{clinica_id}", response_model=schemas.ClinicaResponse)
def ler_clinica(clinica_id: UUID, db: Session = Depends(database.get_db)):
    """
    Retorna os detalhes de uma clínica específica.
    """
    clinica = crud.get_clinica_por_id(db, clinica_id)
    if not clinica:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Clínica não encontrada")
    return clinica

# --- ADMIN ROUTES ---

from fastapi import HTTPException
from ..services import google_places

@router.get("/admin/list", response_model=List[schemas.ClinicaResponse])
def listar_todas_clinicas(db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    """
    Lista todas as clínicas cadastradas para o painel Admin.
    """
    return crud.get_todas_clinicas(db)

@router.delete("/admin/{clinica_id}")
def deletar_clinica(clinica_id: UUID, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    """
    Remove uma clínica do sistema.
    """
    sucesso = crud.delete_clinica(db, clinica_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
    return {"message": "Clínica deletada com sucesso."}

@router.patch("/admin/{clinica_id}", response_model=schemas.ClinicaResponse)
def atualizar_clinica(clinica_id: UUID, dados: schemas.ClinicaUpdate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    """
    Atualiza dados específicos de uma clínica (horários ou foto).
    """
    clinica = crud.update_clinica(db, clinica_id, dados)
    if not clinica:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
    return clinica

@router.get("/admin/places/search")
def buscar_places_google(query: str, user=Depends(get_current_user)):
    """
    Pesquisa lugares no Google Places.
    """
    try:
        resultados = google_places.search_places(query)
        return {"resultados": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/places/{place_id}/import", response_model=schemas.ClinicaResponse)
def importar_place_google(place_id: str, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    """
    Importa um lugar do Google Places direto para o banco de dados.
    """
    try:
        detalhes = google_places.get_place_details(place_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not detalhes:
        raise HTTPException(status_code=404, detail="Detalhes não encontrados")

    # Extração de dados da resposta do Google
    nome = detalhes.get("name", "Sem Nome")
    endereco = detalhes.get("formatted_address", "")
    telefone = detalhes.get("formatted_phone_number", "")
    lat = detalhes.get("geometry", {}).get("location", {}).get("lat", 0.0)
    lng = detalhes.get("geometry", {}).get("location", {}).get("lng", 0.0)
    
    # Horários
    aberto_24h = False
    horarios_dit = {}
    if "opening_hours" in detalhes:
        periods = detalhes["opening_hours"].get("periods", [])
        if len(periods) == 1 and periods[0].get("open", {}).get("time") == "0000" and not periods[0].get("close"):
            aberto_24h = True
            horarios_dit = {"todos_os_dias": "24 Horas"}
        else:
            weekday_text = detalhes["opening_hours"].get("weekday_text", [])
            for w in weekday_text:
                if ":" in w:
                    dia, hr = w.split(":", 1)
                    horarios_dit[dia.strip()] = hr.strip()

    avaliacao_media = detalhes.get("rating", 0.0)
    total_avaliacoes = detalhes.get("user_ratings_total", 0)

    # Verifica se há fotos disponíveis para construir a URL
    foto_url = None
    if "photos" in detalhes and len(detalhes["photos"]) > 0:
        photo_ref = detalhes["photos"][0].get("photo_reference")
        if photo_ref:
            from ..services.google_places import GOOGLE_PLACES_API_KEY
            foto_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo_ref}&key={GOOGLE_PLACES_API_KEY}"

    # Verifica se já existe clínica com esse mesmo nome no banco
    from .. import models
    existente = db.query(models.Clinica).filter(models.Clinica.nome == nome).first()
    if existente:
        raise HTTPException(status_code=400, detail="Esta clínica já está cadastrada no sistema.")
    
    clinica_in = schemas.ClinicaCreate(
        nome=nome,
        endereco=endereco,
        telefone=telefone,
        aberto_24h=aberto_24h,
        horarios=horarios_dit,
        foto_url=foto_url,
        avaliacao_media=avaliacao_media,
        total_avaliacoes=total_avaliacoes,
        latitude=lat,
        longitude=lng
    )

    return crud.criar_clinica(db, clinica_in)
