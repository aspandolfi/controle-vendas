describe('Navigation E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.mockApiPayments();
    cy.login('admin', 'admin');
  });

  it('should navigate through all main pages', () => {
    // Dashboard
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
    
    // Clientes
    cy.contains('a', 'Clientes').click();
    cy.url().should('include', '/clientes');
    cy.contains('Lista de Clientes').should('be.visible');
    
    // Vendas à Vista
    cy.contains('a', 'Vendas').click();
    cy.url().should('include', '/vendas-avulso');
    cy.contains('Vendas Avulso').should('be.visible');
    
    // Vendas a Prazo
    cy.contains('a', 'Vendas a Prazo').click();
    cy.url().should('include', '/vendas-prazo');
    cy.contains('Vendas a Prazo').should('be.visible');
    
    // Pagamentos
    cy.contains('a', 'Pagamentos').click();
    cy.url().should('include', '/pagamentos');
    cy.contains('Pagamentos').should('be.visible');
  });

  it('should redirect to login when not authenticated', () => {
    // Limpar localStorage para simular logout
    cy.clearLocalStorage();
    
    // Tentar acessar página protegida
    cy.visit('/dashboard');
    
    // Deve redirecionar para login
    cy.url().should('include', '/login');
  });

  it('should logout successfully', () => {
    cy.visit('/dashboard');
    
    // Clicar em logout (se houver botão de logout)
    cy.get('nav').contains('Sair').click();
    
    // Deve redirecionar para login
    cy.url().should('include', '/login');
  });

  it('should display navbar on all authenticated pages', () => {
    const pages = ['/dashboard', '/clientes', '/vendas-avulso', '/vendas-prazo', '/pagamentos'];
    
    pages.forEach(page => {
      cy.visit(page);
      cy.get('nav').should('be.visible');
    });
  });

  it('should highlight active menu item', () => {
    cy.visit('/clientes');
    
    // Item ativo deve ter classe especial
    cy.contains('a', 'Clientes').should('have.class', 'active');
  });
});
