import { describe, it } from 'vitest';

describe('sign-in', () => {
  it('AUTH-USR-02: old lockout rule');
  it('AUTH-USR-01: rejects a password shorter than 12 characters', () => {});
  it('AUTH-USR-03: locks the account after 5 failed sign-ins', () => {});
  // AUTH-USR-77 is mentioned in a comment, not a test name, so it is ignored.
});
