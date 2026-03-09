# Cypress E2E Tests

## Visão Geral

Este projeto utiliza Cypress para testes end-to-end (E2E) que validam todas as funcionalidades do sistema de controle de vendas.

## Estrutura dos Testes

```
cypress/
├── e2e/                      # Testes E2E
│   ├── login.cy.ts          # Testes de autenticação  
│   ├── dashboard.cy.ts      # Testes do dashboard
│   ├── customers.cy.ts      # Testes de gerenciamento de clientes
│   ├── cash-sales.cy.ts     # Testes de vendas avulso
│   ├── credit-sales.cy.ts   # Testes de vendas a prazo
│   ├── payments.cy.ts       # Testes de pagamentos
│   ├── navigation.cy.ts     # Testes de navegação
│   └── workflow.cy.ts       # Testes de fluxo completo
├── support/
│   ├── commands.ts          # Comandos customizados
│   └── e2e.ts              # Configurações globais
└── cypress.config.ts        # Configuração principal

```

## Comandos Customizados

### `cy.login(username, password)`
Realiza login no sistema com as credenciais fornecidas.

```typescript
cy.login('admin', 'admin');
```

### `cy.mockApiCustomers()`
Intercepta e mocka todas as requisições da API de clientes.

```typescript
cy.mockApiCustomers();
```

### `cy.mockApiSales()`
Intercepta e mocka todas as requisições da API de vendas.

```typescript
cy.mockApiSales();
```

### `cy.mockApiPayments()`
Intercepta e mocka todas as requisições da API de pagamentos.

```typescript
cy.mockApiPayments();
```

## Executando os Testes

### Modo Interativo (Cypress Test Runner)
```bash
npm run e2e
```

### Modo Headless (CI/CD)
```bash
npm run e2e:headless
```

### Executar todos os testes (unitários + E2E)
```bash
npm run test:all
```

## Cobertura dos Testes

### Login (4 testes)
- ✓ Login com credenciais válidas
- ✓ Login com credenciais inválidas
- ✓ Validação de campos obrigatórios
- ✓ Exibição do formulário de login

### Dashboard (4 testes)
- ✓ Exibição de estatísticas
- ✓ Renderização de gráficos
- ✓ Filtro por intervalo de datas
- ✓ Navegação para outras páginas

### Clientes (7 testes)
- ✓ Listagem de clientes
- ✓ Criação de novo cliente
- ✓ Validação de campos obrigatórios
- ✓ Adição de pessoas autorizadas
- ✓ Exibição de saldo
- ✓ Modal de cadastro
- ✓ Fechamento de modal

### Vendas Avulso (6 testes)
- ✓ Exibição do formulário
- ✓ Criação de nova venda
- ✓ Validação de campos obrigatórios
- ✓ Listagem de vendas
- ✓ Filtro por forma de pagamento
- ✓ Validação de valor mínimo

### Vendas a Prazo (8 testes)
- ✓ Exibição da página
- ✓ Busca de clientes
- ✓ Seleção de cliente
- ✓ Modal de nova venda
- ✓ Criação de venda a prazo
- ✓ Exibição de saldo do cliente
- ✓ Validação de campos
- ✓ Paginação e lista de vendas

### Pagamentos (10 testes)
- ✓ Exibição da página
- ✓ Histórico com filtro de data
- ✓ Busca de clientes
- ✓ Formulário de pagamento
- ✓ Saldo em aberto do cliente
- ✓ Pagamento com validação de PIN
- ✓ Validação de campos
- ✓ Impressão de recibo
- ✓ Filtro por período
- ✓ Lista de pagamentos

### Navegação (5 testes)
- ✓ Navegação entre páginas
- ✓ Redirecionamento quando não autenticado
- ✓ Logout
- ✓ Navbar em todas as páginas
- ✓ Highlight do item ativo no menu

### Workflow Completo (3 testes)
- ✓ Fluxo: criar cliente → venda → pagamento
- ✓ Tratamento de erro de API
- ✓ Consistência de dados entre páginas

## Total: 47 testes E2E

## Configuração

O arquivo `cypress.config.ts` contém as configurações:

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
  }
});
```

## Mocking de APIs

Todos os testes utilizam mocking de APIs para garantir:
- ✅ Testes determinísticos
- ✅ Execução rápida
- ✅ Independência do backend
- ✅ Fácil simulação de cenários

## Boas Práticas

1. **Sempre use comandos customizados** para operações repetitivas
2. **Utilize data-testid** em elementos críticos para seletores estáveis
3. **Mantenha testes independentes** - cada teste deve poder rodar isoladamente
4. **Use `cy.wait()` com aliases** de intercepts para garantir que requests foram feitas
5. **Evite timeouts arbitrários** - prefira `cy.wait('@aliasName')`

## Debugging

### Screenshots automáticos
Screenshots são capturados automaticamente quando testes falham:
```
cypress/screenshots/
```

### Vídeos (se habilitado)
Vídeos da execução completa:
```
cypress/videos/
```

### Cypress Test Runner
Para debugging interativo, use:
```bash
npm run e2e
```

## CI/CD Integration

Para integração contínua, use o modo headless:

```yaml
# Exemplo GitHub Actions
- name: Run E2E Tests
  run: |
    npm run start:ci &  # Inicia servidor em background
    npm run e2e:headless
```

## Troubleshooting

### Testes falhando localmente
1. Certifique-se que o servidor está rodando (`npm start`)
2. Verifique se a porta 4200 está disponível
3. Limpe o cache do Cypress: `npx cypress cache clear`

### Timeouts
Se testes estão tendo timeout:
1. Aumente o `defaultCommandTimeout` em `cypress.config.ts`
2. Verifique se o servidor está respondendo
3. Use `cy.wait('@aliasName')` ao invés de `cy.wait(1000)`

## Contribuindo

Ao adicionar novos testes:
1. Organize por feature (login, clientes, vendas, etc.)
2. Use nomes descritivos em português
3. Adicione comandos customizados para operações comuns
4. Documente cenários complexos
5. Execute `npm run test:all` antes de commitar
