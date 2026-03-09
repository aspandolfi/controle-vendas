# Lambda Python API

API REST em Python usando AWS Lambda, API Gateway e DynamoDB.

## 📁 Estrutura

```
api/
├── src/
│   ├── handler.py         # Lambda handler principal
│   ├── models.py          # Modelos Pydantic
│   ├── repository.py      # Repositório DynamoDB
│   ├── service.py         # Lógica de negócio
│   ├── container.py       # Dependency injection
│   └── local_server.py    # Servidor local para desenvolvimento
├── tests/
│   ├── conftest.py        # Configuração de testes unitários
│   ├── test_*.py          # Testes unitários
│   └── integration/       # Testes de integração
│       ├── conftest.py    # Configuração LocalStack
│       ├── test_customer_integration.py
│       ├── test_sales_payment_integration.py
│       └── README.md      # Documentação dos testes de integração
├── scripts/
│   ├── run-integration-tests.sh   # Script para rodar testes de integração (Linux/Mac)
│   └── run-integration-tests.bat  # Script para rodar testes de integração (Windows)
├── requirements.txt       # Dependências de produção
├── requirements-dev.txt   # Dependências de desenvolvimento
├── pyproject.toml        # Configuração pytest e coverage
└── Makefile              # Comandos úteis do projeto
```

## 🚀 Setup Local

### Criar ambiente virtual

```bash
cd api
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate     # Windows
```

### Instalar dependências

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## 🧪 Executar Testes

### Testes Unitários (Rápidos)

```bash
# Todos os testes unitários
pytest tests/ --ignore=tests/integration/

# Com coverage
pytest tests/ --ignore=tests/integration/ --cov=src --cov-report=html

# Teste específico
pytest tests/test_handler.py::test_health_check -v

# Usando Makefile
make test-unit
make coverage
```

### Testes de Integração (com LocalStack)

Os testes de integração validam o comportamento completo da aplicação com serviços AWS emulados pelo LocalStack.

```bash
# Executar testes de integração  para testes unitários
- **localstack**: Emulador de serviços AWS para testes de integração
- **localstack-client**: Cliente Python para LocalStack
- **pytest-localstack**: Plugin pytest para LocalStack(inicia LocalStack automaticamente)
./scripts/run-integration-tests.sh    # Linux/Mac
scripts\run-integration-tests.bat     # Windows

# Ou usando Makefile
make test-integration

# Se LocalStack já está rodando
make test-integration-quick
```

**Pré-requisitos para testes de integração:**
- Docker e Docker Compose instalados
- Porta 4566 disponível (LocalStack)

Para mais informações sobre testes de integração, consulte [tests/integration/README.md](tests/integration/README.md).

### Todos os Testes

```bash
# Executar unitários + integração
make test-all
```

## 📦 Dependências

### Produção
- **boto3**: SDK AWS para Python
- **aws-lambda-powertools**: Logging, tracing e métricas
- **pydantic**: Validação de dados

### Desenvolvimento
- **pytest**: Framework de testes
- **pytest-cov**: Coverage de testes
- **pytest-mock**: Mocks para testes
- **moto**: Mock de serviços AWS

## 🔌 Endpoints

### Health Check
```
GET /health
Response: {"status": "healthy", "service": "controle-vendas-api", "version": "0.0.1"}
```

### Customers
```
GET /customers        # Listar clientes
POST /customers       # Criar cliente
```

### Sales
```
GET /sales           # Listar vendas
POST /sales          # Criar venda
```

### Payments
```
GET /payments        # Listar pagamentos
POST /payments       # Criar pagamento
```

## 🏗️ Single Table Design (DynamoDB)

Consulte a documentação em `../docs/dynamodb-single-table-design.md` para detalhes do modelo de dados.

## 🔐 Variáveis de Ambiente

- `DYNAMODB_TABLE_NAME`: Nome da tabela DynamoDB
- `AWS_REGION`: Região AWS (padrão: sa-east-1)
- `LOG_LEVEL`: Nível de log (INFO, DEBUG, ERROR)
- `POWERTOOLS_SERVICE_NAME`: Nome do serviço para logs
- `DYNAMODB_ENDPOINT`: Endpoint do DynamoDB (para desenvolvimento local)

## 🛠️ Comandos Úteis (Makefile)

```bash
make help                    # Mostra todos os comandos disponíveis

# Instalação
make install                 # Instala dependências de desenvolvimento
make install-prod           # Instala apenas dependências de produção

# Testes
make test-unit              # Testes unitários
make test-integration       # Testes de integração
make test-all              # Todos os testes
make coverage              # Relatório de cobertura

# LocalStack
make localstack-start      # Inicia LocalStack
make localstack-stop       # Para LocalStack
make localstack-health     # Verifica saúde do LocalStack
make localstack-logs       # Mostra logs

# Docker
make docker-build          # Constrói imagem Docker
make docker-run            # Executa container
make docker-stop           # Para container
make docker-logs           # Mostra logs

# Desenvolvimento
make dev-server            # Inicia servidor local
make clean                 # Remove arquivos temporários
```

## 📝 TODO

- [ ] Implementar queries DynamoDB
- [ ] Adicionar autenticação JWT
- [ ] Implementar validação de PIN
- [ ] Adicionar paginação nos endpoints de listagem
- [ ] Implementar filtros por data
- [ ] Adicionar tratamento de erros customizado
- [ ] Documentação OpenAPI/Swagger
