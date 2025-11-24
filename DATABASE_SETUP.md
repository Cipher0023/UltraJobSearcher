# Banco de Dados - UltraJob

## Implementação

O projeto agora usa **SQLite** com `better-sqlite3` para armazenar todas as vagas coletadas.

## Estrutura do Banco

### Tabela: `collections`
Armazena informações sobre cada coleta realizada.

```sql
- id: INTEGER PRIMARY KEY
- created_at: DATETIME
- roles: TEXT (JSON array)
- sources: TEXT (JSON array)
- total_jobs: INTEGER
```

### Tabela: `jobs`
Armazena as vagas coletadas.

```sql
- id: INTEGER PRIMARY KEY
- collection_id: INTEGER (FK)
- title: TEXT
- company: TEXT
- location: TEXT
- description: TEXT
- url: TEXT UNIQUE
- source: TEXT
- created_at: DATETIME
```

## Instalação

```bash
cd backend
npm install
```

O banco será criado automaticamente em `backend/jobs.db` na primeira execução.

## Novas APIs

### GET /api/collections
Lista todas as coleções realizadas.

**Response:**
```json
{
  "ok": true,
  "collections": [
    {
      "id": 1,
      "created_at": "2025-01-23T10:30:00",
      "roles": "[\"desenvolvedor full stack\"]",
      "sources": "[\"linkedin\",\"gupy\"]",
      "total_jobs": 45
    }
  ]
}
```

### GET /api/collections/:id/jobs
Busca vagas de uma coleção específica.

**Query params:**
- `limit`: número de vagas (default: 100)
- `offset`: paginação (default: 0)

**Response:**
```json
{
  "ok": true,
  "jobs": [
    {
      "id": 1,
      "title": "Desenvolvedor Full Stack",
      "company": "Empresa X",
      "location": "São Paulo",
      "description": "...",
      "url": "https://...",
      "source": "linkedin",
      "created_at": "2025-01-23T10:35:00"
    }
  ]
}
```

### GET /api/collections/:id/stats
Estatísticas de uma coleção.

**Response:**
```json
{
  "ok": true,
  "stats": [
    { "source": "linkedin", "count": 15 },
    { "source": "gupy", "count": 20 },
    { "source": "vagas", "count": 10 }
  ]
}
```

### GET /api/search?q=termo
Busca vagas por termo em todas as coleções.

**Query params:**
- `q`: termo de busca (obrigatório)
- `limit`: número de resultados (default: 50)

### DELETE /api/collections/:id
Deleta uma coleção e todas suas vagas.

## Novos Componentes Frontend

### CollectionsList
Lista todas as coleções anteriores com:
- Data e hora da coleta
- Cargos buscados
- Fontes utilizadas
- Total de vagas
- Botão para deletar

### JobsViewer
Visualiza vagas de uma coleção com:
- Estatísticas por fonte
- Busca/filtro de vagas
- Lista de vagas
- Modal com detalhes completos
- Link para vaga original

## Fluxo de Uso

1. **Fazer uma coleta**
   - Adicionar cargos
   - Selecionar fontes
   - Clicar em "Coletar Vagas"
   - Acompanhar progresso em tempo real

2. **Visualizar resultados**
   - Automaticamente seleciona a coleção recém-criada
   - Mostra estatísticas
   - Lista todas as vagas encontradas

3. **Acessar coleções antigas**
   - Clique em qualquer coleção da lista
   - Visualize as vagas salvas
   - Use a busca para filtrar

4. **Gerenciar coleções**
   - Delete coleções antigas
   - Mantenha histórico organizado

## Vantagens

✅ **Persistência**: Dados não se perdem ao fechar o navegador
✅ **Histórico**: Acesse coletas antigas a qualquer momento
✅ **Busca**: Encontre vagas específicas rapidamente
✅ **Estatísticas**: Veja quantas vagas cada fonte trouxe
✅ **Performance**: SQLite é rápido e eficiente
✅ **Backup**: Arquivos JSON/CSV continuam sendo gerados

## Backup

Os arquivos JSON e CSV continuam sendo salvos em `backend/collected/` como backup.

O banco de dados fica em `backend/jobs.db` e pode ser copiado para backup.
