from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import clinicas, auth

from sqlalchemy import text

# Cria as tabelas e extensões no banco (apenas para ambiente de desenvolvimento)
# OBS: O Supabase exige que a extensão PostGIS seja criada antes manualmente pelo painel SQL:
# CREATE EXTENSION IF NOT EXISTS postgis;
try:
    Base.metadata.create_all(bind=engine)
    
    # Auto-migration: adicionar colunas se elas não existirem no Supabase/PostgreSQL
    with engine.connect() as conn:
        for col_name, col_type in [
            ("google_place_id", "VARCHAR(255)"),
            ("lotacao_status", "VARCHAR(255)"),
            ("lotacao_nivel", "INTEGER"),
            ("lotacao_atualizada_em", "TIMESTAMP WITHOUT TIME ZONE"),
            ("populartimes_raw", "JSONB")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                conn.commit()
            except Exception as e_col:
                print(f"Aviso ao adicionar coluna {col_name}: {e_col}")
                
        # Adicionar índice para busca rápida por google_place_id
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_clinicas_google_place_id ON clinicas(google_place_id)"))
            conn.commit()
        except Exception as e_idx:
            print(f"Aviso ao criar índice: {e_idx}")
except Exception as e:
    print(f"Aviso ao criar tabelas e colunas: {e}")

app = FastAPI(
    title="OdontoJá API",
    description="API para o PWA OdontoJá com busca geoespacial",
    version="1.0.0"
)

# Configuração de CORS (permitir que o React acesse a API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trocar para ["http://localhost:5173"] em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão dos roteadores
app.include_router(clinicas.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "OdontoJá API está online!"}
