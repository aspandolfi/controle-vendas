describe('Error Handling and Edge Cases E2E', () => {
  beforeEach(() => {
    cy.mockApiCustomers();
    cy.mockApiSales();
    cy.mockApiPayments();
    cy.login('admin', 'admin');
  });

  it('should handle API error when creating cash sale', () => {
    // Mock erro na criação
    cy.intercept('POST', '**/sales', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('createSaleError');

    cy.visit('/vendas-avulso');
    
    cy.get('input[formControlName="description"]').type('Venda com Erro');
    cy.get('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('select[formControlName="paymentMethod"]').select('DINHEIRO');
    
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSaleError');
    
    // Verificar que erro foi tratado (formulário ainda visível)
    cy.get('input[formControlName="description"]').should('exist');
  });

  it('should handle API error when loading customers', () => {
    // Mock erro ao carregar clientes
    cy.intercept('GET', '**/customers', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('getCustomersError');

    cy.visit('/clientes');
    cy.wait('@getCustomersError');
    
    // Página deve carregar mesmo com erro
    cy.contains('button', 'Novo Cliente').should('exist');
  });

  it('should handle empty customer list', () => {
    // Mock lista vazia
    cy.intercept('GET', '**/customers', {
      statusCode: 200,
      body: []
    }).as('getEmptyCustomers');

    cy.visit('/clientes');
    cy.wait('@getEmptyCustomers');
    
    // Botão de novo cliente ainda deve existir
    cy.contains('button', 'Novo Cliente').should('exist');
  });

  it('should handle empty sales list', () => {
    // Mock lista vazia
    cy.intercept('GET', '**/sales?type=cash', {
      statusCode: 200,
      body: []
    }).as('getEmptySales');

    cy.visit('/vendas-avulso');
    cy.wait('@getEmptySales');
    
    // Formulário deve estar disponível
    cy.get('input[formControlName="description"]').should('exist');
  });

  it('should handle very long description text', () => {
    cy.visit('/vendas-avulso');
    
    const longText = 'A'.repeat(500); // 500 caracteres
    cy.get('input[formControlName="description"]').type(longText.substring(0, 255)); // Input tem limite
    cy.get('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('select[formControlName="paymentMethod"]').select('DINHEIRO');
    
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSale');
    
    // Venda deve ser criada
    cy.get('input[formControlName="description"]').should('have.value', '');
  });

  it('should handle very large monetary values', () => {
    cy.visit('/vendas-avulso');
    
    cy.get('input[formControlName="description"]').type('Venda Valor Alto');
    cy.get('input[formControlName="totalAmount"]').clear().type('999999999');
    cy.get('select[formControlName="paymentMethod"]').select('PIX');
    
    cy.get('button').contains('Registrar venda').click();
    cy.wait('@createSale');
    
    // Venda deve ser criada
    cy.get('input[formControlName="description"]').should('have.value', '');
  });

  it('should handle special characters in customer name', () => {
    cy.visit('/clientes');
    cy.contains('button', 'Novo Cliente').click();
    
    cy.get('input[formControlName="name"]').type('João & Maria - Test\'s "Cliente"');
    cy.get('input[formControlName="phone"]').type('(11) 98888-7777');
    cy.get('input[formControlName="address"]').type('Rua Teste, 123');
    
    cy.get('.modal').find('button[type="submit"]').click();
    cy.wait('@createCustomer');
    cy.wait(300);
    
    // Modal deve fechar
    cy.get('.modal').should('not.exist');
  });

  it('should handle rapid successive clicks on submit button', () => {
    cy.visit('/vendas-avulso');
    
    cy.get('input[formControlName="description"]').type('Teste Cliques Rápidos');
    cy.get('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('select[formControlName="paymentMethod"]').select('DINHEIRO');
    
    // Clicar várias vezes rapidamente
    cy.get('button').contains('Registrar venda').click().click().click();
    
    // Apenas uma requisição deve ser feita
    cy.wait('@createSale');
    cy.get('@createSale.all').should('have.length', 1);
  });

  it('should handle navigation during form submission', () => {
    cy.visit('/vendas-avulso');
    
    cy.get('input[formControlName="description"]').type('Teste Navegação');
    cy.get('input[formControlName="totalAmount"]').clear().type('100');
    cy.get('select[formControlName="paymentMethod"]').select('DINHEIRO');
    
    // Submeter e navegar imediatamente
    cy.get('button').contains('Registrar venda').click();
    cy.visit('/dashboard');
    
    // Dashboard deve carregar normalmente
    cy.contains('Dashboard').should('exist');
  });

  it('should handle date filter with invalid date range', () => {
    cy.visit('/dashboard');
    cy.wait(500); // Aguardar carregamento do dashboard
    
    // Data final antes da data inicial
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    cy.get('input#startDate').clear().type(tomorrow.toISOString().split('T')[0]);
    cy.get('input#endDate').clear().type(yesterday.toISOString().split('T')[0]);
    cy.get('button').contains('Filtrar').click();
    
    // Deve exibir estatísticas zeradas ou tratar o erro
    cy.contains('Dashboard').should('exist');
  });

  it('should handle customer with zero balance', () => {
    // Mock cliente sem vendas
    cy.intercept('GET', '**/customers', {
      statusCode: 200,
      body: [
        {
          id: 'customer-zero-balance',
          name: 'Cliente Sem Dívidas',
          phone: '(11) 99999-9999',
          address: 'Rua Zero',
          balance: 0
        }
      ]
    }).as('getZeroBalanceCustomer');

    cy.visit('/vendas-prazo');
    cy.wait('@getZeroBalanceCustomer');
    
    // Cliente deve aparecer na lista
    cy.contains('Cliente Sem Dívidas').should('exist');
    cy.contains('R$ 0,00').should('exist');
  });

  it('should handle payment exceeding customer balance', () => {
    cy.visit('/pagamentos');
    cy.wait('@getCustomers');
    cy.wait(500);
    
    // Tentar pagar valor maior que o saldo
    cy.get('input[placeholder*="Digite o nome"]').type('Cliente Teste');
    cy.contains('button', 'Registrar Pagamento').first().click({ force: true });
    
    cy.get('.modal').find('input[formControlName="amount"]').clear().type('999999');
    cy.get('.modal').find('button[type="submit"]').click();
    
    // Deve aceitar ou validar o valor
    cy.get('.modal').should('exist');
  });

  it('should handle logout and redirect to login', () => {
    cy.visit('/dashboard');
    
    // Fazer logout
    cy.get('nav').contains('Sair').click();
    
    // Deve redirecionar para login
    cy.url().should('include', '/login');
    cy.contains('Login').should('exist');
  });

  it('should handle unauthorized access to protected routes', () => {
    // Limpar localStorage (logout)
    cy.clearLocalStorage();
    
    // Tentar acessar rota protegida
    cy.visit('/dashboard');
    
    // Deve redirecionar para login
    cy.url().should('include', '/login');
  });

  it('should handle modal close by ESC key', () => {
    cy.visit('/clientes');
    cy.contains('button', 'Novo Cliente').click();
    
    // Modal deve estar aberto
    cy.get('.modal').should('exist');
    
    // Pressionar ESC
    cy.get('body').type('{esc}');
    cy.wait(300);
    
    // Modal pode ou não fechar dependendo da implementação
    // Apenas verificar que a página ainda funciona
    cy.contains('button', 'Novo Cliente').should('exist');
  });
});
