# Terraform Infrastructure

Infrastructure as Code para a API do sistema de controle de vendas usando AWS Lambda, API Gateway e DynamoDB.

## 📁 Estrutura

```
infra/
├── backends/                    # Backend configs por ambiente
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
├── environments/                # Variáveis por ambiente
│   ├── dev.tfvars
│   ├── staging.tfvars
│   ├── prod.tfvars
│   └── README.md
├── main.tf                      # Provider e backend configuration
├── variables.tf                 # Variáveis de entrada
├── outputs.tf                   # Outputs da infraestrutura
├── dynamodb.tf                  # Tabela DynamoDB (Single Table Design)
├── iam.tf                       # Roles e policies IAM
├── lambda.tf                    # Lambda function
├── api_gateway.tf               # API Gateway HTTP API
├── terraform.tfvars.example     # Exemplo de variáveis (deprecated)
├── backend-dev.tfvars.example   # Exemplo de backend (deprecated)
└── .gitignore
```

## 🏗️ Recursos Criados

### DynamoDB
- Tabela única com Single Table Design
- 2 GSIs (Global Secondary Indexes) para consultas otimizadas
- Point-in-time recovery (prod apenas)
- Encryption at rest habilitada
- TTL configurado

### Lambda
- Python 3.11 runtime
- 512MB de memória (configurável)
- 30s de timeout (configurável)
- X-Ray tracing habilitado
- CloudWatch Logs com retenção configurável
- Variáveis de ambiente para DynamoDB e Powertools

### API Gateway
- HTTP API (mais barato e moderno que REST API)
- CORS configurado
- Throttling habilitado (1000 burst, 500 rate)
- Access logs no CloudWatch
- Stage por ambiente (dev, staging, prod)

### IAM
- Role de execução Lambda com least privilege
- Políticas separadas para:
  - CloudWatch Logs
  - DynamoDB (read/write)
  - X-Ray tracing

## 🚀 Setup

### 1. Pré-requisitos

```bash
# Instalar Terraform
# https://developer.hashicorp.com/terraform/install

# Verificar instalação
terraform version

# Configurar AWS credentials
aws configure
```

### 2. Preparar Backend (S3 + DynamoDB)

```bash
# Criar bucket S3 para state (execute uma vez)
aws s3 mb s3://your-terraform-state-bucket --region sa-east-1
aws s3api put-bucket-versioning --bucket your-terraform-state-bucket --versioning-configuration Status=Enabled

# Criar tabela DynamoDB para lock (execute uma vez)
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region sa-east-1
```

### 3. Configurar Ambientes

Os arquivos de configuração já estão prontos em `environments/` e `backends/`.
Edite conforme necessário:

```bash
cd api/infra

# Editar configuração do ambiente desejado
nano environments/dev.tfvars
nano backends/dev.tfvars

# Ou copie de um template
cp environments/dev.tfvars environments/myenv.tfvars
```

### 4. Criar Deployment Package

```bash
cd ..  # volta para api/
./build.sh  # ou scripts/build.sh
# Isso criará o deployment.zip
```

### 5. Deploy

**Opção 1: Usando Helper Script (Recomendado)**

```bash
cd api/scripts

# Linux/Mac
./terraform.sh dev init     # Inicializar
./terraform.sh dev plan     # Ver plano
./terraform.sh dev apply    # Aplicar

# Windows
terraform.bat dev init
terraform.bat dev plan
terraform.bat dev apply
```

**Opção 2: Comandos Manuais**

```bash
cd api/infra

# Inicializar Terraform para dev
terraform init -backend-config=backends/dev.tfvars

# Verificar plano
terraform plan -var-file=environments/dev.tfvars

# Aplicar mudanças
terraform apply -var-file=environments/dev.tfvars

# Ver outputs
terraform output
```

## 📝 Comandos Úteis

```bash
# Validar configuração
terraform validate

# Formatar arquivos
terraform fmt -recursive

# Ver state
terraform show

# Destruir recursos (CUIDADO!)
terraform destroy

# Ver apenas outputs
terraform output

# Atualizar apenas um recurso específico
terraform apply -target=aws_lambda_function.api
```

## 🔧 Variáveis Principais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `environment` | Ambiente (dev/staging/prod) | - |
| `aws_region` | Região AWS | sa-east-1 |
| `lambda_memory_size` | Memória Lambda (MB) | 512 |
| `lambda_timeout` | Timeout Lambda (s) | 30 |
| `dynamodb_billing_mode` | Modo de billing DynamoDB | PAY_PER_REQUEST |
| `log_retention_days` | Retenção de logs | 7 |
| `enable_xray_tracing` | Habilitar X-Ray | true |

## 📤 Outputs

Após o deploy, Terraform retorna:

- `api_gateway_url` - URL da API
- `lambda_function_name` - Nome da função Lambda
- `dynamodb_table_name` - Nome da tabela DynamoDB

Exemplo:
```bash
terraform output api_gateway_url
# https://abc123.execute-api.sa-east-1.amazonaws.com/dev
```

## 🌍 Múltiplos Ambientes

Este projeto usa **arquivos de variáveis separados** para gerenciar múltiplos ambientes.

### Estrutura por Ambiente

```
infra/
├── backends/           # State storage configs
│   ├── dev.tfvars     # Dev backend
│   ├── staging.tfvars # Staging backend
│   └── prod.tfvars    # Prod backend
└── environments/       # Environment variables
    ├── dev.tfvars     # Dev settings
    ├── staging.tfvars # Staging settings
    └── prod.tfvars    # Prod settings
```

### Deploy por Ambiente

```bash
# Development
./terraform.sh dev apply

# Staging
./terraform.sh staging apply

# Production
./terraform.sh prod apply
```

### Diferenças entre Ambientes

| Configuração | Dev | Staging | Prod |
|--------------|-----|---------|------|
| Lambda RAM | 512MB | 1024MB | 2048MB |
| Log Retention | 7 dias | 14 dias | 30 dias |
| PITR (Backup) | ❌ | ❌ | ✅ |
| CORS Origins | localhost | staging domain | prod domain |

Veja `environments/README.md` para mais detalhes.

## 🔒 Segurança

- ✅ Encryption at rest (DynamoDB)
- ✅ Encryption in transit (HTTPS)
- ✅ IAM least privilege
- ✅ X-Ray tracing
- ✅ CloudWatch logging
- ⚠️ Secrets devem usar AWS Secrets Manager (não incluído)
- ⚠️ API Gateway sem autenticação (adicionar Cognito/Lambda authorizer)

## 💰 Custos Estimados (AWS sa-east-1)

**Dev/Staging (baixo uso):**
- DynamoDB (PAY_PER_REQUEST): ~$1-5/mês
- Lambda: Free tier cobre ~1M requests
- API Gateway: $1/milhão de requests
- CloudWatch Logs: ~$0.50/GB
- **Total: ~$5-10/mês**

**Prod (médio uso - 10M requests/mês):**
- DynamoDB: ~$10-30/mês
- Lambda: ~$20/mês
- API Gateway: ~$10/mês
- CloudWatch Logs: ~$5/mês
- **Total: ~$50-70/mês**

## 🚨 Troubleshooting

### Erro: "Error creating Lambda function"
- Verifique se `deployment.zip` existe
- Execute `./build.sh` para criar o package

### Erro: "Backend initialization required"
```bash
terraform init -reconfigure -backend-config=backend-dev.tfvars
```

### Lambda não responde
```bash
# Ver logs
aws logs tail /aws/lambda/controle-vendas-dev-api --follow
```

## 📚 Documentação

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [API Gateway](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
