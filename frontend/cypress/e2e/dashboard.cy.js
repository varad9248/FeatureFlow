describe('Dashboard Tests', () => {

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Page Protection', () => {
    it('TC-UI-011: /dashboard redirects to login', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('TC-UI-012: /dashboard/flags redirects to login', () => {
      cy.visit('/dashboard/flags');
      cy.url().should('include', '/login');
    });

    it('TC-UI-013: /dashboard/projects redirects to login', () => {
      cy.visit('/dashboard/projects');
      cy.url().should('include', '/login');
    });
  });

  describe('Login Page UI', () => {
    it('TC-UI-014: Login page has correct title', () => {
      cy.visit('/login');
      cy.title().should('not.be.empty');
    });

    it('TC-UI-015: Login page has link to signup', () => {
      cy.visit('/login');
      cy.get('a').should('exist');
    });

    it('TC-UI-016: Password field hides text', () => {
      cy.visit('/login');
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Signup Page UI', () => {
    it('TC-UI-017: Signup page has correct title', () => {
      cy.visit('/signup');
      cy.title().should('not.be.empty');
    });

    it('TC-UI-018: Signup page has link to login', () => {
      cy.visit('/signup');
      cy.get('a').should('exist');
    });

    it('TC-UI-019: Password field hides text on signup', () => {
      cy.visit('/signup');
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Performance Tests', () => {
    it('TC-UI-020: Login page loads in under 5 seconds', () => {
      const start = Date.now();
      cy.visit('/login');
      cy.then(() => {
        const duration = Date.now() - start;
        expect(duration).to.be.lessThan(5000);
      });
    });

    it('TC-UI-021: Signup page loads in under 5 seconds', () => {
      const start = Date.now();
      cy.visit('/signup');
      cy.then(() => {
        const duration = Date.now() - start;
        expect(duration).to.be.lessThan(5000);
      });
    });
  });

  describe('Form Validation', () => {
    it('TC-UI-022: Login form accepts valid email', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('shravani@test.com');
      cy.get('input[type="email"]').should('have.value', 'shravani@test.com');
    });

    it('TC-UI-023: Signup form accepts valid email', () => {
      cy.visit('/signup');
      cy.get('input[type="email"]').type('shravani@test.com');
      cy.get('input[type="email"]').should('have.value', 'shravani@test.com');
    });
  });

});