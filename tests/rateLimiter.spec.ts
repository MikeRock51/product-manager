import request from 'supertest';
import { createApp } from '../app/createApp';
import { initializeDatabase, closeDatabase } from '../app/config/database';

describe('Rate Limiter Middleware', () => {
  const app = createApp();

  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should allow requests under the limit', async () => {
    // Make a series of requests (below the limit)
    const requestCount = 5;
    const responses = [];

    for (let i = 0; i < requestCount; i++) {
      const response = await request(app).get('/');
      responses.push(response);
    }

    // All responses should be successful
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should return rate limit headers', async () => {
    const response = await request(app).get('/');

    // Check for rate limit headers (using draft-7 standard)
    expect(response.headers).toHaveProperty('ratelimit');
    expect(response.headers).toHaveProperty('ratelimit-policy');

    // Verify that ratelimit header contains the expected parts
    const rateLimitHeader = response.headers['ratelimit'] as string;
    expect(rateLimitHeader).toContain('limit=');
    expect(rateLimitHeader).toContain('remaining=');
    expect(rateLimitHeader).toContain('reset=');
  });
});