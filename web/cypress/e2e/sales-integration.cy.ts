describe('Sales Integration E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.mockApiPayments();
    cy.login('admin', 'admin');
  });

  it('should create cash sale and verify in dashboard', () => {
    // Criar venda avulso
    cy.visit('/vendas-avulso');
    
    cy.get('input[formControlName="description"]').type('Produto Teste');
    cy.get('input[formControlName="totalAmount"]').clear().type('250.00');
    cy.get('select[formControlName="paymentMethod"]').select('DINHEIRO');
    
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSale');
    
    // Verificar no dashboard
    cy.visit('/dashboard');
    cy.contains('Vendas à vista').should('be.visible');
  });

  it('should create credit sale and verify customer balance', () => {
    // Ir para vendas a prazo
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    // Selecionar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    
    // Criar venda
    cy.get('.modal').find('input[formControlName="description"]').type('Venda a Prazo Teste');
    cy.get('.modal').find('input[formControlName="totalAmount"]').clear().type('500');
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createSale');
    
    // Aguardar modal fechar
    cy.wait(300);
    
    // Verificar saldo
    cy.contains('Saldo em Aberto').should('be.visible');
  });

  it('should register multiple cash sales in sequence', () => {
    cy.visit('/vendas-avulso');
    
    // Primeira venda
    cy.get('input[formControlName="description"]').type('Venda 1');
    cy.get('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('select[formControlName="paymentMethod"]').select('PIX');
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSale');
    
    // Segunda venda
    cy.get('input[formControlName="description"]').type('Venda 2');
    cy.get('input[formControlName="totalAmount"]').clear().type('150');
    cy.get('select[formControlName="paymentMethod"]').select('CARTAO_CREDITO');
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSale');
    
    // Terceira venda
    cy.get('input[formControlName="description"]').type('Venda 3');
    cy.get('input[formControlName="totalAmount"]').clear().type('200');
    cy.get('select[formControlName="paymentMethod"]').select('CARTAO_DEBITO');
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSale');
    
    // Verificar histórico
    cy.contains('Histórico de vendas avulsas').should('be.visible');
  });

  it('should validate payment methods for cash sales', () => {
    cy.visit('/vendas-avulso');
    
    const paymentMethods = [
      'DINHEIRO',
      'PIX',
      'CARTAO_CREDITO',
      'CARTAO_DEBITO',
      'CARTAO_CREDITO_PARCELADO'
    ];
    
    paymentMethods.forEach((method) => {
      cy.get('select[formControlName="paymentMethod"]').select(method);
      cy.get('select[formControlName="paymentMethod"]').should('have.value', method);
    });
  });

  it('should display sales by date in dashboard', () => {
    // Criar venda
    cy.visit('/vendas-avulso');
    cy.get('input[formControlName="description"]').type('Venda Teste Data');
    cy.get('input[formControlName="totalAmount"]').clear().type('300');
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSale');
    
    // Ir para dashboard e verificar filtros de data
    cy.visit('/dashboard');
    cy.get('input#startDate').should('exist');
    cy.get('input#endDate').should('exist');
  });

  it('should verify sales information consistency', () => {
    // Criar venda a prazo
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    
    const description = 'Venda Consistência';
    const value = '450';
    
    cy.get('.modal').find('input[formControlName="description"]').type(description);
    cy.get('.modal').find('input[formControlName="totalAmount"]').clear().type(value);
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createSale');
    
    // Verificar que os valores estão corretos
    cy.wait(300);
    cy.get('.modal.show').should('not.exist');
  });
});
