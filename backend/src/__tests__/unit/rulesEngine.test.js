import { evaluateRules } from '../../modules/sdk/rulesEngine.js';

describe('evaluateRules()', () => {

  describe('No Rules', () => {
    test('returns TRUE when rules array is empty', () => {
      const context = { userId: 'user-1', city: 'Mumbai' };
      expect(evaluateRules(context, [], 'flag-1')).toBe(true);
    });

    test('returns TRUE when rules is null', () => {
      const context = { userId: 'user-1' };
      expect(evaluateRules(context, null, 'flag-1')).toBe(true);
    });
  });

  describe('EQUALS Operator', () => {
    const rules = [{ attribute: 'city', operator: 'EQUALS', value: 'Mumbai', rollout_percentage: 100 }];

    test('returns TRUE when city matches', () => {
      expect(evaluateRules({ userId: 'u1', city: 'Mumbai' }, rules, 'flag-1')).toBe(true);
    });

    test('returns TRUE for case-insensitive match', () => {
      expect(evaluateRules({ userId: 'u1', city: 'mumbai' }, rules, 'flag-1')).toBe(true);
    });

    test('returns FALSE when city does not match', () => {
      expect(evaluateRules({ userId: 'u1', city: 'Delhi' }, rules, 'flag-1')).toBe(false);
    });

    test('returns FALSE when attribute is missing', () => {
      expect(evaluateRules({ userId: 'u1' }, rules, 'flag-1')).toBe(false);
    });
  });

  describe('CONTAINS Operator', () => {
    const rules = [{ attribute: 'plan', operator: 'CONTAINS', value: 'premium', rollout_percentage: 100 }];

    test('returns TRUE when plan contains premium', () => {
      expect(evaluateRules({ userId: 'u1', plan: 'enterprise-premium' }, rules, 'flag-1')).toBe(true);
    });

    test('returns FALSE when plan does not contain premium', () => {
      expect(evaluateRules({ userId: 'u1', plan: 'free' }, rules, 'flag-1')).toBe(false);
    });
  });

  describe('Rollout Percentage', () => {
    test('returns FALSE for 0% rollout', () => {
      const rules = [{ attribute: 'city', operator: 'EQUALS', value: 'Mumbai', rollout_percentage: 0 }];
      expect(evaluateRules({ userId: 'u1', city: 'Mumbai' }, rules, 'flag-1')).toBe(false);
    });

    test('returns consistent result for same user', () => {
      const rules = [{ attribute: 'city', operator: 'EQUALS', value: 'Mumbai', rollout_percentage: 50 }];
      const context = { userId: 'stable-user-123', city: 'Mumbai' };
      const r1 = evaluateRules(context, rules, 'flag-abc');
      const r2 = evaluateRules(context, rules, 'flag-abc');
      expect(r1).toBe(r2);
    });
  });

});