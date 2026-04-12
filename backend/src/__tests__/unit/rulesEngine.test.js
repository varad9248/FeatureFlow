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

    test('returns FALSE when userId is missing and rollout is less than 100', () => {
      const rules = [{ attribute: 'city', operator: 'EQUALS', value: 'Mumbai', rollout_percentage: 50 }];
      expect(evaluateRules({ city: 'Mumbai' }, rules, 'flag-1')).toBe(false);
    });

    test('returns TRUE when rollout percentage is 100', () => {
      const rules = [{ attribute: 'city', operator: 'EQUALS', value: 'Mumbai', rollout_percentage: 100 }];
      expect(evaluateRules({ userId: 'u1', city: 'Mumbai' }, rules, 'flag-1')).toBe(true);
    });
  });

  describe('Unsupported and edge case rules', () => {
    test('returns FALSE for unsupported operator', () => {
      const rules = [{ attribute: 'city', operator: 'STARTS_WITH', value: 'Mum' }];
      expect(evaluateRules({ userId: 'u1', city: 'Mumbai' }, rules, 'flag-1')).toBe(false);
    });

    test('skips rule with missing attribute/operator/value and continues evaluation', () => {
      const rules = [
        { attribute: 'city', operator: 'EQUALS', value: 'Mumbai' },
        { attribute: null, operator: null, value: null },
      ];
      expect(evaluateRules({ userId: 'u1', city: 'Mumbai' }, rules, 'flag-1')).toBe(true);
    });

    test('multiple rules require all rules to pass', () => {
      const rules = [
        { attribute: 'city', operator: 'EQUALS', value: 'Mumbai', rollout_percentage: 100 },
        { attribute: 'plan', operator: 'CONTAINS', value: 'premium', rollout_percentage: 100 },
      ];
      expect(evaluateRules({ userId: 'u1', city: 'Mumbai', plan: 'enterprise-premium' }, rules, 'flag-1')).toBe(true);
      expect(evaluateRules({ userId: 'u1', city: 'Mumbai', plan: 'basic' }, rules, 'flag-1')).toBe(false);
    });

    test('multi-rule rollout percentage is applied for all rules', () => {
      const rules = [
        { attribute: 'city', operator: 'EQUALS', value: 'Mumbai', rollout_percentage: 50 },
        { attribute: 'plan', operator: 'CONTAINS', value: 'premium', rollout_percentage: 50 },
      ];
      const context = { userId: 'stable-user-456', city: 'Mumbai', plan: 'premium-plus' };
      const result = evaluateRules(context, rules, 'flag-2');
      expect(typeof result).toBe('boolean');
    });
  });

});