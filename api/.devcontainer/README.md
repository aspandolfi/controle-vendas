# DevContainer - API Python

Este DevContainer está configurado para desenvolvimento do projeto API em Python.

## 🚀 Características

### Ambiente Base
- **Python 3.11** (slim)
- **VS Code Remote Containers**
- Docker-in-Docker para build de imagens

### Ferramentas AWS
- AWS CLI
- AWS Toolkit para VS Code
- LocalStack support (endpoint configurado)

### Ferramentas de Desenvolvimento
- **Testing**: pytest, pytest-cov, pytest-mock
- **Linting**: flake8
- **Formatting**: black, isort
- **Type Checking**: mypy
- **Debug**: ipython, ipdb
- **Local Server**: uvicorn, mangum

### Infraestrutura
- Terraform
- Docker-in-Docker

## 📦 Extensões VS Code Incluídas

- Python
- Pylance (IntelliSense)
- Black Formatter
- Flake8
- isort
- AWS Toolkit
- Terraform
- TOML Support
- YAML Support
- Code Spell Checker

## 🔧 Configurações

### Portas
- **8000**: API local (uvicorn)

### Variáveis de Ambiente
```bash
AWS_DEFAULT_REGION=sa-east-1
POWERTOOLS_SERVICE_NAME=controle-vendas-api
LOG_LEVEL=DEBUG
PYTHONUNBUFFERED=1
AWS_ENDPOINT_URL=http://localhost:4566
LOCALSTACK_ENDPOINT=http://localhost:4566
```

### Serviços Disponíveis no Dev Container
- **DynamoDB Local** (porta 8001)
- **LocalStack** (porta 4566) - para testes de integração

## 🧪 Executando Testes no Dev Container

### Testes Unitários
```bash
pytest tests/ --ignore=tests/integration/ -v
# ou
make test-unit
```

### Testes de Integração
```bash
# LocalStack já está disponível no Dev Container
pytest tests/integration/ -v
# ou
make test-integration-quick
```

### Todos os Testes
```bash
make test-all
```

## 🐳 Executando Testes via Docker (fora do Dev Container)

Se preferir executar testes em containers isolados (não dentro do Dev Container):

```bash
# Testes unitários
./scripts/run-unit-tests-docker.sh

# Testes de integração
./scripts/run-integration-tests-docker.sh

# Todos os testes
./scripts/run-all-tests-docker.sh
```

Consulte [DOCKER_TESTING.md](../DOCKER_TESTING.md) para mais informações.

## 🔄 Workflow Recomendado

1. **Desenvolvimento Diário:** Use o Dev Container
   - Hot reload automático
   - Acesso direto a DynamoDB Local e LocalStack
   - Debug integrado do VS Code

2. **Validação Pré-Commit:** Execute testes via Docker
   - Ambiente limpo e reproduzível
   - Simula exatamente o ambiente de CI/CD

3. **CI/CD:** Use os mesmos containers Docker
   - Garantia de consistência

## 🛠️ Comandos Úteis no Dev Container

### AWS CLI (LocalStack)
```bash
# Listar tabelas DynamoDB no LocalStack
aws dynamodb list-tables --endpoint-url http://localhost:4566

# Criar tabela
aws dynamodb create-table --endpoint-url http://localhost:4566 ...
```

### Python/Pytest
```bash
# Executar teste específico
pytest tests/test_service.py::TestCustomerService::test_create_customer -v

# Com debug
pytest tests/ -v --pdb

# Com coverage
pytest tests/ --cov=src --cov-report=html
```

### Docker (de dentro do Dev Container)
```bash
# Ver containers rodando
docker ps

# Logs do LocalStack
docker logs controle-vendas-localstack -f
```
LOG_LEVEL=DEBUG
PYTHONUNBUFFERED=1
AWS_ENDPOINT_URL=http://localhost:4566  # Para LocalStack
```

### AWS Credentials
As credenciais AWS do host (`~/.aws`) são montadas automaticamente no container.

## 🎯 Como Usar

### 1. Abrir no DevContainer
1. Abra o VS Code
2. Pressione `F1` e selecione: **Dev Containers: Reopen in Container**
3. Aguarde a construção do container

### 2. Rodar a API Localmente
```bash
# Com hot reload
uvicorn src.local_server:app --host 0.0.0.0 --port 8000 --reload

# Ou usando o docker-compose
docker-compose up api
```

### 3. Executar Testes
```bash
# Todos os testes
pytest

# Com cobertura
pytest --cov=src --cov-report=html

# Teste específico
pytest tests/test_service.py -v
```

### 4. Formatação e Linting
```bash
# Formatar código
black src/ tests/

# Organizar imports
isort src/ tests/

# Linting
flake8 src/ tests/

# Type checking
mypy src/
```

### 5. Terraform
```bash
cd infra
terraform init
terraform plan -var-file=environments/dev.tfvars
```

## 🧪 LocalStack (Opcional)

Para testar com AWS local:

```bash
# Instalar LocalStack
pip install localstack

# Rodar LocalStack
localstack start

# Usar o endpoint local
export AWS_ENDPOINT_URL=http://localhost:4566
```

## 📝 Notas

- O container roda como usuário `vscode` (não-root)
- Hot reload está habilitado para desenvolvimento
- Format on save está ativo
- Pytest está configurado como test runner padrão
