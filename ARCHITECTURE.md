# Arquitetura do UltraJob

## Visão Geral

O UltraJob é uma aplicação full-stack que coleta descrições de vagas de emprego de múltiplas plataformas usando web scraping e apresenta os resultados através de uma interface moderna.

## Stack Tecnológica

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Playwright** - Automação de navegador para scraping
- **p-queue** - Controle de concorrência
- **cors** - Habilitação de CORS
- **helmet** - Segurança HTTP

### Frontend
- **Next.js 16** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização

## Fluxo de Dados

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│   Backend   │
│  (Express)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Collector  │
│   Engine    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│  Adapters   │─────▶│ Playwright  │
│  (Scrapers) │      │   Browser   │
└─────────────┘      └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Job Sites  │
                     │  (LinkedIn, │
                     │   Indeed,   │
                     │   etc.)     │
                     └─────────────┘
```

## Componentes Principais

### Backend

#### 1. Server (`server.js`)
- Gerencia rotas HTTP
- Endpoints:
  - `GET /api/health` - Health check
  - `POST /api/discover` - Detecta tipo de fonte a partir de URL
  - `POST /api/collect` - Inicia coleta de vagas

#### 2. Collector (`collector.js`)
- Orquestra o processo de coleta
- Gerencia fila de tarefas com concorrência
- Deduplica resultados
- Salva arquivos JSON e CSV

#### 3. Playwright Manager (`playwrightManager.js`)
- Gerencia instâncias do navegador
- Fornece User-Agents aleatórios
- Controla modo headless/headful

#### 4. Adapters (`adapters/`)
Cada adapter implementa a interface:
```javascript
export async function collect({ browser, userAgent, role, pagesPerSource, src }) {
  // Lógica de scraping específica da plataforma
  return results; // Array de jobs
}
```

Adapters disponíveis:
- `linkedin.js` - LinkedIn Jobs
- `indeed.js` - Indeed
- `gupy.js` - Gupy
- `vagas.js` - Vagas.com
- `greenhouse.js` - Greenhouse
- `lever.js` - Lever
- `genericAdapter.js` - Fallback para URLs desconhecidas

### Frontend

#### 1. Page (`app/page.tsx`)
- Componente principal
- Gerencia estado global da aplicação
- Coordena comunicação com backend

#### 2. Components

**RoleInput** (`components/RoleInput.tsx`)
- Input para adicionar cargos desejados
- Gerencia lista de roles
- Validação de duplicatas

**SourceManager** (`components/SourceManager.tsx`)
- Gerencia fontes de dados
- Permite adicionar URLs personalizadas
- Toggle de ativação/desativação
- Integração com endpoint `/api/discover`

**RunPanel** (`components/RunPanel.tsx`)
- Botão de execução
- Indicador de loading
- Validação de pré-requisitos

**ResultsTable** (`components/ResultsTable.tsx`)
- Exibe resultados da coleta
- Mostra caminhos dos arquivos gerados
- Tratamento de erros

## Padrões de Design

### 1. Adapter Pattern
Cada plataforma tem seu próprio adapter, permitindo:
- Fácil adição de novas plataformas
- Isolamento de lógica específica
- Manutenção independente

### 2. Queue Pattern
Uso de `p-queue` para:
- Controlar concorrência
- Evitar sobrecarga de requisições
- Melhorar performance

### 3. Component Composition
Frontend usa composição de componentes:
- Separação de responsabilidades
- Reutilização de código
- Manutenibilidade

## Segurança

### Backend
- Helmet para headers de segurança
- CORS configurado
- Validação de entrada
- Timeout em requisições

### Scraping
- User-Agent randomizado
- Delays entre requisições
- Tratamento de erros gracioso
- Limite de páginas por fonte

## Performance

### Otimizações
- Concorrência controlada (3 tarefas simultâneas)
- Deduplicação de resultados
- Timeout configurável
- Modo headless por padrão

### Limitações Atuais
- Sem cache de resultados
- Sem retry automático
- Sem proxy rotation
- Sem rate limiting inteligente

## Extensibilidade

### Adicionar Nova Plataforma

1. Criar novo adapter em `backend/src/adapters/`:
```javascript
// backend/src/adapters/novaplataforma.js
export async function collect({ browser, userAgent, role, pagesPerSource }) {
  // Implementar lógica de scraping
  return results;
}
```

2. Registrar no collector:
```javascript
// backend/src/collector.js
import * as novaplataforma from './adapters/novaplataforma.js';

const ADAPTERS = {
  // ...
  novaplataforma,
};
```

3. Adicionar detecção no server:
```javascript
// backend/src/server.js
if (host.includes("novaplataforma")) 
  known.push({ key: "novaplataforma", host });
```

## Melhorias Futuras

### Curto Prazo
- [ ] Análise de palavras-chave
- [ ] Extração de requisitos técnicos
- [ ] Sistema de cache
- [ ] Retry automático

### Médio Prazo
- [ ] Dashboard de análise
- [ ] Comparação de currículos
- [ ] Sugestões de otimização
- [ ] Exportação de relatórios

### Longo Prazo
- [ ] Machine Learning para análise
- [ ] API pública
- [ ] Sistema de autenticação
- [ ] Histórico de coletas
