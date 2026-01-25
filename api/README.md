# Lambda Python API

API REST em Python usando AWS Lambda, API Gateway e DynamoDB.

## 📁 Estrutura

```
api/
├── src/
│   ├── handler.py         # Lambda handler principal
│   ├── models.py          # Modelos Pydantic
│   └── repository.py      # Repositório DynamoDB
├── tests/
│   ├── conftest.py        # Configuração de testes
│   └── test_handler.py    # Testes unitários
├── requirements.txt       # Dependências de produção
├── requirements-dev.txt   # Dependências de desenvolvimento
└── pyproject.toml        # Configuração pytest e coverage
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

```bash
# Todos os testes
pytest

# Com coverage
pytest --cov=src --cov-report=html

# Teste específico
pytest tests/test_handler.py::test_health_check -v
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

## 📝 TODO

- [ ] Implementar queries DynamoDB
- [ ] Adicionar autenticação JWT
- [ ] Implementar validação de PIN
- [ ] Adicionar paginação nos endpoints de listagem
- [ ] Implementar filtros por data
- [ ] Adicionar tratamento de erros customizado
- [ ] Documentação OpenAPI/Swagger
