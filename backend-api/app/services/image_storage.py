import os
import uuid
import logging
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logger = logging.getLogger(__name__)

BUCKET_NAME = "clinica-photos"

_supabase_client: Client | None = None


def _get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar configurados no .env")
        logger.info(f"[image_storage] Inicializando client Supabase: {url}")
        _supabase_client = create_client(url, key)
    return _supabase_client


def _ensure_bucket_exists(client: Client) -> None:
    try:
        client.storage.get_bucket(BUCKET_NAME)
        logger.info(f"[image_storage] Bucket '{BUCKET_NAME}' ja existe.")
    except Exception:
        logger.info(f"[image_storage] Bucket '{BUCKET_NAME}' nao encontrado. Criando...")
        client.storage.create_bucket(BUCKET_NAME, options={"public": True})
        logger.info(f"[image_storage] Bucket '{BUCKET_NAME}' criado como publico.")


def download_and_upload_image(image_url: str, nome_clinica: str) -> str:
    logger.info(f"[image_storage] Baixando imagem de: {image_url[:80]}...")

    response = requests.get(image_url, timeout=30, allow_redirects=True)
    response.raise_for_status()

    image_bytes = response.content
    content_type = response.headers.get("content-type", "image/jpeg")
    logger.info(f"[image_storage] Imagem baixada: {len(image_bytes)} bytes, content-type: {content_type}")

    ext = "jpg"
    if "png" in content_type:
        ext = "png"
    elif "webp" in content_type:
        ext = "webp"

    import unicodedata
    normalized = unicodedata.normalize("NFKD", nome_clinica.lower())
    ascii_only = "".join(c for c in normalized if not unicodedata.combining(c))
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in ascii_only)[:40]
    file_path = f"{safe_name}_{uuid.uuid4().hex[:8]}.{ext}"

    client = _get_supabase_client()
    _ensure_bucket_exists(client)

    client.storage.from_(BUCKET_NAME).upload(
        file_path,
        image_bytes,
        {"content-type": content_type}
    )

    public_url = client.storage.from_(BUCKET_NAME).get_public_url(file_path)
    logger.info(f"[image_storage] Upload concluido. URL publica: {public_url}")

    return public_url
