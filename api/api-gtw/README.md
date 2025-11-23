# API Documentation

Documentação completa da API do sistema de controle de vendas usando OpenAPI 3.0.

## 📋 Visão Geral

A API é documentada usando o padrão **OpenAPI 3.0** (anteriormente Swagger), fornecendo uma especificação completa de todos os endpoints, modelos de dados e respostas.

## 🔗 Acessando a Documentação

### Após o Deploy

Após fazer deploy com `enable_api_docs = true`, você terá:

1. **Swagger UI Interativo**: Interface web para explorar e testar a API
   ```bash
   terraform output swagger_ui_url
   # http://controle-vendas-dev-api-docs.s3-website-us-east-1.amazonaws.com
   ```

2. **Especificação OpenAPI (JSON)**:
   ```bash
   terraform output api_documentation_url
   # https://abc123.execute-api.us-east-1.amazonaws.com/dev/openapi.json
   ```

### Arquivo Local

O arquivo `openapi.json` contém a especificação completa e pode ser usado com:
- **Swagger UI**: Interface web para visualização
- **Postman**: Importar para criar coleção de testes
- **Insomnia**: Importar para criar workspace
- **VS Code**: Extensões como "OpenAPI (Swagger) Editor"

## 📚 Endpoints Documentados

### Health
- `GET /health` - Verificar status da API

### Customers (Clientes)
- `GET /customers` - Listar todos os clientes
- `POST /customers` - Criar novo cliente
- `GET /customers/{customerId}` - Obter detalhes de um cliente

### Sales (Vendas)
- `GET /sales` - Listar vendas (com filtros opcionais)
- `POST /sales` - Registrar nova venda

**Filtros disponíveis:**
- `customerId`: Filtrar por cliente
- `type`: Tipo de venda (AVULSO ou PRAZO)
- `startDate`: Data inicial
- `endDate`: Data final

### Payments (Pagamentos)
- `GET /payments` - Listar pagamentos (com filtros opcionais)
- `POST /payments` - Registrar novo pagamento

**Filtros disponíveis:**
- `customerId`: Filtrar por cliente
- `startDate`: Data inicial
- `endDate`: Data final

## 🎨 Visualizando Localmente

### Opção 1: Swagger UI Local

```bash
# Instalar http-server
npm install -g http-server

# Servir o arquivo
cd api/infra
http-server -p 8080

# Abrir no navegador
# http://localhost:8080/swagger-ui.html
```

### Opção 2: Swagger Editor Online

1. Acesse https://editor.swagger.io/
2. Copie o conteúdo de `openapi.json`
3. Cole no editor

### Opção 3: VS Code

Instale a extensão "OpenAPI (Swagger) Editor":
```bash
code --install-extension 42Crunch.vscode-openapi
```

Abra o arquivo `openapi.json` e use `Shift+Alt+P` para preview.

### Opção 4: Postman

1. Abra Postman
2. Import → Upload Files
3. Selecione `openapi.json`
4. Uma coleção será criada automaticamente

## 🔧 Testando a API

### Usando Swagger UI

1. Acesse a URL do Swagger UI
2. Clique em um endpoint
3. Clique em "Try it out"
4. Preencha os parâmetros
5. Clique em "Execute"

### Usando curl

```bash
# Health check
curl https://api-url.amazonaws.com/dev/health

# Criar cliente
curl -X POST https://api-url.amazonaws.com/dev/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "João Silva"}'

# Listar vendas de um cliente
curl "https://api-url.amazonaws.com/dev/sales?customerId=customer-123"

# Criar venda
curl -X POST https://api-url.amazonaws.com/dev/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "date": "2025-11-23T10:00:00Z",
    "type": "PRAZO",
    "quantity": 10,
    "totalValue": 150.50
  }'
```

### Usando HTTPie

```bash
# Instalar HTTPie
pip install httpie

# Health check
http GET https://api-url.amazonaws.com/dev/health

# Criar cliente
http POST https://api-url.amazonaws.com/dev/customers name="João Silva"

# Criar venda
http POST https://api-url.amazonaws.com/dev/sales \
  customerId=customer-123 \
  date=2025-11-23T10:00:00Z \
  type=PRAZO \
  quantity:=10 \
  totalValue:=150.50
```

## 📊 Modelos de Dados

### Customer
```json
{
  "id": "customer-123",
  "name": "João Silva",
  "createdAt": "2025-11-23T10:00:00Z"
}
```

### Sale
```json
{
  "id": "sale-456",
  "customerId": "customer-123",
  "date": "2025-11-23T10:00:00Z",
  "type": "PRAZO",
  "quantity": 10,
  "totalValue": 150.50,
  "remainingBalance": 75.25,
  "createdAt": "2025-11-23T10:00:00Z"
}
```

### Payment
```json
{
  "id": "payment-789",
  "customerId": "customer-123",
  "date": "2025-11-23T10:00:00Z",
  "amount": 50.00,
  "saleId": "sale-456",
  "createdAt": "2025-11-23T10:00:00Z"
}
```

## 🔒 Autenticação

> ⚠️ **TODO**: Atualmente a API não possui autenticação. Será implementado:
> - JWT tokens via AWS Cognito
> - API Keys via API Gateway
> - Lambda Authorizer para validação de PIN

## 🚀 Atualizando a Documentação

### Modificar o Contrato

1. Edite `api/infra/openapi.json`
2. Valide a especificação:
   ```bash
   # Usando openapi-generator-cli
   npm install -g @openapitools/openapi-generator-cli
   openapi-generator-cli validate -i openapi.json
   ```
3. Deploy:
   ```bash
   ./scripts/terraform.sh dev apply
   ```

### Adicionar Novo Endpoint

1. Adicione em `paths` no `openapi.json`:
   ```json
   "/my-endpoint": {
     "get": {
       "summary": "My endpoint",
       "operationId": "myOperation",
       "tags": ["MyTag"],
       "responses": {
         "200": {
           "description": "Success"
         }
       }
     }
   }
   ```

2. Adicione schemas em `components.schemas` se necessário
3. Implemente o endpoint no Lambda (`src/handler.py`)
4. Deploy novamente

## 📦 Gerando Clientes

A especificação OpenAPI pode gerar clientes automaticamente:

### Python Client
```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g python \
  -o ./generated/python-client
```

### TypeScript Client
```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-axios \
  -o ./generated/typescript-client
```

### Java Client
```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g java \
  -o ./generated/java-client
```

## 🎯 Melhores Práticas

1. **Sempre documente**:
   - Adicione `description` em todos os endpoints
   - Inclua exemplos nos schemas
   - Documente códigos de erro

2. **Validação**:
   - Use `required` para campos obrigatórios
   - Defina `minimum`, `maximum` para números
   - Use `enum` para valores fixos

3. **Versionamento**:
   - Atualize `info.version` quando modificar a API
   - Use semantic versioning (1.0.0, 1.1.0, 2.0.0)

4. **Segurança**:
   - Documente requisitos de autenticação
   - Liste possíveis erros de autorização

## 🔗 Links Úteis

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Postman OpenAPI Import](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/)
