import os
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

logger.info(f"GOOGLE_PLACES_API_KEY carregada: {'***' + GOOGLE_PLACES_API_KEY[-6:] if GOOGLE_PLACES_API_KEY else 'NONE'}")

def search_places(query: str):
    """
    Busca locais usando a Text Search API do Google Places.
    """
    if not GOOGLE_PLACES_API_KEY:
        raise ValueError("A chave GOOGLE_PLACES_API_KEY não está configurada no .env")

    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        "query": query,
        "key": GOOGLE_PLACES_API_KEY,
        "language": "pt-BR"
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    status = data.get("status", "UNKNOWN")
    error_message = data.get("error_message", "")
    
    logger.info(f"[Places API] search_places('{query}') -> status: {status}, results: {len(data.get('results', []))}")
    if error_message:
        logger.error(f"[Places API] error_message: {error_message}")
    
    if status != "OK" and status != "ZERO_RESULTS":
        raise ValueError(f"Google Places API erro: status={status}, message={error_message}")
    
    return data.get("results", [])

def get_place_details(place_id: str):
    """
    Busca os detalhes completos de um local específico usando a Place Details API.
    """
    if not GOOGLE_PLACES_API_KEY:
        raise ValueError("A chave GOOGLE_PLACES_API_KEY não está configurada no .env")

    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "key": GOOGLE_PLACES_API_KEY,
        "language": "pt-BR",
        "fields": "name,formatted_address,geometry,formatted_phone_number,opening_hours,rating,user_ratings_total,photos"
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    status = data.get("status", "UNKNOWN")
    error_message = data.get("error_message", "")
    
    logger.info(f"[Places API] get_place_details('{place_id}') -> status: {status}")
    if error_message:
        logger.error(f"[Places API] error_message: {error_message}")
    
    if status != "OK":
        raise ValueError(f"Google Places API erro: status={status}, message={error_message}")
    
    return data.get("result", {})
