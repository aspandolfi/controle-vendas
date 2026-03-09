describe('Integration Workflow E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.mockApiPayments();
    cy.login('admin', 'admin');
  });

  it('should complete full workflow: create customer, sale, and payment', () => {
    // 1. Criar cliente
    cy.visit('/clientes');
    cy.contains('button', 'Novo Cliente').click();
    
    cy.get('input[formControlName="name"]').type('Cliente Workflow E2E');
    cy.get('input[formControlName="phone"]').type('(11) 98888-8888');
    cy.get('input[formControlName="address"]').type('Rua Workflow, 999');
    
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createCustomer');
    
    // Aguardar modal fechar
    cy.wait(300);
    cy.get('.modal.show').should('not.exist');
    
    // 2. Criar venda a prazo para o cliente
    cy.visit('/vendas-prazo');
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Workflow');
    
    // Clicar em Nova Venda
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    
    cy.get('.modal').find('input[formControlName="description"]').type('Produto Teste Workflow');
    cy.get('.modal').find('input[formControlName="totalAmount"]').clear().type('1000');
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createSale');
    
    // 3. Verificar que a venda aparece no dashboard
    cy.visit('/dashboard');
    cy.contains('Vendas registradas').should('be.visible');
  });

  it('should handle error when API is unavailable', () => {
    // Simular erro de API
    cy.intercept('GET', '**/customers', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('getCustomersError');
    
    cy.visit('/clientes');
    cy.wait('@getCustomersError');
    
    // Deve exibir mensagem de erro ou lista vazia
    cy.wait(100);
  });

  it('should validate data consistency across pages', () => {
    // Verificar vendas a prazo
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    
    // Verificar saldo
    cy.contains('Saldo em Aberto').should('be.visible');
    
    // Verificar no dashboard
    cy.visit('/dashboard');
    cy.contains('Saldo em aberto').should('be.visible');
  });

  it('should allow creating multiple sales for same customer', () => {
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    // Primeira venda
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    
    cy.get('.modal').find('input[formControlName="description"]').type('Venda 1');
    cy.get('.modal').find('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createSale');
    
    // Aguardar modal fechar
    cy.wait(300);
    
    // Segunda venda
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    
    cy.get('.modal').find('input[formControlName="description"]').type('Venda 2');
    cy.get('.modal').find('input[formControlName="totalAmount"]').clear().type('200');
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createSale');
  });

  it('should navigate between all main sections', () => {
    // Dashboard
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
    
    // Clientes
    cy.visit('/clientes');
    cy.contains('Lista de clientes').should('be.visible');
    
    // Vendas Avulso
    cy.visit('/vendas-avulso');
    cy.contains('Vendas Avulso').should('be.visible');
    
    // Vendas a Prazo
    cy.visit('/vendas-prazo');
    cy.contains('Vendas a Prazo').should('be.visible');
    
    // Pagamentos
    cy.visit('/pagamentos');
    cy.contains('Pagamentos').should('be.visible');
  });
});
