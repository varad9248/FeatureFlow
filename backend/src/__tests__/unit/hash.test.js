import { calculateRolloutBucket } from '../../shared/utils/hash.js';

describe('calculateRolloutBucket()', () => {
  test('returns 100 when no user ID is provided', () => {
    expect(calculateRolloutBucket('', 'flag-1')).toBe(100);
    expect(calculateRolloutBucket(null, 'flag-1')).toBe(100);
    expect(calculateRolloutBucket(undefined, 'flag-1')).toBe(100);
  });

  test('returns a number between 0 and 99 for valid inputs', () => {
    const bucket = calculateRolloutBucket('user-123', 'flag-1');
    expect(typeof bucket).toBe('number');
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThan(100);
  });

  test('is deterministic for the same user and flag IDs', () => {
    const first = calculateRolloutBucket('user-456', 'flag-abc');
    const second = calculateRolloutBucket('user-456', 'flag-abc');
    expect(first).toBe(second);
  });

  test('changes when the flag ID changes for the same user', () => {
    const first = calculateRolloutBucket('user-456', 'flag-abc');
    const second = calculateRolloutBucket('user-456', 'flag-def');
    expect(first).not.toBe(second);
  });

  test('changes when the user ID changes for the same flag', () => {
    const first = calculateRolloutBucket('user-456', 'flag-abc');
    const second = calculateRolloutBucket('user-789', 'flag-abc');
    expect(first).not.toBe(second);
  });
});
