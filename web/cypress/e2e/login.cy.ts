describe('Login E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    // Verificar elementos do formulário
    cy.get('input[formControlName="username"]').should('exist');
    cy.get('input[formControlName="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should login with valid credentials', () => {
    // Login com credenciais padrão (admin/admin)
    cy.get('input[formControlName="username"]').type('admin');
    cy.get('input[formControlName="password"]').type('admin');
    cy.get('button[type="submit"]').click();

    // Deve redirecionar para o dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should show error with invalid credentials', () => {
    cy.get('input[formControlName="username"]').type('wronguser');
    cy.get('input[formControlName="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();

    // Deve mostrar mensagem de erro
    cy.contains('Usuário ou senha inválidos').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.get('button[type="submit"]').click();

    // Campos obrigatórios devem estar marcados
    cy.get('input[formControlName="username"]').should('have.class', 'ng-invalid');
    cy.get('input[formControlName="password"]').should('have.class', 'ng-invalid');
  });
});
