# Deploy Azure — OdontoJá

## Pré-requisitos

- [Azure CLI](https://learn.microsoft.com/pt-br/cli/azure/install-azure-cli) instalado
- Docker instalado
- Conta Azure com subscription ativa
- Node.js 20+

---

## 1. Login e Resource Group

```bash
az login

az group create --name upx-v --location eastus
```

---

## 2. Azure Container Registry (ACR)

```bash
az acr create --name odontojaacr --resource-group upx-v --sku Basic --admin-enabled true
```

Aguarde a criação. Anote o **login server** (ex: `odontojaacr.azurecr.io`):

```bash
az acr show --name odontojaacr --query loginServer --output tsv
```

### 2.1 Build e push da imagem (local)

```bash
cd backend-api

az acr login --name odontojaacr
docker build -t odontojaacr.azurecr.io/odontoja-api:latest .
docker push odontojaacr.azurecr.io/odontoja-api:latest
```

> **Nota:** O `az acr build` pode falhar com erro `TasksOperationsNotAllowed` dependendo
> do tipo de subscription. Nesse caso, use build local com Docker + push como acima.

---

## 3. Azure Container Apps

### 3.1 Registrar provider (se necessário)

```bash
az provider register --namespace Microsoft.App
```

### 3.2 Criar ambiente

```bash
az containerapp env create --name odontoja-env --resource-group upx-v --location eastus
```

### 3.3 Criar o Container App

```powershell
$acrPassword = az acr credential show --name odontojaacr --query passwords[0].value -o tsv

az containerapp create `
  --name odontoja-api `
  --resource-group upx-v `
  --image odontojaacr.azurecr.io/odontoja-api:latest `
  --registry-server odontojaacr.azurecr.io `
  --registry-username odontojaacr `
  --registry-password $acrPassword `
  --environment odontoja-env `
  --ingress external `
  --target-port 8000 `
  --cpu 0.25 `
  --memory 0.5Gi
```

> **Nota:** Não use `--registry-identity system` — pode falhar com erro de permissão.
> Use credenciais admin do ACR conforme acima.

### 3.4 Adicionar variáveis de ambiente

Substitua os valores com seus dados reais do Supabase/Google:

```powershell
az containerapp update `
  --name odontoja-api `
  --resource-group upx-v `
  --set-env-vars `
    "DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" `
    "GOOGLE_PLACES_API_KEY=sua_google_api_key" `
    "SUPABASE_URL=https://seu-projeto.supabase.co" `
    "SUPABASE_ANON_KEY=sua_supabase_anon_key"
```

### 3.5 Obter a URL da API

```bash
az containerapp show --name odontoja-api --resource-group upx-v --query properties.configuration.ingress.fqdn --output tsv
```

Anote a URL (ex: `odontoja-api.politedesert-eastus.azurecontainerapps.io`).

### 3.6 Testar

```bash
curl https://<seu-fqdn>/
# Deve retornar: {"message":"OdontoJá API está online!"}
```

---

## 4. Atualizar CORS no backend

Depois de obter a URL do frontend (passo 5), adicione a variável de ambiente:

```powershell
az containerapp update `
  --name odontoja-api `
  --resource-group upx-v `
  --set-env-vars `
    "AZURE_STATIC_WEB_APP_URL=https://seu-app.azurestaticapps.net"
```

---

## 5. Azure Static Web Apps (Frontend Web)

### 5.1 Criar via Portal

1. Vá em **Azure Portal > Create a resource > Static Web App**
2. Conecte sua conta GitHub e selecione o repositório
3. Build preset: **Custom**
4. App location: `frontend-app`
5. Output location: `dist`
6. Build command: `npm run build`

### 5.2 Configurar variáveis de ambiente do frontend

No Azure Portal > Static Web App > **Configuration > App settings**:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | sua anon key do Supabase |
| `VITE_API_URL` | `https://<seu-fqdn>/api` |

> **Importante:** Como o Vite injeta variáveis em build-time, se usar CI/CD do GitHub,
> configure essas variáveis como **secrets** no repositório GitHub e referencie no workflow.
> Se deploy manual:
> ```powershell
> cd frontend-app
> $env:VITE_API_URL = "https://<seu-fqdn>/api"
> $env:VITE_SUPABASE_URL = "https://seu-projeto.supabase.co"
> $env:VITE_SUPABASE_ANON_KEY = "sua_key"
> npm run build
> npx cap sync android
> ```

---

## 6. Atualizar APK com URL de produção

Após a API estar no ar, gere o APK apontando para a URL de produção:

```powershell
cd frontend-app

# Configurar .env de produção
# VITE_API_URL=https://<seu-fqdn>/api
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua_key

npm run build
npx cap sync android

# Gerar APK de debug
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 7. Gerar APK de Release (assinado)

### 7.1 Criar keystore

```powershell
keytool -genkey -v `
  -keystore odontoja-release.keystore `
  -alias odontoja `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

### 7.2 Configurar assinatura

Editar `frontend-app/android/app/build.gradle` — adicionar antes de `android {`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Dentro do bloco `android { }`, adicionar:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 7.3 Criar `frontend-app/android/keystore.properties`

```properties
storeFile=../../odontoja-release.keystore
storePassword=SUA_SENHA
keyAlias=odontoja
keyPassword=SUA_SENHA
```

### 7.4 Gerar APK assinado

```powershell
cd frontend-app/android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## 8. Subir nova versão do backend

```powershell
cd backend-api

az acr login --name odontojaacr
docker build -t odontojaacr.azurecr.io/odontoja-api:latest .
docker push odontojaacr.azurecr.io/odontoja-api:latest
az containerapp update --name odontoja-api --resource-group upx-v --image odontojaacr.azurecr.io/odontoja-api:latest
```

---

## Resumo de Custos

| Serviço | Custo/mês |
|---|---|
| Azure Container Apps (Free tier) | ~$0-10 |
| Azure Container Registry (Basic) | ~$5 |
| Azure Static Web Apps (Free) | $0 |
| **Total** | **~$5-15/mês** |

---

## Variáveis de Ambiente — Resumo

### Backend (Container App)

| Variável | Origem |
|---|---|
| `DATABASE_URL` | Supabase > Settings > Database |
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console |
| `SUPABASE_URL` | Supabase > Settings > API |
| `SUPABASE_ANON_KEY` | Supabase > Settings > API |
| `AZURE_STATIC_WEB_APP_URL` | URL do Static Web App (após passo 5) |

### Frontend (Static Web App / build-time)

| Variável | Origem |
|---|---|
| `VITE_API_URL` | URL do Container App + `/api` |
| `VITE_SUPABASE_URL` | Supabase > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Supabase > Settings > API |
