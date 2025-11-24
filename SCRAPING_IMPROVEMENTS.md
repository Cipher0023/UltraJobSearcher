# Melhorias no Sistema de Scraping

## Problemas Identificados

### 1. LinkedIn (0 vagas coletadas)
- **Causa**: Seletores CSS desatualizados
- **Problema adicional**: LinkedIn bloqueia scrapers agressivamente e exige login para muitas vagas
- **Solução aplicada**: Múltiplos seletores com fallback

### 2. Gupy (10 vagas sem descrição)
- **Causa**: Seletores genéricos não encontravam os elementos corretos
- **Problema adicional**: Gupy usa classes CSS dinâmicas (geradas automaticamente)
- **Solução aplicada**: Múltiplos seletores e espera por `networkidle`

### 3. Indeed, Greenhouse, Lever (0 vagas)
- **Causa**: Mesmos problemas de seletores desatualizados
- **Solução aplicada**: Seletores atualizados com fallbacks

## Melhorias Implementadas

### 1. Sistema de Fallback de Seletores
Cada adapter agora tenta múltiplos seletores CSS até encontrar o elemento:

```javascript
const getTextContent = (selectors) => {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.innerText?.trim()) return el.innerText.trim();
  }
  return "";
};
```

### 2. Melhor Tratamento de Timeouts
- Aumentado tempo de espera para 3 segundos após carregamento
- Uso de `networkidle` no Gupy (espera requisições AJAX terminarem)
- Delays aleatórios entre requisições (1-2 segundos)

### 3. Logs de Debug
Cada adapter agora mostra quantos links foram encontrados:
```
LinkedIn encontrou 15 links
Gupy encontrou 23 links
Indeed encontrou 18 links
```

### 4. Validação de Dados
Só adiciona vaga se tiver pelo menos título OU descrição:
```javascript
if (job.title || job.description) {
  results.push({ ...job, url: link, source: "linkedin" });
}
```

## Limitações Conhecidas

### 1. LinkedIn
**Problema**: Plataforma mais difícil de fazer scraping
- Exige login para ver detalhes completos
- Usa detecção avançada de bots
- Muda estrutura HTML frequentemente

**Soluções possíveis**:
- Usar API oficial do LinkedIn (requer aprovação)
- Implementar sistema de login automatizado (arriscado)
- Usar proxies rotativos
- Aceitar taxa de sucesso menor

### 2. Gupy
**Problema**: Classes CSS dinâmicas
- Classes mudam a cada build do site
- Estrutura varia entre empresas

**Soluções possíveis**:
- Usar atributos `data-testid` quando disponíveis
- Buscar por estrutura HTML ao invés de classes
- Implementar OCR para extrair texto visível

### 3. Rate Limiting
**Problema**: Sites podem bloquear após muitas requisições
- LinkedIn: ~10-15 requisições
- Indeed: ~30-40 requisições
- Gupy: ~50+ requisições

**Soluções possíveis**:
- Implementar sistema de proxies
- Aumentar delays entre requisições
- Distribuir coletas ao longo do tempo
- Usar serviços de scraping profissionais

## Recomendações de Uso

### Para Melhores Resultados:

1. **Use menos fontes por vez**
   - Ative apenas 2-3 fontes simultaneamente
   - Evite LinkedIn se precisar de muitas vagas

2. **Reduza o número de páginas**
   - Configure `pagesPerSource: 5-10` ao invés de 30
   - Faça múltiplas coletas menores

3. **Varie os termos de busca**
   - "desenvolvedor full stack" vs "full stack developer"
   - Termos em português funcionam melhor no Brasil

4. **Monitore os logs**
   - Verifique quantos links foram encontrados
   - Se encontrar 0 links, o seletor pode estar quebrado

## Próximas Melhorias Sugeridas

### Curto Prazo
- [ ] Adicionar screenshots em caso de erro (debug)
- [ ] Implementar retry automático com backoff
- [ ] Salvar HTML da página para análise posterior
- [ ] Adicionar modo "headful" para debug visual

### Médio Prazo
- [ ] Sistema de cache de resultados
- [ ] Detecção automática de seletores quebrados
- [ ] Rotação de User-Agents mais sofisticada
- [ ] Sistema de proxies

### Longo Prazo
- [ ] Usar APIs oficiais quando disponíveis
- [ ] Machine Learning para extrair dados de estruturas desconhecidas
- [ ] Sistema distribuído de coleta
- [ ] Monitoramento de saúde dos adapters

## Como Testar os Adapters

### Teste Individual
Você pode testar um adapter específico criando um arquivo de teste:

```javascript
// test-adapter.js
import { chromium } from 'playwright';
import * as linkedin from './src/adapters/linkedin.js';

const browser = await chromium.launch({ headless: false });
const results = await linkedin.collect({
  browser,
  userAgent: 'Mozilla/5.0...',
  role: 'desenvolvedor full stack',
  pagesPerSource: 5
});

console.log(JSON.stringify(results, null, 2));
await browser.close();
```

Execute com:
```bash
node test-adapter.js
```

### Modo Headful (Ver o Navegador)
No `playwrightManager.js`, mude:
```javascript
const browser = await chromium.launch({ headless: false });
```

Isso permite ver o que o scraper está fazendo em tempo real.
