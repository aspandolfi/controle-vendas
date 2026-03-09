# Let's Encrypt Certificate Management

Este diretório contém scripts para gerenciar certificados SSL do Let's Encrypt para o CloudFront.

## Por que Let's Encrypt?

- **Gratuito**: Sem custos de certificado SSL
- **Automação**: Renovação automática via scripts
- **Confiável**: Amplamente usado e aceito por todos os navegadores

## Métodos de Configuração

### Método 1: Automação Completa com Route53 (Recomendado)

Usa plugin do certbot para validação DNS automática via Route53.

#### Requisitos:
```bash
# Instalar dependências
pip install certbot certbot-dns-route53 boto3

# Configurar AWS credentials
aws configure
```

#### Uso:
```bash
cd web/scripts

# Obter novo certificado
python3 letsencrypt-route53.py \
  --domain exemplo.com \
  --email admin@exemplo.com \
  --environment prod

# Renovar certificado existente
python3 letsencrypt-route53.py \
  --domain exemplo.com \
  --email admin@exemplo.com \
  --environment prod \
  --renew

# Testar com staging (não consome rate limits)
python3 letsencrypt-route53.py \
  --domain exemplo.com \
  --email admin@exemplo.com \
  --environment dev \
  --staging
```

#### Configuração no Terraform:
Após obter o certificado, configure no `environments/*.tfvars`:

```hcl
domain_name          = "exemplo.com"
certificate_arn      = "arn:aws:acm:us-east-1:123456789012:certificate/xxx"
use_acm_certificate  = false  # Usar certificado importado
```

### Método 2: Manual com DNS Challenge

Para ambientes onde não é possível instalar certbot ou preferência por processo manual.

#### Uso:
```bash
cd web/scripts

# Executar script (requer interação manual)
./letsencrypt-cert.sh exemplo.com admin@exemplo.com prod
```

O script irá:
1. Solicitar criação de records TXT no DNS
2. Aguardar confirmação após criar os records
3. Validar e obter o certificado
4. Importar para ACM automaticamente

### Método 3: Renovação Manual

```bash
cd web/scripts
./renew-letsencrypt.sh exemplo.com prod
```

## Renovação Automática

### Via GitHub Actions (Recomendado)

O workflow `.github/workflows/renew-certificate.yml` roda automaticamente:
- Dia 1 de cada mês
- Dia 15 de cada mês
- Renova apenas se faltar menos de 30 dias para expirar

#### Configurar Secrets no GitHub:
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
LETSENCRYPT_EMAIL
DEV_DOMAIN_NAME
STAGING_DOMAIN_NAME  
PROD_DOMAIN_NAME
```

#### Executar Manualmente:
1. Acesse Actions no GitHub
2. Selecione "Renew Let's Encrypt Certificate"
3. Clique em "Run workflow"
4. Escolha o ambiente

### Via Cron (Linux/macOS)

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa todo dia 1 às 3am)
0 3 1 * * cd /path/to/web/scripts && python3 letsencrypt-route53.py --domain exemplo.com --email admin@exemplo.com --environment prod --renew
```

### Via Task Scheduler (Windows)

1. Abra Task Scheduler
2. Create Task
3. Configure para rodar mensalmente
4. Action: `python letsencrypt-route53.py --domain exemplo.com --email admin@exemplo.com --environment prod --renew`

## Estrutura de Arquivos

```
web/scripts/
├── letsencrypt-route53.py      # Script Python automático (Route53)
├── letsencrypt-cert.sh         # Script Bash manual
├── renew-letsencrypt.sh        # Script de renovação
└── certificates/               # Certificados gerados
    ├── dev/
    │   ├── certificate-arn.txt # ARN do certificado no ACM
    │   ├── last-renewed.txt    # Timestamp da última renovação
    │   └── config/
    │       └── live/
    │           └── exemplo.com/
    │               ├── cert.pem      # Certificado
    │               ├── chain.pem     # Chain
    │               ├── fullchain.pem # Full chain
    │               └── privkey.pem   # Private key
    ├── staging/
    └── prod/
```

## Comparação: Let's Encrypt vs ACM

| Característica | Let's Encrypt | AWS ACM |
|----------------|---------------|---------|
| Custo | Gratuito | Gratuito |
| Renovação | Manual/Script (90 dias) | Automática |
| Validação | DNS/HTTP | DNS/Email |
| Wildcard | Sim | Sim |
| Configuração | Requer scripts | Terraform nativo |
| Portabilidade | Alta (multi-cloud) | AWS only |

## Fluxo de Trabalho Terraform

### Primeira Vez (com ACM - Padrão):
```hcl
# environments/prod.tfvars
domain_name = "exemplo.com"
# use_acm_certificate = true (padrão)
```

```bash
terraform apply
```

### Migrar para Let's Encrypt:
```bash
# 1. Obter certificado Let's Encrypt
cd web/scripts
python3 letsencrypt-route53.py --domain exemplo.com --email admin@exemplo.com --environment prod

# 2. Copiar ARN do output
# Certificate ARN: arn:aws:acm:us-east-1:xxx

# 3. Atualizar Terraform
# environments/prod.tfvars
domain_name          = "exemplo.com"
certificate_arn      = "arn:aws:acm:us-east-1:xxx"
use_acm_certificate  = false

# 4. Aplicar mudanças
cd ../../infra
terraform apply
```

## Troubleshooting

### Erro: "certbot not found"
```bash
pip install certbot certbot-dns-route53
```

### Erro: "Zone ID not found"
Certifique-se de que a Hosted Zone do Route53 existe para seu domínio.

### Erro: "Rate limit exceeded"
Let's Encrypt tem limites:
- 50 certificados por domínio por semana
- Use `--staging` para testes

### Certificado não está sendo aceito
Verifique se:
- Certificado foi importado na us-east-1
- ARN está correto no Terraform
- CloudFront foi atualizado (pode levar 15-20 min)

### Renovação falhou
```bash
# Ver logs
cat ./certificates/prod/logs/letsencrypt.log

# Forçar renovação
python3 letsencrypt-route53.py --domain exemplo.com --email admin@exemplo.com --environment prod --renew
```

## Monitoramento

### Verificar Expiração:
```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:xxx \
  --region us-east-1 \
  --query 'Certificate.NotAfter'
```

### Listar Certificados:
```bash
aws acm list-certificates --region us-east-1
```

## Segurança

- **Nunca commite**: `privkey.pem`, credenciais AWS
- **Adicione ao .gitignore**: `certificates/*/config/`
- **Rotacione secrets**: AWS keys regularmente
- **Use IAM roles**: Em produção, prefira IAM roles ao invés de access keys

## Suporte

Para mais informações:
- Let's Encrypt: https://letsencrypt.org/docs/
- Certbot: https://certbot.eff.org/
- AWS ACM: https://docs.aws.amazon.com/acm/
