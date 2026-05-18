import { test, expect } from '@playwright/test';

const API = 'http://localhost:8000';

test.describe('Authentication API', () => {
  test('POST /api/v1/auth/login — success', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('access_token');
    expect(body).toHaveProperty('refresh_token');
  });

  test('POST /api/v1/auth/login — wrong password', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/login`, {
      data: { username: 'admin', password: 'wrong' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /health — healthy', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('healthy');
  });
});
