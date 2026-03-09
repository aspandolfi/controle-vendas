describe('Payments E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.mockApiPayments();
    cy.login('admin', 'admin');
    cy.visit('/pagamentos');
  });

  it('should display payments page', () => {
    cy.contains('Pagamentos').should('be.visible');
    cy.contains('Buscar Cliente').should('be.visible');
  });

  it('should display payment history with date filter', () => {
    cy.wait('@getPayments');
    
    // Histórico deve ser exibido
    cy.contains('Histórico de Pagamentos').should('be.visible');
    
    // Filtros de data devem existir
    cy.get('input[type="date"]').should('have.length.at.least', 2);
  });

  it('should search for customers to register payment', () => {
    cy.wait('@getCustomers');
    
    // Buscar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    
    // Resultados devem aparecer
    cy.contains('Cliente Teste E2E').should('be.visible');
  });

  it('should select customer and show payment form', () => {
    cy.wait('@getCustomers');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('Selecionar').first().click();
    
    // Modal de pagamento deve abrir
    cy.get('.modal').should('be.visible');
    cy.contains('Registrar Pagamento').should('be.visible');
  });

  it('should display customer open balance', () => {
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('Selecionar').first().click();
    
    // Saldo em aberto deve ser exibido
    cy.contains('Saldo em Aberto').should('be.visible');
  });

  it('should create new payment with PIN validation', () => {
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('Selecionar').first().click();
    
    // Preencher valor do pagamento
    cy.get('.modal').find('input[formControlName="amount"]').clear().type('50');
    
    // Submeter
    cy.get('.modal').find('button').contains('Registrar Pagamento').click();
    
    // Modal de PIN deve aparecer
    cy.contains('Digite seu PIN').should('be.visible');
    
    // Digitar PIN (padrão: 1234)
    cy.get('input[formControlName="pin"]').type('1234');
    cy.get('button').contains('Confirmar').click();
    
    // Pagamento deve ser criado
    cy.wait('@createPayment');
  });

  it('should validate payment amount does not exceed balance', () => {
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Buscar"]').type('Cliente Teste');
    cy.contains('Cliente Teste E2E').click();
    
    // Tentar pagar valor maior que o saldo
    cy.get('.modal').find('input[formControlName="amount"]').clear().type('99999');
    cy.get('.modal').find('button').contains('Registrar Pagamento').click();
    
    // Mensagem de erro deve aparecer
    cy.contains('excede o saldo').should('be.visible');
  });

  it('should reject payment with invalid PIN', () => {
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Buscar"]').type('Cliente Teste');
    cy.contains('Cliente Teste E2E').click();
    
    // Preencher pagamento
    cy.get('.modal').find('input[formControlName="amount"]').clear().type('25');
    cy.get('.modal').find('button').contains('Registrar Pagamento').click();
    
    // Digitar PIN incorreto
    cy.get('input[formControlName="pin"]').type('9999');
    cy.get('button').contains('Confirmar').click();
    
    // Mensagem de erro deve aparecer
    cy.contains('PIN inválido').should('be.visible');
  });

  it('should filter payments by date range', () => {
    cy.wait('@getPayments');
    
    // Alterar filtro de data
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    cy.get('input[type="date"]').first().clear().type(lastMonth);
    cy.get('input[type="date"]').last().clear().type(today);
    
    // Lista deve ser atualizada
    cy.wait(100);
  });

  it('should display customer sales when registering payment', () => {
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Buscar"]').type('Cliente Teste');
    cy.contains('Cliente Teste E2E').click();
    
    // Vendas pendentes devem ser exibidas
    cy.contains('Vendas Pendentes').should('be.visible');
  });

  it('should print payment receipt', () => {
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Buscar"]').type('Cliente Teste');
    cy.contains('Cliente Teste E2E').click();
    
    // Clicar em imprimir
    cy.contains('button', 'Imprimir').click();
    
    // Componente de impressão deve existir
    cy.get('app-payment-print').should('exist');
  });
});
