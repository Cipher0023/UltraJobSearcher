# UltraJob - Coletor de Descrições de Vagas

Aplicação web para coletar descrições de vagas de múltiplas plataformas de emprego e analisar requisitos para otimização de currículo.

## Estrutura do Projeto

```
UltraJob/
├── backend/          # API Express + Playwright
│   ├── src/
│   │   ├── adapters/ # Scrapers para cada plataforma
│   │   ├── server.js
│   │   ├── collector.js
│   │   └── playwrightManager.js
│   └── package.json
├── frontend/         # Interface Next.js
│   ├── src/
│   │   ├── app/
│   │   └── components/
│   └── package.json
└── README.md
```

## Instalação

### Backend

```bash
cd backend
npm install
npx playwright install
```

### Frontend

```bash
cd frontend
npm install
```

## Como Rodar

### 1. Iniciar o Backend

```bash
cd backend
npm run dev
```

O servidor estará rodando em `http://localhost:4000`

### 2. Iniciar o Frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

A interface estará disponível em `http://localhost:3000`

## Como Usar

1. **Adicionar Cargos**: Digite os cargos que você busca (ex: "Full Stack Developer", "Frontend React")

2. **Configurar Fontes**: 
   - Clique em "Carregar Padrões" para adicionar as fontes principais
   - Ou adicione URLs personalizadas
   - Ative/desative as fontes desejadas

3. **Coletar Vagas**: Clique em "Coletar Vagas" para iniciar o processo

4. **Resultados**: Os arquivos JSON e CSV serão salvos na pasta `backend/collected/`

## Fontes Suportadas

- LinkedIn Jobs
- Indeed
- Gupy
- Vagas.com
- Greenhouse
- Lever
- URLs personalizadas (adapter genérico)

## Tecnologias

- **Backend**: Node.js, Express, Playwright
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS

## Próximos Passos

- [ ] Adicionar análise de palavras-chave
- [ ] Implementar extração de requisitos técnicos
- [ ] Criar visualizações de dados
- [ ] Adicionar sugestões de otimização de currículo
- [ ] Implementar sistema de cache
- [ ] Adicionar mais plataformas de emprego
