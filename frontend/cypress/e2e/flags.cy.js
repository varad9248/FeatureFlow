describe('Feature Flags Page', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/projects', {
      statusCode: 200,
      body: { data: [{ id: 'proj-1', name: 'My App Project' }] },
    }).as('getProjects');

    cy.intercept('GET', '**/flags/project/**', {
      statusCode: 200,
      body: {
        data: [
          { id: 'flag-1', name: 'dark-mode', status: false },
          { id: 'flag-2', name: 'new-dashboard', status: true },
        ]
      },
    }).as('getFlags');
  });

  it('TC-UI-007: Unauthenticated user cannot access flags page', () => {
    cy.visit('/dashboard/flags');
    cy.url().should('include', '/login');
  });

  it('TC-UI-008: Login page is accessible', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('TC-UI-009: Signup page is accessible', () => {
    cy.visit('/signup');
    cy.get('input[type="email"]').should('be.visible');
  });

  it('TC-UI-010: Page title is visible on login page', () => {
    cy.visit('/login');
    cy.title().should('not.be.empty');
  });

});