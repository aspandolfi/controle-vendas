# Testes E2E com Cypress via Docker

Este documento explica como executar os testes E2E (End-to-End) do frontend web usando Docker.

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 1.29+
- Make (opcional, mas recomendado)

## 🚀 Execução Rápida

### Usando Make (Recomendado)

```bash
# Na raiz do projeto
make test-e2e
```

Este comando irá:
1. Iniciar o ambiente de desenvolvimento (web-dev, api, dynamodb)
2. Aguardar os serviços ficarem prontos
3. Executar os testes E2E no container Cypress
4. Exibir os resultados

### Usando Docker Compose Diretamente

```bash
# Na raiz do projeto

# 1. Iniciar ambiente de desenvolvimento
docker-compose --profile dev up -d web-dev api dynamodb-local

# 2. Aguardar serviços ficarem prontos (15-20 segundos)
sleep 15

# 3. Executar testes E2E
docker-compose --profile e2e-test run --rm web-e2e-test

# 4. Parar ambiente
docker-compose --profile dev down
```

### Usando NPM Scripts

```bash
# No diretório web/

# Iniciar ambiente Docker
npm run e2e:docker:up

# Aguardar serviços (15-20 segundos)

# Executar testes
npm run e2e:docker

# Parar ambiente
npm run e2e:docker:down
```

### Usando Shell Script

```bash
# No diretório web/
chmod +x scripts/run-e2e-tests.sh
./scripts/run-e2e-tests.sh
```

## 📁 Estrutura de Arquivos

```
controle-vendas/
├── docker-compose.yml           # Configuração dos serviços
├── Makefile                     # Comandos simplificados
└── web/
    ├── Dockerfile.test          # Imagem Docker para testes Cypress
    ├── cypress/
    │   ├── e2e/                 # Testes E2E
    │   │   ├── cash-sales.cy.ts
    │   │   ├── credit-sales.cy.ts
    │   │   ├── customer-integration.cy.ts
    │   │   ├── customers.cy.ts
    │   │   ├── dashboard.cy.ts
    │   │   ├── error-handling.cy.ts
    │   │   ├── form-validation.cy.ts
    │   │   ├── login.cy.ts
    │   │   ├── navigation.cy.ts
    │   │   ├── payments.cy.ts
    │   │   ├── sales-integration.cy.ts
    │   │   └── workflow.cy.ts
    │   ├── support/             # Comandos customizados
    │   │   ├── commands.ts
    │   │   └── e2e.ts
    │   ├── screenshots/         # Screenshots de falhas
    │   └── videos/              # Vídeos das execuções
    ├── cypress.config.ts        # Configuração do Cypress
    └── scripts/
        └── run-e2e-tests.sh     # Script de execução automatizada
```

## 🔧 Configuração

### Dockerfile.test

O arquivo `web/Dockerfile.test` usa a imagem oficial do Cypress com Chrome pré-instalado:

```dockerfile
FROM cypress/included:13.15.2
# Inclui Node.js, Cypress e Chrome/Electron
```

### Docker Compose Service

O serviço `web-e2e-test` está configurado no `docker-compose.yml`:

```yaml
web-e2e-test:
  build:
    context: ./web
    dockerfile: Dockerfile.test
  environment:
    - CYPRESS_baseUrl=http://web-dev:4200
    - CYPRESS_video=false
    - CYPRESS_screenshotOnRunFailure=true
  depends_on:
    - web-dev
    - api
  profiles:
    - e2e-test
```

## 📊 Suites de Teste Disponíveis

| Suite | Arquivo | Descrição | Testes |
|-------|---------|-----------|--------|
| Login | `login.cy.ts` | Autenticação e validação | 4 |
| Cash Sales | `cash-sales.cy.ts` | Vendas à vista | 6 |
| Credit Sales | `credit-sales.cy.ts` | Vendas a prazo | 9 |
| Customers | `customers.cy.ts` | Gestão de clientes | 7 |
| Payments | `payments.cy.ts` | Registro de pagamentos | 6 |
| Dashboard | `dashboard.cy.ts` | Estatísticas e gráficos | 4 |
| Navigation | `navigation.cy.ts` | Navegação entre páginas | 5 |
| Workflow | `workflow.cy.ts` | Fluxos completos | 5 |
| Customer Integration | `customer-integration.cy.ts` | Integração clientes | 6 |
| Sales Integration | `sales-integration.cy.ts` | Integração vendas | 6 |
| Form Validation | `form-validation.cy.ts` | Validação de formulários | 10 |
| Error Handling | `error-handling.cy.ts` | Tratamento de erros | 15 |
| **TOTAL** | | | **~83** |

