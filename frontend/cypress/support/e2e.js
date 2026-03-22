Cypress.Commands.add('login', (email = 'test@example.com', password = 'Password123!') => {
  cy.intercept('POST', '**/auth/login', {
    statusCode: 200,
    body: { session: { access_token: 'fake-jwt-token' } },
  });
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
});