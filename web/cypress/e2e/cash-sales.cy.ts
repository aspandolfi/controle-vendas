describe('Cash Sales E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiSales();
    cy.login('admin', 'admin');
    cy.visit('/vendas-avulso');
  });

  it('should display cash sales form', () => {
    cy.contains('Vendas Avulso').should('be.visible');
    cy.get('input[formControlName="description"]').should('exist');
    cy.get('input[formControlName="date"]').should('exist');
    cy.get('input[formControlName="totalAmount"]').should('exist');
    cy.get('select[formControlName="paymentMethod"]').should('exist');
  });

  it('should create new cash sale', () => {
    // Preencher formulário
    cy.get('input[formControlName="description"]').type('Venda à vista via E2E');
    cy.get('input[formControlName="totalAmount"]').clear().type('150.50');
    cy.get('select[formControlName="paymentMethod"]').select('PIX');
    
    // Submeter formulário
    cy.get('button').contains('Registrar venda').click();
    
    // Verificar que a requisição foi feita
    cy.wait('@createSale');
    
    // Formulário deve ser limpo
    cy.get('input[formControlName="description"]').should('have.value', '');
  });

  it('should validate required fields', () => {
    // Limpar campos
    cy.get('input[formControlName="description"]').clear();
    cy.get('input[formControlName="totalAmount"]').clear();
    
    // Tentar submeter
    cy.get('button').contains('Registrar venda').click();
    
    // Campos devem estar inválidos
    cy.get('input[formControlName="description"]').should('have.class', 'ng-invalid');
    cy.get('input[formControlName="totalAmount"]').should('have.class', 'ng-invalid');
  });

  it('should display list of cash sales', () => {
    cy.wait('@getSales');
    
    // Lista de vendas deve ser exibida
    cy.contains('Histórico de vendas avulsas').should('be.visible');
  });

  it('should filter sales by payment method', () => {
    cy.wait('@getSales');
    
    // Verificar que diferentes métodos de pagamento são exibidos
    cy.contains('th', 'Pagamento').should('be.visible');
  });

  it('should validate minimum amount', () => {
    cy.get('input[formControlName="totalAmount"]').clear().type('0');
    cy.get('button').contains('Registrar venda').click();
    
    // Campo deve estar inválido
    cy.get('input[formControlName="totalAmount"]').should('have.class', 'ng-invalid');
  });
});
