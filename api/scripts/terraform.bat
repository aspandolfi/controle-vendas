@echo off
REM Terraform deployment script for Windows with environment selection

SETLOCAL EnableDelayedExpansion

REM Check arguments
if "%~1"=="" (
    echo Usage: terraform.bat ^<environment^> [action]
    echo.
    echo Environments: dev, staging, prod
    echo Actions: init, plan, apply, destroy, output, validate, fmt
    echo.
    echo Examples:
    echo     terraform.bat dev plan
    echo     terraform.bat prod apply
    echo     terraform.bat staging destroy
    exit /b 1
)

SET ENVIRONMENT=%~1
SET ACTION=%~2
if "%ACTION%"=="" SET ACTION=plan

REM Validate environment
if not "%ENVIRONMENT%"=="dev" if not "%ENVIRONMENT%"=="staging" if not "%ENVIRONMENT%"=="prod" (
    echo Error: Invalid environment: %ENVIRONMENT%. Must be dev, staging, or prod
    exit /b 1
)

REM Change to infra directory
cd /d "%~dp0..\infra"

echo.
echo ==================================
echo Terraform - %ENVIRONMENT% environment
echo ==================================
echo.

REM Check if environment config exists
if not exist "environments\%ENVIRONMENT%.tfvars" (
    echo Error: Environment config not found: environments\%ENVIRONMENT%.tfvars
    exit /b 1
)

REM Check if backend config exists
if not exist "backends\%ENVIRONMENT%.tfvars" (
    echo Error: Backend config not found: backends\%ENVIRONMENT%.tfvars
    exit /b 1
)

REM Handle actions
if "%ACTION%"=="init" goto :action_init
if "%ACTION%"=="validate" goto :action_validate
if "%ACTION%"=="fmt" goto :action_fmt
if "%ACTION%"=="plan" goto :action_plan
if "%ACTION%"=="apply" goto :action_apply
if "%ACTION%"=="destroy" goto :action_destroy
if "%ACTION%"=="output" goto :action_output
if "%ACTION%"=="refresh" goto :action_refresh
if "%ACTION%"=="state" goto :action_state
goto :action_unknown

:action_init
echo Initializing Terraform for %ENVIRONMENT%...
terraform init -backend-config="backends\%ENVIRONMENT%.tfvars" -reconfigure
echo Terraform initialized!
goto :done

:action_validate
echo Validating Terraform configuration...
terraform validate
echo Configuration is valid!
goto :done

:action_fmt
echo Formatting Terraform files...
terraform fmt -recursive
echo Files formatted!
goto :done

:action_plan
echo Creating execution plan for %ENVIRONMENT%...

REM Check if deployment.zip exists
if not exist "..\deployment.zip" (
    echo WARNING: deployment.zip not found. Building Lambda package...
    cd ..
    call scripts\build.bat
    cd infra
)

terraform plan -var-file="environments\%ENVIRONMENT%.tfvars" -out="%ENVIRONMENT%.tfplan"
echo Plan created: %ENVIRONMENT%.tfplan
echo Review the plan above. To apply, run: terraform.bat %ENVIRONMENT% apply
goto :done

:action_apply
REM Check if plan exists
if exist "%ENVIRONMENT%.tfplan" (
    echo Applying saved plan for %ENVIRONMENT%...
    terraform apply "%ENVIRONMENT%.tfplan"
    del "%ENVIRONMENT%.tfplan"
) else (
    echo WARNING: No saved plan found. Creating and applying...
    
    REM Check if deployment.zip exists
    if not exist "..\deployment.zip" (
        echo WARNING: deployment.zip not found. Building Lambda package...
        cd ..
        call scripts\build.bat
        cd infra
    )
    
    terraform apply -var-file="environments\%ENVIRONMENT%.tfvars" -auto-approve
)

echo Infrastructure deployed successfully!
echo.
echo Outputs:
terraform output
goto :done

:action_destroy
echo.
echo WARNING: DESTRUCTIVE ACTION
echo You are about to destroy all resources in %ENVIRONMENT% environment!
echo.
set /p confirm="Type the environment name '%ENVIRONMENT%' to confirm: "

if not "!confirm!"=="%ENVIRONMENT%" (
    echo Confirmation failed. Destroy cancelled.
    exit /b 1
)

echo Destroying infrastructure in %ENVIRONMENT%...
terraform destroy -var-file="environments\%ENVIRONMENT%.tfvars" -auto-approve
echo Infrastructure destroyed!
goto :done

:action_output
echo Outputs for %ENVIRONMENT%:
terraform output
goto :done

:action_refresh
echo Refreshing state for %ENVIRONMENT%...
terraform refresh -var-file="environments\%ENVIRONMENT%.tfvars"
echo State refreshed!
goto :done

:action_state
echo Showing current state for %ENVIRONMENT%...
terraform state list
goto :done

:action_unknown
echo Unknown action: %ACTION%
echo.
echo Available actions:
echo   init      - Initialize Terraform
echo   validate  - Validate configuration
echo   fmt       - Format Terraform files
echo   plan      - Create execution plan
echo   apply     - Apply infrastructure changes
echo   destroy   - Destroy infrastructure
echo   output    - Show outputs
echo   refresh   - Refresh state
echo   state     - List state resources
exit /b 1

:done
echo.
echo Done!
exit /b 0
