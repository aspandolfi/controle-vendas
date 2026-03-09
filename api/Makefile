# Makefile para facilitar comandos do projeto

.PHONY: help install test test-unit test-integration test-all lint format clean

# Variáveis
PYTHON := python3
VENV := venv
PYTEST := pytest
PIP := pip

help:  ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Instala dependências de desenvolvimento
	$(PYTHON) -m venv $(VENV)
	. $(VENV)/bin/activate && $(PIP) install -r requirements.txt -r requirements-dev.txt

install-prod:  ## Instala apenas dependências de produção
	$(PYTHON) -m venv $(VENV)
	. $(VENV)/bin/activate && $(PIP) install -r requirements.txt

test-unit:  ## Executa apenas testes unitários
	. $(VENV)/bin/activate && $(PYTEST) tests/ -v --ignore=tests/integration/

test-integration-docker:  ## Executa testes de integração via Docker
	./scripts/run-integration-tests-docker.sh

test:  ## Alias para test-unit
	$(MAKE) test-unit

coverage:  ## Gera relatório de cobertura de testes
	. $(VENV)/bin/activate && $(PYTEST) tests/ --ignore=tests/integration/ --cov=src --cov-report=html --cov-report=term
	@echo "Relatório HTML gerado em htmlcov/index.html"

coverage-integration:  ## Gera relatório de cobertura dos testes de integração
	. $(VENV)/bin/activate && \
	export LOCALSTACK_ENDPOINT=http://localhost:4566 && \
	export AWS_ACCESS_KEY_ID=test && \
	export AWS_SECRET_ACCESS_KEY=test && \
	$(PYTEST) tests/integration/ --cov=src --cov-report=html --cov-report=term

lint:  ## Verifica código com linters (futuro: adicionar pylint, flake8, etc)
	@echo "Linting não configurado ainda"

format:  ## Formata código com black (futuro)
	@echo "Formatação não configurada ainda"

clean:  ## Remove arquivos temporários e cache
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .coverage -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

localstack-start:  ## Inicia LocalStack
	cd .. && docker-compose --profile integration-test up -d localstack
	@echo "Aguardando LocalStack ficar pronto..."
	@sleep 5
	@curl -s http://localhost:4566/_localstack/health | python3 -m json.tool

localstack-stop:  ## Para LocalStack
	cd .. && docker-compose --profile integration-test down

localstack-logs:  ## Mostra logs do LocalStack
	cd .. && docker-compose logs -f localstack

localstack-health:  ## Verifica saúde do LocalStack
	@curl -s http://localhost:4566/_localstack/health | python3 -m json.tool

docker-build:  ## Constrói imagem Docker da API
	docker build -t controle-vendas-api .

docker-run:  ## Executa container Docker da API
	cd .. && docker-compose up -d api

docker-stop:  ## Para container Docker da API
	cd .. && docker-compose down

docker-logs:  ## Mostra logs do container da API
	cd .. && docker-compose logs -f api

dev-server:  ## Inicia servidor de desenvolvimento local
	. $(VENV)/bin/activate && \
	export DYNAMODB_ENDPOINT=http://localhost:8001 && \
	export AWS_ACCESS_KEY_ID=local && \
	export AWS_SECRET_ACCESS_KEY=local && \
	export TABLE_NAME=controle-vendas-dev && \
	$(PYTHON) -m uvicorn src.local_server:app --reload --host 0.0.0.0 --port 8000

.DEFAULT_GOAL := help
