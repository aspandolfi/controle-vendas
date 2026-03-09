describe('Form Validation E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.login('admin', 'admin');
  });

  it('should validate required fields in cash sales form', () => {
    cy.visit('/vendas-avulso');
    
    // Limpar campos
    cy.get('input[formControlName="description"]').clear();
    cy.get('input[formControlName="totalAmount"]').clear();
    
    // Tentar submeter
    cy.get('button').contains('Registrar venda').click();
    
    // Campos devem estar inválidos
    cy.get('input[formControlName="description"]').should('have.class', 'ng-invalid');
    cy.get('input[formControlName="totalAmount"]').should('have.class', 'ng-invalid');
  });

  it('should validate minimum amount for sales', () => {
    cy.visit('/vendas-avulso');
    
    // Preencher com valor zero
    cy.get('input[formControlName="description"]').type('Teste Valor Zero');
    cy.get('input[formControlName="totalAmount"]').clear().type('0');
    
    cy.get('button').contains('Registrar venda').click();
    
    // Campo deve estar inválido
    cy.get('input[formControlName="totalAmount"]').should('have.class', 'ng-invalid');
  });

  it('should validate negative amounts', () => {
    cy.visit('/vendas-avulso');
    
    cy.get('input[formControlName="description"]').type('Teste Valor Negativo');
    cy.get('input[formControlName="totalAmount"]').clear().type('-100');
    
    cy.get('button').contains('Registrar venda').click();
    
    // Campo deve estar inválido ou valor deve ser rejeitado
    cy.get('input[formControlName="totalAmount"]').should('have.class', 'ng-invalid');
  });

  it('should validate phone number format in customer form', () => {
    cy.visit('/clientes');
    cy.contains('button', 'Novo Cliente').click();
    
    cy.get('input[formControlName="name"]').type('Cliente Teste Telefone');
    cy.get('input[formControlName="address"]').type('Rua Teste');
    
    // Telefone inválido (muito curto)
    cy.get('input[formControlName="phone"]').type('123');
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Campo deve estar inválido
    cy.get('input[formControlName="phone"]').should('have.class', 'ng-invalid');
  });

  it('should validate all payment methods are available', () => {
    cy.visit('/vendas-avulso');
    
    // Verificar todas as opções de pagamento
    cy.get('select[formControlName="paymentMethod"]').find('option').should('have.length', 5);
    
    cy.get('select[formControlName="paymentMethod"]').within(() => {
      cy.contains('option', 'Dinheiro').should('exist');
      cy.contains('option', 'Pix').should('exist');
      cy.contains('option', 'Cartão de Crédito').should('exist');
      cy.contains('option', 'Cartão de Débito').should('exist');
      cy.contains('option', 'Cartão de Crédito Parcelado').should('exist');
    });
  });

  it('should clear form after successful submission', () => {
    cy.visit('/vendas-avulso');
    
    cy.get('input[formControlName="description"]').type('Venda Teste Limpar');
    cy.get('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('select[formControlName="paymentMethod"]').select('DINHEIRO');
    
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSale');
    
    // Formulário deve ser limpo
    cy.get('input[formControlName="description"]').should('have.value', '');
  });

  it('should validate date field in cash sales', () => {
    cy.visit('/vendas-avulso');
    
    // Campo de data deve existir
    cy.get('input[formControlName="date"]').should('exist');
    
    // Data deve ser preenchível
    const today = new Date().toISOString().split('T')[0];
    cy.get('input[formControlName="date"]').clear().type(today);
    cy.get('input[formControlName="date"]').should('have.value', today);
  });

  it('should prevent creating sale without description', () => {
    cy.visit('/vendas-avulso');
    
    // Preencher apenas valor
    cy.get('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('select[formControlName="paymentMethod"]').select('PIX');
    
    // Limpar descrição
    cy.get('input[formControlName="description"]').clear();
    
    // Tentar submeter
    cy.get('button').contains('Registrar venda').click();
    
    // Descrição deve estar inválida
    cy.get('input[formControlName="description"]').should('have.class', 'ng-invalid');
  });

  it('should validate credit sale form fields', () => {
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    
    // Tentar submeter sem preencher
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Campos devem estar inválidos
    cy.get('.modal').find('input[formControlName="description"]').should('have.class', 'ng-invalid');
    cy.get('.modal').find('input[formControlName="totalAmount"]').should('have.class', 'ng-invalid');
  });

  it('should validate customer name is required', () => {
    cy.visit('/clientes');
    cy.contains('button', 'Novo Cliente').click();
    
    // Preencher apenas telefone e endereço
    cy.get('input[formControlName="phone"]').type('(11) 98888-9999');
    cy.get('input[formControlName="address"]').type('Rua Teste');
    
    // Tentar submeter sem nome
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Nome deve estar inválido
    cy.get('input[formControlName="name"]').should('have.class', 'ng-invalid');
  });
});
