from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import clinicas, auth

# Cria as tabelas e extensões no banco (apenas para ambiente de desenvolvimento)
# OBS: O Supabase exige que a extensão PostGIS seja criada antes manualmente pelo painel SQL:
# CREATE EXTENSION IF NOT EXISTS postgis;
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Aviso ao criar tabelas: {e}")

app = FastAPI(
    title="Conecta Odonto API",
    description="API para o PWA Conecta Odonto com busca geoespacial",
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
    return {"message": "Conecta Odonto API está online!"}
