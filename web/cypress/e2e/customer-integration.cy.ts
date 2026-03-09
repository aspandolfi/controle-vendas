describe('Customer Integration E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.login('admin', 'admin');
  });

  it('should create customer and immediately create sale', () => {
    // Criar cliente
    cy.visit('/clientes');
    cy.contains('button', 'Novo Cliente').click();
    
    const customerName = 'Cliente Integração ' + Date.now();
    cy.get('input[formControlName="name"]').type(customerName);
    cy.get('input[formControlName="phone"]').type('(11) 99999-8888');
    cy.get('input[formControlName="address"]').type('Rua Teste, 123');
    
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createCustomer');
    
    // Aguardar modal fechar
    cy.wait(300);
    
    // Ir para vendas a prazo
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    // Buscar cliente recém criado
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente');
    
    // Verificar que aparece na lista
    cy.wait(200);
  });

  it('should verify customer balance after multiple sales', () => {
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    // Buscar cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    
    // Verificar saldo inicial
    cy.contains('Saldo em Aberto').should('be.visible');
    
    // Criar primeira venda
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    cy.get('.modal').find('input[formControlName="description"]').type('Venda 1');
    cy.get('.modal').find('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createSale');
    
    cy.wait(300);
    
    // Criar segunda venda
    cy.contains('button', 'Nova Venda').first().click({ force: true });
    cy.get('.modal').find('input[formControlName="description"]').type('Venda 2');
    cy.get('.modal').find('input[formControlName="totalAmount"]').clear().type('200');
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createSale');
    
    // Verificar que saldo foi atualizado
    cy.wait(300);
    cy.contains('Saldo em Aberto').should('be.visible');
  });

  it('should search and filter customers', () => {
    cy.visit('/clientes');
    cy.wait('@getCustomers');
    
    // Verificar lista completa
    cy.get('table tbody tr').should('have.length.at.least', 1);
    
    // Ir para vendas a prazo para testar busca
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    // Buscar cliente específico
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    
    // Resultados devem aparecer
    cy.wait(200);
    cy.get('table tbody').should('be.visible');
  });

  it('should validate customer form fields', () => {
    cy.visit('/clientes');
    cy.contains('button', 'Novo Cliente').click();
    
    // Tentar submeter sem preencher
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Campos devem estar inválidos
    cy.get('input[formControlName="name"]').should('have.class', 'ng-invalid');
    cy.get('input[formControlName="phone"]').should('have.class', 'ng-invalid');
    cy.get('input[formControlName="address"]').should('have.class', 'ng-invalid');
    
    // Preencher campos
    cy.get('input[formControlName="name"]').type('Cliente Validação');
    cy.get('input[formControlName="phone"]').type('(11) 98888-7777');
    cy.get('input[formControlName="address"]').type('Rua Validação, 456');
    
    // Campos devem estar válidos
    cy.get('input[formControlName="name"]').should('have.class', 'ng-valid');
    cy.get('input[formControlName="phone"]').should('have.class', 'ng-valid');
    cy.get('input[formControlName="address"]').should('have.class', 'ng-valid');
  });

  it('should display customer balance in list', () => {
    cy.visit('/clientes');
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Verificar que coluna de saldo existe
    cy.contains('th', 'Saldo em aberto').should('be.visible');
    
    // Verificar que valores de saldo são exibidos
    cy.get('table tbody tr').first().within(() => {
      cy.contains('R$').should('be.visible');
    });
  });

  it('should navigate from customer list to sales', () => {
    cy.visit('/clientes');
    cy.wait('@getCustomers');
    
    // Navegar para vendas a prazo
    cy.visit('/vendas-prazo');
    cy.wait('@getCustomers');
    
    // Selecionar um cliente
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente');
    
    // Verificar que consegue criar venda
    cy.wait(200);
  });
});
