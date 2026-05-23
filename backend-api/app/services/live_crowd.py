import os
import logging
import livepopulartimes
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

def fetch_live_occupancy(place_id: str):
    """
    Busca a lotação em tempo real de uma clínica usando seu google_place_id.
    Retorna um dicionário com:
      - 'status' (str): Descrição legível
      - 'nivel' (int): Nível de 1 a 5
      - 'raw' (dict): Dados brutos retornados pelo scraper
    Retorna None se a chave de API não estiver configurada, se os dados não
    estiverem disponíveis ou se o scraping falhar.
    """
    if not GOOGLE_PLACES_API_KEY:
        logger.error("[Live Crowd] GOOGLE_PLACES_API_KEY não configurada no .env")
        return None

    try:
        logger.info(f"[Live Crowd] Buscando lotação ao vivo para o place_id: {place_id}")
        #get_populartimes_by_PlaceID faz scraping a partir de um ID utilizando a API key para
        #resolver os metadados iniciais.
        data = livepopulartimes.get_populartimes_by_PlaceID(GOOGLE_PLACES_API_KEY, place_id)

        if not data:
            logger.warning(f"[Live Crowd] Nenhum dado retornado por LivePopularTimes para {place_id}")
            return None

        current_popularity = data.get("current_popularity")
        logger.info(f"[Live Crowd] Dados obtidos para place_id {place_id}: current_popularity = {current_popularity}")

        if current_popularity is None:
            # Lotação em tempo real não está disponível no Google Maps para este local neste momento.
            logger.warning(f"[Live Crowd] Lotação em tempo real indisponível para {place_id}")
            return None

        current_popularity = int(current_popularity)
        
        # Mapeamento do percentual de lotação (0-100) para a escala 1-5 do frontend:
        if current_popularity <= 15:
            nivel = 1
            status = "Pouco movimentado"
        elif current_popularity <= 45:
            nivel = 2
            status = "Não muito movimentado"
        elif current_popularity <= 70:
            nivel = 3
            status = "Tão movimentado quanto o normal"
        elif current_popularity <= 90:
            nivel = 4
            status = "Mais movimentado do que o normal"
        else:
            nivel = 5
            status = "Muito movimentado"

        logger.info(f"[Live Crowd] Lotação mapeada para {place_id}: status='{status}', nivel={nivel} ({current_popularity}%)")

        return {
            "status": status,
            "nivel": nivel,
            "raw": data
        }
    except Exception as e:
        logger.error(f"[Live Crowd] Erro ao buscar lotação para o place_id {place_id}: {e}", exc_info=True)
        return None
