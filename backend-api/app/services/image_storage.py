import os
import uuid
import requests
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = "clinica-photos"

_supabase_client: Client | None = None


def _get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError("SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar configurados no .env")
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client


def download_and_upload_image(image_url: str, nome_clinica: str) -> str | None:
    try:
        response = requests.get(image_url, timeout=15, allow_redirects=True)
        response.raise_for_status()

        image_bytes = response.content
        content_type = response.headers.get("content-type", "image/jpeg")

        ext = "jpg"
        if "png" in content_type:
            ext = "png"
        elif "webp" in content_type:
            ext = "webp"

        safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in nome_clinica.lower())[:40]
        file_path = f"{safe_name}_{uuid.uuid4().hex[:8]}.{ext}"

        client = _get_supabase_client()

        client.storage.from_(BUCKET_NAME).upload(
            file_path,
            image_bytes,
            {"content-type": content_type}
        )

        public_url = client.storage.from_(BUCKET_NAME).get_public_url(file_path)

        return public_url
    except Exception as e:
        print(f"[image_storage] Erro ao fazer upload da imagem: {e}")
        return None
