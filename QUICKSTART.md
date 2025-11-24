# Quick Start - UltraJob

## Instalação Rápida

### 1. Instalar dependências do Backend

```bash
cd backend
npm install
npx playwright install chromium
```

### 2. Instalar dependências do Frontend

```bash
cd ../frontend
npm install
```

## Rodar o Projeto

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Aguarde a mensagem: `Server listening 4000`

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Acesse: `http://localhost:3000`

## Teste Rápido

1. Na interface, clique em **"Carregar Padrões"** para adicionar as fontes
2. Digite um cargo, exemplo: **"desenvolvedor full stack"**
3. Clique em **"Adicionar"**
4. Clique em **"Coletar Vagas"**
5. Aguarde o processo (pode levar alguns minutos)
6. Os resultados aparecerão na tela e os arquivos estarão em `backend/collected/`

## Estrutura dos Arquivos Gerados

```
backend/collected/
├── jobs-1234567890.json  # Dados estruturados
└── jobs-1234567890.csv   # Planilha para análise
```

## Troubleshooting

### Backend não inicia
- Verifique se a porta 4000 está livre
- Execute `npm install` novamente no backend

### Frontend não conecta
- Verifique se o backend está rodando
- Confirme que está acessando `http://localhost:3000`

### Playwright não funciona
- Execute: `npx playwright install chromium`
- No Linux, pode precisar de: `npx playwright install-deps`

### Nenhuma vaga coletada
- Algumas plataformas podem bloquear scrapers
- Tente com menos fontes ativas
- Verifique a conexão com internet

## Próximos Passos

Após coletar as vagas, você pode:
1. Abrir os arquivos JSON/CSV para análise
2. Identificar palavras-chave mais frequentes
3. Adaptar seu currículo com base nos requisitos encontrados
