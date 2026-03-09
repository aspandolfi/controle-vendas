#!/bin/bash
# Script para obter e importar certificado Let's Encrypt para ACM
# Requisitos: certbot, aws-cli configurado

set -e

# Configurações
DOMAIN="${1:-example.com}"
EMAIL="${2:-admin@example.com}"
ENVIRONMENT="${3:-dev}"
REGION="us-east-1"  # CloudFront requer certificados na us-east-1

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Let's Encrypt Certificate Manager ===${NC}"
echo "Domain: $DOMAIN"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Verifica se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo -e "${RED}Error: certbot não está instalado${NC}"
    echo "Instale com: sudo apt-get install certbot (Linux) ou brew install certbot (macOS)"
    exit 1
fi

# Verifica se aws-cli está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: aws-cli não está instalado${NC}"
    exit 1
fi

# Cria diretório para certificados
CERT_DIR="./certificates/$ENVIRONMENT"
mkdir -p "$CERT_DIR"

echo -e "${YELLOW}Step 1: Obtendo certificado do Let's Encrypt...${NC}"
echo "Será necessário validar o domínio via DNS (TXT record)"
echo ""

# Obtém certificado usando DNS challenge (manual)
# Para produção, use plugin DNS do seu provedor (Route53, Cloudflare, etc.)
certbot certonly \
  --manual \
  --preferred-challenges dns \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --domain "$DOMAIN" \
  --domain "www.$DOMAIN" \
  --config-dir "$CERT_DIR/config" \
  --work-dir "$CERT_DIR/work" \
  --logs-dir "$CERT_DIR/logs"

CERT_PATH="$CERT_DIR/config/live/$DOMAIN"

if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
    echo -e "${RED}Error: Certificado não foi gerado${NC}"
    exit 1
fi

echo -e "${GREEN}Certificado obtido com sucesso!${NC}"
echo ""

echo -e "${YELLOW}Step 2: Importando certificado para ACM...${NC}"

# Importa certificado para ACM
CERT_ARN=$(aws acm import-certificate \
  --certificate fileb://"$CERT_PATH/cert.pem" \
  --private-key fileb://"$CERT_PATH/privkey.pem" \
  --certificate-chain fileb://"$CERT_PATH/chain.pem" \
  --region "$REGION" \
  --tags "Key=Environment,Value=$ENVIRONMENT" "Key=Domain,Value=$DOMAIN" "Key=ManagedBy,Value=LetsEncrypt" \
  --query 'CertificateArn' \
  --output text)

if [ -z "$CERT_ARN" ]; then
    echo -e "${RED}Error: Falha ao importar certificado${NC}"
    exit 1
fi

echo -e "${GREEN}Certificado importado com sucesso!${NC}"
echo "Certificate ARN: $CERT_ARN"
echo ""

# Salva ARN para uso futuro
echo "$CERT_ARN" > "$CERT_DIR/certificate-arn.txt"
echo "$(date +%s)" > "$CERT_DIR/last-renewed.txt"

echo -e "${YELLOW}Step 3: Configuração do Terraform${NC}"
echo "Adicione ao seu arquivo .tfvars:"
echo ""
echo "certificate_arn = \"$CERT_ARN\""
echo ""

echo -e "${GREEN}=== Concluído! ===${NC}"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "- Certificados Let's Encrypt expiram em 90 dias"
echo "- Configure renovação automática com o script renew-letsencrypt.sh"
echo "- Execute o script de renovação a cada 60 dias"
echo ""
