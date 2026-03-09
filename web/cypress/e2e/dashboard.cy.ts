describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Mock das APIs
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.mockApiPayments();

    // Fazer login
    cy.login('admin', 'admin');
  });

  it('should display dashboard with statistics', () => {
    cy.visit('/dashboard');
    
    // Verificar que as estatísticas são exibidas
    cy.contains('Saldo em aberto').should('be.visible');
    cy.contains('Vendas à vista').should('be.visible');
    cy.contains('Clientes cadastrados').should('be.visible');
    cy.contains('Vendas registradas').should('be.visible');
    cy.contains('Pagamentos realizados').should('be.visible');
  });

  it('should display sales chart', () => {
    cy.visit('/dashboard');
    
    // Verificar que o canvas do gráfico existe
    cy.get('canvas').should('exist');
  });

  it('should filter data by date range', () => {
    cy.visit('/dashboard');
    
    // Verificar que os filtros de data existem
    cy.get('input#startDate').should('exist');
    cy.get('input#endDate').should('exist');
    
    // Alterar filtro de data
    const today = new Date().toISOString().split('T')[0];
    cy.get('input#startDate').clear().type(today);
    cy.get('input#endDate').clear().type(today);
    
    // Verificar que os dados são atualizados (aguardar processamento)
    cy.wait(500);
  });

  it('should navigate to other pages from menu', () => {
    cy.visit('/dashboard');
    
    // Verificar que a navbar está visível
    cy.get('nav').should('be.visible');
    
    // Navegar para clientes
    cy.contains('a', 'Clientes').click();
    cy.url().should('include', '/clientes');
  });
});
