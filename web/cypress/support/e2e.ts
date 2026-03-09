// cypress/support/e2e.ts
// Import commands.js using ES2015 syntax:
import './commands';

// Ignorar erros de Chart.js causados por reutilização de canvas
Cypress.on('uncaught:exception', (err) => {
  // Ignorar erro específico do Chart.js
  if (err.message.includes('Canvas is already in use')) {
    return false;
  }
  // Permitir que outros erros sejam capturados normalmente
  return true;
});

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent TypeScript errors
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      mockApiCustomers(): Chainable<void>;
      mockApiSales(): Chainable<void>;
      mockApiPayments(): Chainable<void>;
    }
  }
}
