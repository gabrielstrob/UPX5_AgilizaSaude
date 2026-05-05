# Conecta Odonto

PWA para localização de clínicas odontológicas públicas com busca geoespacial, triagem e painel administrativo.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Leaflet |
| Backend | FastAPI, SQLAlchemy, GeoAlchemy2, PostGIS |
| Auth / DB | Supabase (PostgreSQL + Auth) |
| Mapas | Leaflet + Google Places API |

## Estrutura

```
UPX 5/
├── backend-api/          # API FastAPI
│   ├── app/
│   │   ├── main.py       # Entry point FastAPI
│   │   ├── database.py   # Conexão PostgreSQL (Supabase)
│   │   ├── models.py     # Modelos SQLAlchemy + PostGIS
│   │   ├── schemas.py    # Schemas Pydantic
│   │   ├── crud.py       # Operações de banco
│   │   ├── auth.py       # Validação de token Supabase
│   │   ├── routers/
│   │   │   ├── auth.py       # Login / logout / me
│   │   │   └── clinicas.py   # CRUD + busca geoespacial
│   │   └── services/
│   │       └── google_places.py
│   ├── seed.py           # Popula banco com dados de teste
│   ├── requirements.txt
│   └── .env.example
│
└── frontend-app/         # React PWA
    ├── src/
    │   ├── pages/
    │   │   ├── Mapa.tsx       # Mapa com clínicas proximas
    │   │   ├── Unidades.tsx   # Lista de unidades
    │   │   ├── Detalhes.tsx   # Detalhes da clínica
    │   │   ├── Triagem.tsx    # Triagem do paciente
    │   │   ├── Admin.tsx      # Painel admin (protegido)
    │   │   └── Login.tsx      # Autenticação
    │   ├── components/
    │   ├── contexts/
    │   ├── hooks/
    │   └── services/
    ├── package.json
    └── .env.example
```

## Pré-requisitos

- **Python 3.12+**
- **Node.js 20+**
- Conta no [Supabase](https://supabase.com) com a extensão **PostGIS** habilitada
- Chave da **Google Places API**

## Configuração do Supabase

No editor SQL do Supabase, execute:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Variáveis de ambiente

### backend-api/.env

Copie `.env.example` e preencha:

```env
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
GOOGLE_PLACES_API_KEY=your_google_places_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### frontend-app/.env

Copie `.env.example` e preencha:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Instalação e execução

### Backend

```bash
cd backend-api

# Windows
setup.bat

# Linux/Mac (requer make)
make setup

# Iniciar servidor
make run
# ou: venv\Scripts\python -m uvicorn app.main:app --reload

# Popular banco com dados de teste
make seed
# ou: venv\Scripts\python seed.py
```

API disponível em `http://localhost:8000`  
Docs interativa em `http://localhost:8000/docs`

### Frontend

```bash
cd frontend-app
npm install
npm run dev
```

App disponível em `http://localhost:5173`

## Rotas da API

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/clinicas/proximas?lat=&lng=&raio=&limit=` | Busca clínicas por geolocalização | Não |
| `GET` | `/api/clinicas/{id}` | Detalhes de uma clínica | Não |
| `POST` | `/api/clinicas/` | Cria clínica | Não |
| `GET` | `/api/clinicas/admin/list` | Lista todas (admin) | Sim |
| `DELETE` | `/api/clinicas/admin/{id}` | Remove clínica | Sim |
| `PATCH` | `/api/clinicas/admin/{id}` | Atualiza clínica | Sim |
| `GET` | `/api/clinicas/admin/places/search?query=` | Busca Google Places | Sim |
| `POST` | `/api/clinicas/admin/places/{place_id}/import` | Importa do Google Places | Sim |
| `POST` | `/api/auth/login` | Login (email + senha) | Não |
| `GET` | `/api/auth/me` | Usuário atual | Sim |
| `POST` | `/api/auth/logout` | Logout | Sim |
