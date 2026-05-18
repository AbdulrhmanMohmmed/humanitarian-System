import { test, expect } from '@playwright/test';

const API = 'http://localhost:8000';

let token = '';

test.beforeAll(async ({ request }) => {
  const res = await request.post(`${API}/api/v1/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  });
  const body = await res.json();
  token = body.access_token;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

test.describe('Accounting Module', () => {
  test('seed and list chart of accounts', async ({ request }) => {
    await request.post(`${API}/api/v1/accounting/accounts/seed`, { headers: auth() });
    const res = await request.get(`${API}/api/v1/accounting/accounts`, { headers: auth() });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('trial balance endpoint works', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/accounting/trial-balance`, { headers: auth() });
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('Security Module', () => {
  test('MFA setup returns secret and backup codes', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/mfa/setup`, { headers: auth() });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.secret).toHaveLength(32);
    expect(body.backup_codes).toHaveLength(8);
  });

  test('API key lifecycle: create, list, revoke', async ({ request }) => {
    const create = await request.post(`${API}/api/v1/security/api-keys`, {
      data: { name: 'E2E Key' },
      headers: auth(),
    });
    expect(create.ok()).toBeTruthy();
    const key = await create.json();
    expect(key.key).toMatch(/^hiaos_/);

    const list = await request.get(`${API}/api/v1/security/api-keys`, { headers: auth() });
    expect(list.ok()).toBeTruthy();

    const revoke = await request.delete(`${API}/api/v1/security/api-keys/${key.id}`, { headers: auth() });
    expect(revoke.ok()).toBeTruthy();
  });
});

test.describe('Humanitarian Modules', () => {
  test('protection case creation', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/protection/cases`, {
      data: { case_type: 'GBV', priority: 'critical', description: 'E2E test' },
      headers: auth(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.case_number).toMatch(/^PC-/);
  });

  test('nutrition screening SAM classification', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request.post(`${API}/api/v1/nutrition/screenings`, {
      data: { beneficiary_id: 1, screening_date: today, muac: 110 },
      headers: auth(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.classification).toBe('sam');
  });

  test('early warning indicator + alerts', async ({ request }) => {
    const create = await request.post(`${API}/api/v1/early-warning/indicators`, {
      data: { name: 'E2E Indicator', category: 'food_security', threshold_warning: 50, threshold_critical: 100 },
      headers: auth(),
    });
    expect(create.ok()).toBeTruthy();

    const alerts = await request.get(`${API}/api/v1/early-warning/alerts`, { headers: auth() });
    expect(alerts.ok()).toBeTruthy();
  });

  test('WASH dashboard returns metrics', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/wash/dashboard`, { headers: auth() });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('total_water_points');
    expect(body).toHaveProperty('total_served');
  });

  test('unified search returns results', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/search/?q=test`, { headers: auth() });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('results');
  });

  test('bulk export beneficiaries', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/bulk/export/beneficiaries?format=json`, { headers: auth() });
    expect(res.ok()).toBeTruthy();
  });
});