## 🎯 Comandos Make Disponíveis

```bash
make help              # Exibe todos os comandos disponíveis
make up                # Inicia ambiente de desenvolvimento
make down              # Para todos os containers
make test-e2e          # Executa testes E2E via Docker
make test-e2e-local    # Executa testes E2E localmente
make test-all          # Executa todos os testes (API + Web + E2E)
make build-e2e         # Rebuild do container de testes
make clean-screenshots # Remove screenshots de testes
make clean-videos      # Remove vídeos de testes
make logs-web          # Exibe logs do frontend
make status            # Mostra status dos containers
```

## 📸 Screenshots e Vídeos

### Screenshots

Por padrão, screenshots são capturados apenas quando um teste falha:

```bash
web/cypress/screenshots/
├── cash-sales.cy.ts/
│   └── should create new cash sale (failed).png
└── error-handling.cy.ts/
    └── should handle API error (failed).png
```

### Vídeos

Vídeos estão **desabilitados** por padrão para performance. Para habilitá-los:

```yaml
# docker-compose.yml
environment:
  - CYPRESS_video=true  # Alterar de false para true
```

## 🐛 Troubleshooting

### Testes falhando com timeout

```bash
# Aumentar tempo de espera para serviços
make test-e2e
# Se falhar, aguarde mais tempo e tente novamente:
sleep 10
docker-compose --profile e2e-test run --rm web-e2e-test
```

### Container não consegue conectar ao web-dev

```bash
# Verificar se web-dev está rodando
docker ps | grep web-dev

# Ver logs do web-dev
make logs-web

# Verificar conectividade de rede
docker network inspect controle-vendas_controle-vendas-network
```

### Rebuild da imagem de teste

```bash
# Se houver mudanças no Dockerfile.test ou dependências
make build-e2e

# Ou com Docker Compose
docker-compose build web-e2e-test --no-cache
```

### Limpar screenshots antigos

```bash
make clean-screenshots
# ou
rm -rf web/cypress/screenshots/*
```

## 🔄 Fluxo de CI/CD

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start services
        run: |
          docker-compose --profile dev up -d web-dev api dynamodb-local
          sleep 20
      
      - name: Run E2E tests
        run: |
          docker-compose --profile e2e-test run --rm web-e2e-test
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: web/cypress/screenshots/
      
      - name: Cleanup
        if: always()
        run: docker-compose down
```

## 📝 Desenvolvimento de Novos Testes

### Executar Cypress Interativo Localmente

Para desenvolver novos testes com a interface visual do Cypress:

```bash
# Terminal 1: Iniciar ambiente
make up

# Terminal 2: Abrir Cypress UI
cd web
npm run e2e
```

### Executar Suite Específica

```bash
# Via Docker
docker-compose --profile e2e-test run --rm web-e2e-test \
  npx cypress run --spec "cypress/e2e/login.cy.ts"

# Localmente
cd web
npx cypress run --spec "cypress/e2e/login.cy.ts"
```

## 📚 Recursos Adicionais

- [Documentação do Cypress](https://docs.cypress.io/)
- [Cypress Docker Images](https://github.com/cypress-io/cypress-docker-images)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Custom Commands](https://docs.cypress.io/api/cypress-api/custom-commands)

## ✅ Checklist de Verificação

Antes de fazer commit de novos testes:

- [ ] Testes passam localmente
- [ ] Testes passam via Docker
- [ ] Screenshots removidos (se não necessários)
- [ ] Sem hardcoded waits desnecessários
- [ ] Comandos customizados criados se necessário
- [ ] Documentação atualizada
- [ ] Mocks de API configurados quando apropriado

## 🎉 Próximos Passos

1. Integrar com pipeline CI/CD
2. Configurar relatórios de cobertura (mochawesome)
3. Adicionar testes de performance
4. Configurar testes paralelos
5. Adicionar testes de acessibilidade (cypress-axe)
