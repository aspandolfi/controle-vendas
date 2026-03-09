// cypress/support/commands.ts
/// <reference types="cypress" />

/**
 * Custom command para fazer login
 */
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('input[formControlName="username"]').type(username);
  cy.get('input[formControlName="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

/**
 * Mock da API de clientes
 */
Cypress.Commands.add('mockApiCustomers', () => {
  cy.intercept('GET', '**/customers', {
    statusCode: 200,
    body: {
      customers: [
        {
          id: '1',
          name: 'Cliente Teste E2E',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Outro Cliente Teste',
          created_at: new Date().toISOString()
        }
      ]
    }
  }).as('getCustomers');

  cy.intercept('POST', '**/customers', {
    statusCode: 200,
    body: {
      message: 'Customer created',
      customer: {
        id: '3',
        name: 'Novo Cliente',
        created_at: new Date().toISOString()
      }
    }
  }).as('createCustomer');
});

/**
 * Mock da API de vendas
 */
Cypress.Commands.add('mockApiSales', () => {
  cy.intercept('GET', '**/sales*', {
    statusCode: 200,
    body: {
      sales: [
        {
          id: '1',
          customer_id: '1',
          date: new Date().toISOString(),
          type: 'PRAZO',
          quantity: 1,
          total_value: 100,
          remaining_balance: 50,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          customer_id: null,
          date: new Date().toISOString(),
          type: 'AVULSO',
          quantity: 1,
          total_value: 200,
          remaining_balance: 0,
          created_at: new Date().toISOString()
        }
      ]
    }
  }).as('getSales');

  cy.intercept('POST', '**/sales', {
    statusCode: 200,
    body: {
      message: 'Sale created',
      sale: {
        id: '3',
        customer_id: '1',
        date: new Date().toISOString(),
        type: 'PRAZO',
        quantity: 1,
        total_value: 150,
        remaining_balance: 150,
        created_at: new Date().toISOString()
      }
    }
  }).as('createSale');
});

/**
 * Mock da API de pagamentos
 */
Cypress.Commands.add('mockApiPayments', () => {
  cy.intercept('GET', '**/payments*', {
    statusCode: 200,
    body: {
      payments: [
        {
          id: '1',
          customer_id: '1',
          date: new Date().toISOString(),
          amount: 50,
          sale_id: '1',
          created_at: new Date().toISOString()
        }
      ]
    }
  }).as('getPayments');

  cy.intercept('POST', '**/payments', {
    statusCode: 200,
    body: {
      message: 'Payment created',
      payment: {
        id: '2',
        customer_id: '1',
        date: new Date().toISOString(),
        amount: 100,
        sale_id: '1',
        created_at: new Date().toISOString()
      }
    }
  }).as('createPayment');
});
