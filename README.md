# Controle de Vendas

Sistema de controle de vendas com backend em Python (AWS Lambda) e frontend em Angular.

## 🚀 Quick Start com Docker

### Pré-requisitos
- Docker Desktop instalado
- Git

### Iniciar Ambiente Local

**Linux/macOS:**
```bash
git clone <repository-url>
cd controle-vendas
chmod +x docker-start.sh
./docker-start.sh dev --seed
```

**Windows:**
```cmd
git clone <repository-url>
cd controle-vendas
docker-start.bat dev --seed
```

### Acessar Aplicação
- **Web:** http://localhost:4200
- **API:** http://localhost:8000
- **Login:** admin / admin123

📖 **Documentação completa:** [DOCKER.md](DOCKER.md)

## 📁 Estrutura do Projeto

```
controle-vendas/
├── api/                    # Backend (Python + AWS Lambda)
│   ├── src/               # Código fonte
│   ├── tests/             # Testes unitários
│   ├── infra/             # Terraform (API Gateway, Lambda, DynamoDB)
│   ├── Dockerfile         # Container API
│   └── requirements.txt   # Dependências Python
│
├── web/                   # Frontend (Angular)
│   ├── src/              # Código fonte
│   ├── infra/            # Terraform (S3, CloudFront, Route53)
│   ├── Dockerfile        # Container produção (nginx)
│   ├── Dockerfile.dev    # Container desenvolvimento
│   └── package.json      # Dependências Node.js
│
├── docker-compose.yml     # Orquestração de containers
├── docker-start.sh        # Script de inicialização (Linux/macOS)
├── docker-start.bat       # Script de inicialização (Windows)
└── DOCKER.md             # Documentação Docker completa
```

## 🛠️ Tecnologias

### Backend
- **Python 3.11**
- **AWS Lambda** - Serverless compute
- **API Gateway** - API REST
- **DynamoDB** - Banco de dados NoSQL
- **AWS Lambda Powertools** - Observabilidade
- **Pydantic** - Validação de dados
- **pytest** - Testes unitários (100% coverage)

### Frontend
- **Angular 21** - Framework SPA
- **TypeScript 5.9**
- **Bootstrap 5** - UI Components
- **Chart.js** - Gráficos
- **RxJS** - Programação reativa
- **Vitest** - Testes unitários

### Infraestrutura
- **Terraform** - Infrastructure as Code
- **AWS S3** - Armazenamento estático
- **CloudFront** - CDN
- **Route53** - DNS
- **ACM** - Certificados SSL
- **GitHub Actions** - CI/CD

### Desenvolvimento Local
- **Docker & Docker Compose**
- **DynamoDB Local**
- **Uvicorn** - ASGI server
- **Nginx** - Web server

## 📋 Funcionalidades

- ✅ Gerenciamento de clientes
- ✅ Controle de vendas (dinheiro e crediário)
- ✅ Gestão de pagamentos
- ✅ Dashboard com métricas
- ✅ Autenticação de usuários
- ✅ Histórico de transações
- ✅ Relatórios e gráficos

## 🏗️ Desenvolvimento

### Executar Localmente (sem Docker)

#### Backend (API)
```bash
cd api

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Executar testes
pytest

# Iniciar DynamoDB Local (requer Docker)
docker run -p 8001:8000 amazon/dynamodb-local

# Criar tabela
aws dynamodb create-table --cli-input-json file://infra/table-schema.json --endpoint-url http://localhost:8001

# Executar API
uvicorn src.local_server:app --reload
```

#### Frontend (Web)
```bash
cd web

# Instalar dependências
npm install

# Executar em desenvolvimento
npm start

# Acessar http://localhost:4200
```

### Executar Testes

```bash
# Backend
cd api
pytest --cov=src --cov-report=html

# Frontend
cd web
npm test
```

### Build de Produção

```bash
# Backend (Lambda)
cd api/scripts
./build.sh  # ou build.bat no Windows

# Frontend
cd web
npm run build:prod
```

## 🚀 Deploy

### Pré-requisitos
- AWS CLI configurado
- Terraform >= 1.5.0
- Credenciais AWS

### Deploy Backend (API)

```bash
cd api

# Build Lambda
./scripts/build.sh

# Deploy com Terraform
cd infra
terraform init -backend-config=backends/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### Deploy Frontend (Web)

```bash
cd web

# Build produção
npm run build:prod

# Deploy com Terraform
cd infra
terraform init -backend-config=backends/dev.tfvars
terraform apply -var-file=environments/dev.tfvars

# Sync arquivos para S3
aws s3 sync ../dist/controle-vendas/browser/ s3://bucket-name/

# Invalidar cache CloudFront
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### Deploy via GitHub Actions

O projeto possui workflows automatizados:

```yaml
# .github/workflows/build-test-scan-deploy.yml
# - Build e teste automático
# - Deploy condicional por ambiente
# - Invalidação de cache CloudFront
```

**Configurar Secrets no GitHub:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (opcional, padrão: sa-east-1)

**Deploy:**
```bash
# Push para branch correspondente
git push origin main          # Deploy prod
git push origin staging       # Deploy staging
git push origin develop       # Deploy dev
```

## 🔧 Configuração

### Variáveis de Ambiente

#### API
```env
AWS_REGION=sa-east-1
DYNAMODB_ENDPOINT=http://localhost:8001  # Apenas local
TABLE_NAME=controle-vendas-dev
POWERTOOLS_SERVICE_NAME=controle-vendas-api
LOG_LEVEL=INFO
```

#### Web
```env
API_URL=http://localhost:8000
NODE_ENV=development
```

### Terraform

#### Backend
```hcl
# api/infra/environments/dev.tfvars
environment  = "dev"
aws_region   = "sa-east-1"
table_name   = "controle-vendas-dev"
lambda_memory = 256
```

#### Frontend
```hcl
# web/infra/environments/dev.tfvars
environment             = "dev"
aws_region              = "sa-east-1"
cloudfront_price_class  = "PriceClass_100"
domain_name             = "exemplo.com"  # opcional
```

## 📊 Monitoramento

### CloudWatch Logs
```bash
# API Logs
aws logs tail /aws/lambda/controle-vendas-api-dev --follow

# Lambda Insights
aws cloudwatch get-metric-statistics ...
```

### DynamoDB Metrics
- Read/Write capacity usage
- Throttled requests
- Table size

### CloudFront Metrics
- Requests
- Bytes downloaded
- Error rates

## 🔒 Segurança

- ✅ HTTPS obrigatório (CloudFront + ACM)
- ✅ Autenticação JWT (em desenvolvimento)
- ✅ Validação de entrada com Pydantic
- ✅ WAF recomendado para produção
- ✅ Secrets via AWS Secrets Manager
- ✅ IAM roles com least privilege
- ✅ Encryption at rest (DynamoDB)

## 📚 Documentação Adicional

- [DOCKER.md](DOCKER.md) - Guia completo Docker
- [api/README.md](api/README.md) - Documentação da API
- [web/README.md](web/README.md) - Documentação do Frontend
- [web/scripts/README-letsencrypt.md](web/scripts/README-letsencrypt.md) - Certificados Let's Encrypt

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padrões de Código

```bash
# Python (Backend)
black src/
pylint src/
mypy src/

# TypeScript (Frontend)
npm run lint
npm run format
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- Andre - Desenvolvimento inicial

## 🐛 Problemas Conhecidos

Consulte as [Issues](https://github.com/user/repo/issues) para ver problemas conhecidos e roadmap.

## 📞 Suporte

Para suporte, abra uma issue ou entre em contato através do email.
