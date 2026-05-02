import os
import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

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
        "language": "pt-BR",
        "type": "hospital|health|dentist" # Preferência para estabelecimentos de saúde
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json().get("results", [])

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
    return response.json().get("result", {})
