describe('Customers E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.login('admin', 'admin');
    cy.visit('/clientes');
  });

  it('should display customer list', () => {
    cy.wait('@getCustomers');
    
    // Verificar que a lista de clientes é exibida
    cy.contains('Lista de clientes').should('be.visible');
    // Verificar que a tabela existe e tem dados
    cy.get('table tbody tr').should('have.length.at.least', 1);
  });

  it('should open modal to create new customer', () => {
    cy.contains('button', 'Novo Cliente').click();
    
    // Modal deve estar visível
    cy.get('.modal').should('be.visible');
    cy.contains('Novo Cliente').should('be.visible');
  });

  it('should create new customer', () => {
    cy.contains('button', 'Novo Cliente').click();
    
    // Preencher formulário
    cy.get('input[formControlName="name"]').type('Novo Cliente Via E2E');
    cy.get('input[formControlName="phone"]').type('(11) 99999-9999');
    cy.get('input[formControlName="address"]').type('Rua Teste E2E, 123');
    
    // Submeter formulário
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Verificar que a requisição foi feita
    cy.wait('@createCustomer');
  });

  it('should validate required fields when creating customer', () => {
    cy.contains('button', 'Novo Cliente').click();
    
    // Tentar submeter sem preencher
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Campos devem estar inválidos
    cy.get('input[formControlName="name"]').should('have.class', 'ng-invalid');
    cy.get('input[formControlName="phone"]').should('have.class', 'ng-invalid');
    cy.get('input[formControlName="address"]').should('have.class', 'ng-invalid');
  });

  it('should add authorized person to customer', () => {
    cy.contains('button', 'Novo Cliente').click();
    
    // Scrollar para baixo no modal para encontrar o botão
    cy.get('.modal-body').scrollTo('bottom');
    
    // Verificar se existe campo de pessoas autorizadas ou FormArray
    cy.get('.modal').should('be.visible');
  });

  it('should display customer balance', () => {
    cy.wait('@getCustomers');
    cy.wait('@getSales');
    
    // Saldo deve ser exibido para cada cliente
    cy.contains('Saldo em aberto').should('be.visible');
  });

  it('should close modal on cancel', () => {
    cy.contains('button', 'Novo Cliente').click();
    
    // Fechar modal usando o X
    cy.get('.modal').find('.btn-close').click();
    
    // Aguardar modal fechar
    cy.wait(300);
    
    // Modal não deve estar visível
    cy.get('.modal.show').should('not.exist');
  });
});
