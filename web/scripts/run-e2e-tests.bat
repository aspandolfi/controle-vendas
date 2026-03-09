@echo off
REM Script para executar testes E2E do projeto web usando Docker (Windows)
REM Uso: scripts\run-e2e-tests.bat

echo ========================================
echo Controle de Vendas - E2E Tests
echo ========================================
echo.

cd ..

REM Verificar se ambiente está rodando
docker ps | findstr "controle-vendas-web-dev" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Ambiente de desenvolvimento ja esta rodando.
) else (
    echo [INFO] Iniciando ambiente de desenvolvimento...
    docker-compose --profile dev up -d web-dev api dynamodb-local
    
    echo [INFO] Aguardando servicos ficarem prontos...
    timeout /t 15 /nobreak >nul
    
    echo [INFO] Verificando se web-dev esta acessivel...
    set MAX_RETRIES=30
    set RETRY_COUNT=0
    
    :WAIT_LOOP
    curl -s http://localhost:4200 >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Web dev esta pronto!
        goto RUN_TESTS
    )
    
    set /a RETRY_COUNT=%RETRY_COUNT%+1
    if %RETRY_COUNT% GEQ %MAX_RETRIES% (
        echo [ERROR] Timeout aguardando web-dev ficar pronto
        docker-compose --profile dev down
        exit /b 1
    )
    
    echo [INFO] Aguardando web-dev... (%RETRY_COUNT%/%MAX_RETRIES%)
    timeout /t 2 /nobreak >nul
    goto WAIT_LOOP
)

:RUN_TESTS
echo.
echo [INFO] Executando testes E2E...
docker-compose --profile e2e-test run --rm web-e2e-test

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Testes E2E concluidos com sucesso!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERRO: Testes E2E falharam!
    echo ========================================
    exit /b 1
)

REM Verificar se há screenshots
if exist web\cypress\screenshots\ (
    dir /b web\cypress\screenshots\ | findstr "^" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Screenshots salvos em: web\cypress\screenshots\
    )
)

REM Verificar se há vídeos
if exist web\cypress\videos\ (
    dir /b web\cypress\videos\ | findstr "^" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Videos salvos em: web\cypress\videos\
    )
)

echo.
echo [SUCCESS] Concluido!
exit /b 0
