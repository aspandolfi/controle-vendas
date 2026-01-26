#!/bin/bash
# Script para renovar certificado Let's Encrypt e atualizar ACM
# Deve ser executado a cada 60 dias (antes dos 90 dias de expiração)

set -e

DOMAIN="${1:-example.com}"
ENVIRONMENT="${2:-dev}"
REGION="us-east-1"
CERT_DIR="./certificates/$ENVIRONMENT"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Let's Encrypt Certificate Renewal ===${NC}"

# Verifica se existe certificado anterior
if [ ! -f "$CERT_DIR/certificate-arn.txt" ]; then
    echo -e "${RED}Error: Nenhum certificado anterior encontrado${NC}"
    echo "Execute primeiro: ./letsencrypt-cert.sh"
    exit 1
fi

CERT_ARN=$(cat "$CERT_DIR/certificate-arn.txt")
echo "Certificate ARN: $CERT_ARN"
echo ""

# Verifica expiração do certificado
CERT_INFO=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$REGION")
EXPIRY=$(echo "$CERT_INFO" | grep -o '"NotAfter": "[^"]*"' | cut -d'"' -f4)

echo "Certificado atual expira em: $EXPIRY"
echo ""

echo -e "${YELLOW}Renovando certificado...${NC}"

# Renova certificado
certbot renew \
  --manual \
  --preferred-challenges dns \
  --config-dir "$CERT_DIR/config" \
  --work-dir "$CERT_DIR/work" \
  --logs-dir "$CERT_DIR/logs" \
  --force-renewal

CERT_PATH="$CERT_DIR/config/live/$DOMAIN"

echo -e "${YELLOW}Atualizando certificado no ACM...${NC}"

# Reimporta certificado (atualiza o existente)
aws acm import-certificate \
  --certificate-arn "$CERT_ARN" \
  --certificate fileb://"$CERT_PATH/cert.pem" \
  --private-key fileb://"$CERT_PATH/privkey.pem" \
  --certificate-chain fileb://"$CERT_PATH/chain.pem" \
  --region "$REGION"

echo "$(date +%s)" > "$CERT_DIR/last-renewed.txt"

echo -e "${GREEN}Certificado renovado com sucesso!${NC}"
echo ""
echo "CloudFront será atualizado automaticamente com o novo certificado"
echo ""
