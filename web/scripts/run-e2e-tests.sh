#!/bin/bash

# Script para executar testes E2E do projeto web usando Docker
# Uso: ./scripts/run-e2e-tests.sh [options]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}=== Controle de Vendas - E2E Tests ===${NC}"
echo ""

# Função para limpar recursos
cleanup() {
    echo -e "${YELLOW}Limpando recursos...${NC}"
    cd "$PROJECT_ROOT/.."
    docker-compose --profile e2e-test down
}

# Registrar cleanup ao sair
trap cleanup EXIT

# Navegar para raiz do projeto
cd "$PROJECT_ROOT/.."

# Verificar se já existe ambiente rodando
echo -e "${BLUE}Verificando ambiente...${NC}"
if docker ps | grep -q "controle-vendas-web-dev"; then
    echo -e "${GREEN}Ambiente de desenvolvimento já está rodando.${NC}"
else
    echo -e "${YELLOW}Iniciando ambiente de desenvolvimento...${NC}"
    docker-compose --profile dev up -d web-dev api dynamodb-local
    
    # Aguardar serviços estarem prontos
    echo -e "${YELLOW}Aguardando serviços ficarem prontos...${NC}"
    sleep 10
    
    # Verificar se web-dev está acessível
    MAX_RETRIES=30
    RETRY_COUNT=0
    while ! curl -s http://localhost:4200 > /dev/null; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
            echo -e "${RED}Timeout aguardando web-dev ficar pronto${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Aguardando web-dev... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
        sleep 2
    done
    
    echo -e "${GREEN}Web dev está pronto!${NC}"
fi

# Executar testes E2E
echo -e "${BLUE}Executando testes E2E...${NC}"
docker-compose --profile e2e-test run --rm web-e2e-test

# Verificar resultado
if [ $? -eq 0 ]; then
    echo -e "${GREEN}=== Testes E2E concluídos com sucesso! ===${NC}"
else
    echo -e "${RED}=== Testes E2E falharam! ===${NC}"
    exit 1
fi

# Copiar screenshots e vídeos se existirem
if [ -d "$PROJECT_ROOT/cypress/screenshots" ] && [ "$(ls -A $PROJECT_ROOT/cypress/screenshots)" ]; then
    echo -e "${YELLOW}Screenshots salvos em: $PROJECT_ROOT/cypress/screenshots${NC}"
fi

if [ -d "$PROJECT_ROOT/cypress/videos" ] && [ "$(ls -A $PROJECT_ROOT/cypress/videos)" ]; then
    echo -e "${YELLOW}Vídeos salvos em: $PROJECT_ROOT/cypress/videos${NC}"
fi

echo -e "${GREEN}Concluído!${NC}"
