describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Login Page', () => {
    beforeEach(() => cy.visit('/login'));

    it('TC-UI-001: Login page loads', () => {
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('TC-UI-002: Submit button visible', () => {
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('TC-UI-003: Can type in fields', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="email"]').should('have.value', 'test@example.com');
    });
  });

  describe('Auth Guard', () => {
    it('TC-UI-004: Redirects to login when not authenticated', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });
});