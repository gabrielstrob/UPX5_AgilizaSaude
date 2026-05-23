import os
import logging
import serpapi
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

def map_live_info_to_occupancy(info_str: str):
    """
    Mapeia a string descritiva em inglês ou português de live_hash > info para
    o nível (1-5) para fins de estilização e ícones no frontend.
    """
    if not info_str:
        return None
        
    info_lower = info_str.lower()
    
    # 1. Um pouco movimentado / Não muito movimentado (Nível 2)
    if any(x in info_lower for x in ["a little busy", "um pouco movimentado", "um pouco"]):
        return 2, "Um pouco movimentado"
    if any(x in info_lower for x in ["not too busy", "não muito movimentado", "não muito"]):
        return 2, "Não muito movimentado"
        
    # 2. Muito movimentado / Lotado (Nível 5)
    if any(x in info_lower for x in ["as busy as it gets", "very busy", "lotado", "muito movimentado"]):
        return 5, "Muito movimentado"
        
    # 3. Pouco movimentado / Menos movimentado que o usual (Nível 1)
    if any(x in info_lower for x in ["less busy than usual", "not busy", "pouco movimentado", "baixo", "menos movimentado"]):
        return 1, "Pouco movimentado"
        
    # 4. Mais movimentado do que o normal (Nível 4)
    if any(x in info_lower for x in ["busier than usual", "more busy than usual", "mais movimentado"]):
        return 4, "Mais movimentado do que o normal"
        
    # 5. Tão movimentado quanto o normal (Nível 3)
    if any(x in info_lower for x in ["as busy as usual", "tão movimentado quanto o normal", "tão movimentado", "normal"]):
        return 3, "Tão movimentado quanto o normal"
        
    # Fallback genérico para "busy" caso não bata em nenhuma das anteriores
    if "busy" in info_lower:
        return 3, "Tão movimentado quanto o normal"
        
    return None

def fetch_live_occupancy(place_id: str):
    """
    Busca a lotação em tempo real de uma clínica usando seu google_place_id via SerpApi.
    Retorna um dicionário com:
      - 'status' (str): Texto retornado diretamente pela SerpApi, ou 'Dados de ocupação não disponíveis.'
      - 'nivel' (int): Nível de lotação de 1 a 5 (ou 0 se indisponível).
      - 'raw' (dict): Dados brutos retornados pela API.
    """
    if not SERPAPI_KEY:
        logger.error("[Live Crowd] SERPAPI_KEY não configurada no .env")
        return {
            "status": "Dados de ocupação não disponíveis.",
            "nivel": 0,
            "raw": {"error": "SERPAPI_KEY não configurada"}
        }

    try:
        logger.info(f"[Live Crowd] Buscando lotação ao vivo para o place_id via SerpApi: {place_id}")
        client = serpapi.Client(api_key=SERPAPI_KEY)
        
        # Realiza a busca no motor google_maps com type=place e idioma em português
        results = client.search({
            "engine": "google_maps",
            "type": "place",
            "place_id": place_id,
            "hl": "pt-br"
        })
        
        place_results = results.get("place_results", {})
        popular_times = place_results.get("popular_times", {})
        
        live_hash = popular_times.get("live_hash", {}) if popular_times else {}
        info_str = live_hash.get("info")
        
        if info_str:
            mapped = map_live_info_to_occupancy(info_str)
            nivel = mapped[0] if mapped else 3
            status = info_str  # Utiliza o retorno direto da SerpApi
            
            logger.info(f"[Live Crowd] Lotação obtida com sucesso: status='{status}', nivel={nivel}")
            return {
                "status": status,
                "nivel": nivel,
                "raw": popular_times
            }
        else:
            logger.warning(f"[Live Crowd] live_hash.info ausente para {place_id}.")
            return {
                "status": "Dados de ocupação não disponíveis.",
                "nivel": 0,
                "raw": popular_times or {}
            }
            
    except Exception as e:
        logger.error(f"[Live Crowd] Erro ao chamar SerpApi para o place_id {place_id}: {e}", exc_info=True)
        return {
            "status": "Dados de ocupação não disponíveis.",
            "nivel": 0,
            "raw": {"error": str(e)}
        }
