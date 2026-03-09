# Guia de Testes - Controle de Vendas

Este documento fornece um guia completo sobre todos os tipos de testes disponíveis no projeto.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Testes Unitários](#testes-unitários)
- [Testes de Integração](#testes-de-integração)
- [Testes E2E](#testes-e2e)
- [Execução via Docker](#execução-via-docker)
- [CI/CD](#cicd)

## 🎯 Visão Geral

O projeto possui três camadas de testes:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  📱 E2E Tests (Cypress)                                     │
│  ├─ Login & Authentication                                 │
│  ├─ Complete User Workflows                                │
│  ├─ Integration Flows                                      │
│  └─ Error Handling                          ~83 tests      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔄 Integration Tests (pytest)                             │
│  ├─ API + DynamoDB                                         │
│  ├─ Lambda + API Gateway                                   │
│  └─ AWS Services                            ~15 tests      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🧪 Unit Tests                                              │
│  ├─ Backend (pytest): 100% coverage        ~50 tests       │
│  └─ Frontend (vitest)                       ~17 tests       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 Testes Unitários

### Backend (Python + pytest)

**Localização:** `api/tests/`

**Executar:**
```bash
# Localmente
cd api
pytest --cov=src --cov-report=html --cov-report=term

# Via Docker
docker-compose --profile test run --rm api-test

# Via Make
make test-api
```

**Cobertura:** 100%

**Testes incluem:**
- ✅ Handlers (Lambda functions)
- ✅ Services (Business logic)
- ✅ Repository (DynamoDB operations)
- ✅ Models (Data validation)
- ✅ Container (Dependency injection)

### Frontend (TypeScript + Vitest)

**Localização:** `web/src/app/**/*.spec.ts`

**Executar:**
```bash
# Localmente
cd web
npm test

# Com watch mode
npm run test:watch

# Com coverage
npm run test -- --coverage
```

**Testes incluem:**
- ✅ Components (17 tests)
- ✅ Services (HTTP communication)
- ✅ Guards (Authentication)
- ✅ Routing

## 🔄 Testes de Integração

### API Integration Tests

**Localização:** `api/tests/integration/`

**Executar:**
```bash
# Via Docker (recomendado)
make test-api-integration

# Ou manualmente
docker-compose --profile integration-test up -d localstack
docker-compose --profile integration-test run --rm api-integration-test
```

**Dependências:**
- LocalStack (AWS services emulator)
- DynamoDB Local

**Testes incluem:**
- ✅ API Gateway → Lambda → DynamoDB
- ✅ CORS configuration
- ✅ Error handling
- ✅ Authentication flows

## 🌐 Testes E2E

### Cypress E2E Tests

**Localização:** `web/cypress/e2e/`

#### Execução Local

```bash
# Interface interativa (desenvolvimento)
cd web
npm run e2e

# Headless (CI/CD)
npm run e2e:headless

# Suite específica
npx cypress run --spec "cypress/e2e/login.cy.ts"
```

#### Execução via Docker

```bash
# Usando Make (mais fácil)
make test-e2e

# Usando Docker Compose
docker-compose --profile dev up -d
sleep 15
docker-compose --profile e2e-test run --rm web-e2e-test
docker-compose down

# Usando scripts
./web/scripts/run-e2e-tests.sh          # Linux/macOS
web\scripts\run-e2e-tests.bat           # Windows

# Usando NPM
cd web
npm run e2e:docker
```

### Suites de Teste E2E

| Suite | Testes | Status | Descrição |
|-------|--------|--------|-----------|
| **login.cy.ts** | 4 | ✅ 100% | Login, logout, validação |
| **cash-sales.cy.ts** | 6 | ✅ 100% | Vendas à vista |
| **credit-sales.cy.ts** | 9 | ✅ 100% | Vendas a prazo |
| **customers.cy.ts** | 7 | 🟡 86% | CRUD de clientes |
| **payments.cy.ts** | 6 | 🟡 50% | Registro de pagamentos |
| **dashboard.cy.ts** | 4 | ✅ 100% | Dashboard e métricas |
| **navigation.cy.ts** | 5 | 🟡 80% | Navegação entre páginas |
| **workflow.cy.ts** | 5 | 🟡 60% | Fluxos completos |
| **customer-integration.cy.ts** | 6 | 🆕 New | Integração clientes |
| **sales-integration.cy.ts** | 6 | 🆕 New | Integração vendas |
| **form-validation.cy.ts** | 10 | 🟡 90% | Validações de form |
| **error-handling.cy.ts** | 15 | 🟡 60% | Tratamento de erros |
| **TOTAL** | **83** | **~75%** | |

## 🐳 Execução via Docker

### Pré-requisitos

```bash
# Verificar Docker
docker --version
docker-compose --version

# Opcional: Make
make --version
```

### Comandos Make Disponíveis

```bash
make help              # Lista todos os comandos
make up                # Inicia ambiente dev
make down              # Para todos os containers
make test-api          # Testes unitários API
make test-web          # Testes unitários Web
make test-e2e          # Testes E2E via Docker
make test-all          # TODOS os testes
make build-e2e         # Rebuild container testes
make clean-screenshots # Remove screenshots
make logs              # Logs de todos os serviços
make status            # Status dos containers
```

### Arquitetura Docker de Testes

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │              │  │              │  │              │      │
│  │   web-dev    │  │     api      │  │  dynamodb    │      │
│  │  (Angular)   │  │  (Python)    │  │   -local     │      │
│  │              │  │              │  │              │      │
│  │ :4200        │  │ :8000        │  │ :8001        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                 ┌─────────▼─────────┐                      │
│                 │                   │                      │
│                 │  web-e2e-test     │                      │
│                 │   (Cypress)       │                      │
│                 │                   │                      │
│                 │  - Chrome         │                      │
│                 │  - Screenshots    │                      │
│                 │  - Test Results   │                      │
│                 │                   │                      │
│                 └───────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Profiles Docker Compose

O projeto usa profiles para organizar serviços:

- **default**: Apenas DynamoDB
- **dev**: Ambiente de desenvolvimento (web-dev + api)
- **prod**: Ambiente de produção (web + api)
- **test**: Testes unitários API
- **integration-test**: Testes integração API (+ LocalStack)
- **e2e-test**: Testes E2E Web (+ Cypress)
- **admin**: DynamoDB Admin UI

### Fluxo Completo de Testes

```bash
# 1. Start all test environments
make up

# 2. Run all tests in sequence
make test-api              # API unit tests
make test-api-integration  # API integration tests
make test-web              # Web unit tests
make test-e2e              # Web E2E tests

# 3. Check results
ls web/cypress/screenshots/  # Screenshots de falhas
ls web/cypress/videos/       # Vídeos das execuções

# 4. Cleanup
make down
make clean-screenshots
```

## 🚀 CI/CD

### GitHub Actions

O projeto possui workflows automatizados:

**`.github/workflows/e2e-tests.yml`**
- Executa em push/PR para main, develop, staging
- Start ambiente Docker
- Executa testes E2E
- Upload de screenshots/vídeos em caso de falha
- Cleanup automático

**Executar manualmente:**
```bash
# Simular CI localmente
act -j e2e-tests  # Requer 'act' CLI
```

### Métricas e Relatórios

**Cobertura de Código:**
```bash
# API
cd api
pytest --cov=src --cov-report=html
open htmlcov/index.html

# Web (se configurado)
cd web
npm run test -- --coverage
```

**Results Cypress:**
```bash
# Após executar testes E2E
ls -la web/cypress/screenshots/
ls -la web/cypress/videos/
```

## 🐛 Troubleshooting

### Testes E2E falhando

```bash
# 1. Verificar se ambiente está rodando
make status

# 2. Verificar logs
make logs-web
make logs-api

# 3. Verificar conectividade
curl http://localhost:4200
curl http://localhost:8000/health

# 4. Rebuild containers
make down
make build-e2e
make test-e2e
```

### Timeout nos testes

```bash
# Aumentar tempo de espera
docker-compose --profile dev up -d
sleep 30  # Aumentar de 15 para 30
docker-compose --profile e2e-test run --rm web-e2e-test
```

### Problemas com screenshots/videos

```bash
# Verificar permissões
chmod -R 755 web/cypress/screenshots
chmod -R 755 web/cypress/videos

# Limpar antigos
make clean-screenshots
make clean-videos
```

### Container de testes não inicia

```bash
# Verificar logs
docker-compose logs web-e2e-test

# Rebuild sem cache
docker-compose build --no-cache web-e2e-test

# Verificar Dockerfile.test
cat web/Dockerfile.test
```

## 📚 Recursos Adicionais

- **Cypress Docs**: https://docs.cypress.io/
- **pytest Docs**: https://docs.pytest.org/
- **Vitest Docs**: https://vitest.dev/
- **Docker Compose**: https://docs.docker.com/compose/

## ✅ Checklist de Qualidade

Antes de fazer commit/deploy:

- [ ] Testes unitários passando (API + Web)
- [ ] Testes de integração passando (API)
- [ ] Testes E2E passando (>70%)
- [ ] Cobertura de código > 80%
- [ ] Sem warnings ou deprecations
- [ ] Documentação atualizada
- [ ] Screenshots limpos (git)
- [ ] Vídeos não commitados

## 🎯 Roadmap de Testes

### Próximos Passos

- [ ] Aumentar cobertura E2E para 90%+
- [ ] Adicionar testes de acessibilidade (cypress-axe)
- [ ] Adicionar testes de performance
- [ ] Configurar testes paralelos
- [ ] Integrar relatórios (mochawesome)
- [ ] Adicionar testes de segurança (OWASP)
- [ ] Configurar testes de carga (k6)
- [ ] Visual regression testing (Percy)

---

**Documentação atualizada em:** Março 2026  
**Versão:** 1.0.0
