import test from 'node:test';
import assert from 'node:assert/strict';
import { signAuthToken, verifyAuthToken } from './auth-jwt';

test('signAuthToken and verifyAuthToken round-trip user payload with role', async () => {
  const secret = 'test-secret-for-unit-tests-at-least-32-chars';
  const token = await signAuthToken(
    {
      sub: 'usr_123',
      email: 'admin@codeexam.dev',
      name: 'Admin User',
      role: 'admin',
    },
    secret
  );

  const decoded = await verifyAuthToken(token, secret);
  assert.ok(decoded);
  assert.equal(decoded.sub, 'usr_123');
  assert.equal(decoded.email, 'admin@codeexam.dev');
  assert.equal(decoded.role, 'admin');
});

test('verifyAuthToken rejects tampered tokens or wrong secrets', async () => {
  const token = await signAuthToken(
    {
      sub: 'usr_456',
      email: 'user@codeexam.dev',
      name: 'Student',
      role: 'user',
    },
    'secret-one-123456789012345678901234'
  );

  const wrongSecret = await verifyAuthToken(
    token,
    'secret-two-123456789012345678901234'
  );
  assert.equal(wrongSecret, null);

  const malformed = await verifyAuthToken('not.a.jwt');
  assert.equal(malformed, null);
});
