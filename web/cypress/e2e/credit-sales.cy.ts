describe('Credit Sales E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.login('admin', 'admin');
    cy.visit('/vendas-prazo');
  });

  it('should display credit sales page', () => {
    cy.contains('Vendas a Prazo').should('be.visible');
    cy.contains('Buscar Cliente').should('be.visible');
  });

  it('should search for customers', () => {
    cy.wait('@getCustomers');
    
    // Buscar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    
    // Resultados da busca devem aparecer
    cy.contains('Cliente Teste E2E').should('be.visible');
  });

  it('should select customer and display their sales', () => {
    cy.wait('@getCustomers');
    
    // Buscar e selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('Nova Venda').first().click();
    
    // Vendas do cliente devem ser carregadas
    cy.wait('@getSales');
    cy.contains('Vendas deste cliente').should('be.visible');
  });

  it('should open modal to create new credit sale', () => {
    cy.wait('@getCustomers');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    
    // Clicar no botão Nova Venda com force (pode estar parcialmente coberto)
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    
    // Modal deve estar visível
    cy.get('.modal').should('be.visible');
  });

  it('should create new credit sale for customer', () => {
    cy.wait('@getCustomers');
    
    // Selecionar cliente e abrir modal
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('Nova Venda').first().click({ force: true });
    
    // Preencher formulário
    cy.get('.modal').find('input[formControlName="description"]').type('Venda a prazo E2E');
    cy.get('.modal').find('input[formControlName="totalAmount"]').clear().type('500');
    
    // Submeter
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Verificar requisição
    cy.wait('@createSale');
  });

  it('should display customer balance', () => {
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Buscar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    
    // Saldo do cliente deve ser exibido
    cy.contains('Saldo em Aberto').should('be.visible');
  });

  it('should validate required fields when creating credit sale', () => {
    cy.wait('@getCustomers');
    
    // Selecionar cliente e abrir modal
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('Nova Venda').first().click({ force: true });
    
    // Tentar submeter sem preencher
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Campos devem estar inválidos
    cy.get('.modal').find('input[formControlName="description"]').should('have.class', 'ng-invalid');
    cy.get('.modal').find('input[formControlName="totalAmount"]').should('have.class', 'ng-invalid');
  });

  it('should display sales list with pagination', () => {
    cy.wait('@getCustomers');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('Nova Venda').first().click();
    
    cy.wait('@getSales');
    
    // Tabela de vendas deve existir
    cy.get('table').should('exist');
  });

  it('should show remaining balance for each sale', () => {
    cy.wait('@getCustomers');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('Nova Venda').first().click();
    
    cy.wait('@getSales');
    
    // Coluna de saldo deve existir
    cy.contains('th', 'Saldo em aberto').should('be.visible');
  });
});
