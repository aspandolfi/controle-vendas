#!/bin/bash

# Script para executar testes de integração via Docker
set -e

echo "=========================================================="
echo "Testes de Integração via Docker - Controle de Vendas"
echo "=========================================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}1. Construindo imagem de testes...${NC}"
docker-compose build api-integration-test

echo ""
echo -e "${YELLOW}2. Iniciando LocalStack...${NC}"
docker-compose --profile integration-test up -d localstack

# Aguardar LocalStack estar pronto
echo ""
echo -e "${YELLOW}3. Aguardando LocalStack ficar pronto...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

until docker exec controle-vendas-localstack curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo -e "${RED}❌ LocalStack não iniciou no tempo esperado${NC}"
        docker-compose --profile integration-test logs localstack
        exit 1
    fi
    echo "Tentativa $RETRY_COUNT/$MAX_RETRIES - Aguardando LocalStack..."
    sleep 2
done

echo -e "${GREEN}✓ LocalStack está pronto!${NC}"

# Verificar serviços
echo ""
echo -e "${YELLOW}4. Verificando serviços disponíveis...${NC}"
docker exec controle-vendas-localstack curl -s http://localhost:4566/_localstack/health | python3 -m json.tool || true

echo ""
echo -e "${YELLOW}5. Executando testes de integração...${NC}"
echo ""

# Executar testes
docker-compose --profile integration-test run --rm api-integration-test

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}=========================================================="
    echo -e "✓ Todos os testes de integração passaram!"
    echo -e "==========================================================${NC}"
else
    echo -e "${RED}=========================================================="
    echo -e "❌ Alguns testes falharam"
    echo -e "==========================================================${NC}"
fi

# Parar serviços
echo ""
read -p "Deseja parar o LocalStack? (s/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Parando LocalStack...${NC}"
    docker-compose --profile integration-test down
    echo -e "${GREEN}✓ LocalStack parado${NC}"
else
    echo -e "${YELLOW}LocalStack continua rodando. Para parar:${NC}"
    echo "docker-compose --profile integration-test down"
fi

exit $TEST_EXIT_CODE
