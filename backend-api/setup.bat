@echo off

echo === Configurando backend-api ===

if exist venv (
    echo venv ja existe, pulando criacao...
) else (
    echo Criando ambiente virtual...
    python -m venv venv
)

echo Instalando dependencias...
venv\Scripts\pip install --upgrade pip
venv\Scripts\pip install -r requirements.txt

echo.
echo Setup concluido!
echo Para iniciar o servidor:  venv\Scripts\python -m uvicorn app.main:app --reload
echo Para popular o banco:      venv\Scripts\python seed.py
