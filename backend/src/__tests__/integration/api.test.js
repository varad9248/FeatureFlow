import request from 'supertest';
import configureApp from '../../api/app.js';

const app = configureApp();

describe('GET /health', () => {
  test('TC-001: returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('TC-024: returns application/json content type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('POST /api/v1/auth/signup', () => {
  test('TC-002: missing email returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({ password: 'Password123!' });
    expect(res.status).toBe(400);
  });
  test('TC-003: missing password returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
  test('TC-004: empty body returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({});
    expect(res.status).toBe(400);
  });
  test('TC-020: blank email returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({ email: '', password: 'Password123!' });
    expect(res.status).toBe(400);
  });
  test('TC-021: blank password returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({ email: 'test@example.com', password: '' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  test('TC-005: missing email returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: 'Password123!' });
    expect(res.status).toBe(400);
  });
  test('TC-006: missing password returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
  test('TC-022: blank email returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: '', password: 'Password123!' });
    expect(res.status).toBe(400);
  });
  test('TC-023: blank password returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@example.com', password: '' });
    expect(res.status).toBe(400);
  });
});

describe('Protected routes with invalid tokens', () => {
  test('TC-025: invalid Authorization token on projects returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  test('TC-026: invalid Authorization token on flags creation returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/flags')
      .set('Authorization', 'Bearer invalid-token')
      .send({ projectId: 'proj-1', name: 'dark-mode' });
    expect(res.status).toBe(401);
  });

  test('TC-027: invalid Authorization token on flag project lookup returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/flags/project/proj-1')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/projects', () => {
  test('TC-007: no token returns 401', async () => {
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/projects', () => {
  test('TC-008: no token returns 401', async () => {
    const res = await request(app).post('/api/v1/projects').send({ name: 'My Project' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/flags', () => {
  test('TC-009: no token returns 401', async () => {
    const res = await request(app).post('/api/v1/flags').send({ projectId: 'proj-1', name: 'dark-mode' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/flags/project/:projectId', () => {
  test('TC-010: no token returns 401', async () => {
    const res = await request(app).get('/api/v1/flags/project/proj-1');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/flags/:flagId', () => {
  test('TC-011: no token returns 401', async () => {
    const res = await request(app).get('/api/v1/flags/flag-1');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/flags/:flagId/toggle', () => {
  test('TC-012: no token returns 401', async () => {
    const res = await request(app).patch('/api/v1/flags/flag-1/toggle');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/flags/:flagId/rollback', () => {
  test('TC-013: no token returns 401', async () => {
    const res = await request(app).post('/api/v1/flags/flag-1/rollback');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/flags/:flagId/rules', () => {
  test('TC-014: no token returns 401', async () => {
    const res = await request(app).post('/api/v1/flags/flag-1/rules').send({ attribute: 'city', operator: 'EQUALS', value: 'Mumbai' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/v1/flags/:flagId/rules/:ruleId', () => {
  test('TC-015: no token returns 401', async () => {
    const res = await request(app).delete('/api/v1/flags/flag-1/rules/rule-1');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/flags/:flagId/logs', () => {
  test('TC-016: no token returns 401', async () => {
    const res = await request(app).get('/api/v1/flags/flag-1/logs');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/sdk/evaluate', () => {
  test('TC-017: no API key returns 401', async () => {
    const res = await request(app).post('/api/v1/sdk/evaluate').send({ context: { userId: 'user-1' } });
    expect(res.status).toBe(401);
  });
  test('TC-018: wrong key format returns 401', async () => {
    const res = await request(app).post('/api/v1/sdk/evaluate').set('Authorization', 'Bearer invalid-key').send({ context: { userId: 'user-1' } });
    expect(res.status).toBe(401);
  });
  test('TC-028: invalid API key prefix returns 401', async () => {
    const res = await request(app).post('/api/v1/sdk/evaluate').set('Authorization', 'Basic ff_live_invalid').send({ context: { userId: 'user-1' } });
    expect(res.status).toBe(401);
  });
  test('TC-029: empty ff_live_ API key returns 401', async () => {
    const res = await request(app).post('/api/v1/sdk/evaluate').set('Authorization', 'Bearer ff_live_').send({ context: { userId: 'user-1' } });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/flags/:flagId/schedule', () => {
  test('TC-019: no token returns 401', async () => {
    const res = await request(app).post('/api/v1/flags/flag-1/schedule').send({ targetStatus: true, scheduledTime: new Date().toISOString() });
    expect(res.status).toBe(401);
  });
});