# Makefile para Controle de Vendas
# Simplifica comandos Docker e execução de testes

.PHONY: help up down logs test-api test-web test-e2e test-all clean build restart

# Cores para output
YELLOW := \033[1;33m
GREEN := \033[0;32m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

help: ## Exibe esta mensagem de ajuda
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║          Controle de Vendas - Comandos Make               ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ========== Ambiente de Desenvolvimento ==========

up: ## Inicia ambiente de desenvolvimento (web-dev + api + db)
	@echo "$(YELLOW)Iniciando ambiente de desenvolvimento...$(NC)"
	docker-compose --profile dev up -d
	@echo "$(GREEN)Ambiente iniciado!$(NC)"
	@echo "$(BLUE)Web: http://localhost:4200$(NC)"
	@echo "$(BLUE)API: http://localhost:8000$(NC)"

down: ## Para todos os containers
	@echo "$(YELLOW)Parando containers...$(NC)"
	docker-compose --profile dev --profile e2e-test --profile test down
	@echo "$(GREEN)Containers parados!$(NC)"

logs: ## Exibe logs de todos os serviços
	docker-compose logs -f

logs-web: ## Exibe logs do web frontend
	docker-compose logs -f web-dev

logs-api: ## Exibe logs da API
	docker-compose logs -f api

restart: down up ## Reinicia o ambiente de desenvolvimento

# ========== Build ==========

build: ## Faz build de todos os serviços
	@echo "$(YELLOW)Building all services...$(NC)"
	docker-compose build
	@echo "$(GREEN)Build concluído!$(NC)"

build-web: ## Faz build apenas do web frontend
	@echo "$(YELLOW)Building web frontend...$(NC)"
	docker-compose build web-dev
	@echo "$(GREEN)Build do web concluído!$(NC)"

build-api: ## Faz build apenas da API
	@echo "$(YELLOW)Building API...$(NC)"
	docker-compose build api
	@echo "$(GREEN)Build da API concluído!$(NC)"

build-e2e: ## Faz build do container de testes E2E
	@echo "$(YELLOW)Building E2E test container...$(NC)"
	docker-compose build web-e2e-test
	@echo "$(GREEN)Build do E2E concluído!$(NC)"

# ========== Testes ==========

test-api: ## Executa testes unitários da API
	@echo "$(YELLOW)Executando testes da API...$(NC)"
	docker-compose --profile test run --rm api-test
	@echo "$(GREEN)Testes da API concluídos!$(NC)"

test-api-integration: ## Executa testes de integração da API
	@echo "$(YELLOW)Executando testes de integração da API...$(NC)"
	docker-compose --profile integration-test up -d localstack
	@sleep 5
	docker-compose --profile integration-test run --rm api-integration-test
	@echo "$(GREEN)Testes de integração da API concluídos!$(NC)"

test-web: ## Executa testes unitários do web frontend (localmente)
	@echo "$(YELLOW)Executando testes do web frontend...$(NC)"
	cd web && npm test
	@echo "$(GREEN)Testes do web concluídos!$(NC)"

test-e2e: ## Executa testes E2E do web frontend via Docker
	@echo "$(YELLOW)Preparando ambiente para testes E2E...$(NC)"
	@docker-compose --profile dev up -d web-dev api dynamodb-local
	@echo "$(YELLOW)Aguardando serviços ficarem prontos...$(NC)"
	@sleep 15
	@echo "$(YELLOW)Executando testes E2E...$(NC)"
	docker-compose --profile dev --profile e2e-test run --rm web-e2e-test
	@echo "$(GREEN)Testes E2E concluídos!$(NC)"

test-e2e-local: ## Executa testes E2E localmente (requer npm start rodando)
	@echo "$(YELLOW)Executando testes E2E localmente...$(NC)"
	cd web && npm run e2e:headless
	@echo "$(GREEN)Testes E2E locais concluídos!$(NC)"

test-all: test-api test-web test-e2e ## Executa todos os testes (API + Web + E2E)
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║           Todos os testes foram executados!                ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"

# ========== Database ==========

db-admin: ## Inicia DynamoDB Admin UI
	@echo "$(YELLOW)Iniciando DynamoDB Admin...$(NC)"
	docker-compose --profile admin up -d dynamodb-admin
	@echo "$(GREEN)DynamoDB Admin disponível em: http://localhost:8002$(NC)"

db-shell: ## Acessa shell do DynamoDB Local
	docker exec -it controle-vendas-dynamodb sh

# ========== Limpeza ==========

clean: ## Remove todos os containers, volumes e images
	@echo "$(RED)ATENÇÃO: Isso removerá todos os containers, volumes e images!$(NC)"
	@read -p "Continuar? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker system prune -f; \
		echo "$(GREEN)Limpeza concluída!$(NC)"; \
	else \
		echo "$(YELLOW)Operação cancelada.$(NC)"; \
	fi

clean-screenshots: ## Remove screenshots dos testes E2E
	@echo "$(YELLOW)Removendo screenshots...$(NC)"
	rm -rf web/cypress/screenshots/*
	@echo "$(GREEN)Screenshots removidos!$(NC)"

clean-videos: ## Remove vídeos dos testes E2E
	@echo "$(YELLOW)Removendo vídeos...$(NC)"
	rm -rf web/cypress/videos/*
	@echo "$(GREEN)Vídeos removidos!$(NC)"

# ========== Produção ==========

prod: ## Inicia ambiente de produção
	@echo "$(YELLOW)Iniciando ambiente de produção...$(NC)"
	docker-compose --profile prod up -d
	@echo "$(GREEN)Ambiente de produção iniciado!$(NC)"
	@echo "$(BLUE)Web: http://localhost:8080$(NC)"
	@echo "$(BLUE)API: http://localhost:8000$(NC)"

# ========== Informações ==========

status: ## Mostra status dos containers
	@echo "$(BLUE)Status dos containers:$(NC)"
	@docker-compose ps

ps: status ## Alias para 'status'

.DEFAULT_GOAL := help
