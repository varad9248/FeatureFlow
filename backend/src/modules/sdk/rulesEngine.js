import { calculateRolloutBucket } from '../../shared/utils/hash.js';

/**
 * Evaluates a user's context against a set of targeting rules for a specific flag.
 * @function evaluateRules
 * @param {Object} context - The user context
 * @param {Array} rules - An array of rule objects
 * @param {string} flagId - The ID of the flag being evaluated
 * @returns {boolean} True if the user passes all rules
 */
export const evaluateRules = (context, rules, flagId) => {
    if (!rules || rules.length === 0) {
        return true;
    }

    // Check attribute matching - ALL rules must pass
    const passesAttributes = rules.every(rule => {
        if (!rule.attribute || !rule.operator || !rule.value) return true;

        const userValue = context[rule.attribute];
        if (!userValue) return false;

        switch (rule.operator.toUpperCase()) {
            case 'EQUALS':
                return String(userValue).toLowerCase() === String(rule.value).toLowerCase();
            case 'CONTAINS':
                return String(userValue).toLowerCase().includes(String(rule.value).toLowerCase());
            default:
                return false;
        }
    });

    if (!passesAttributes) return false;

    // FIX: Check rollout percentage for EACH rule, not just rules[0]
    // A user must pass ALL rules' rollout percentages
    const failsRollout = rules.some(rule => {
        const rolloutTarget = rule.rollout_percentage;

        if (rolloutTarget !== undefined && rolloutTarget < 100) {
            if (!context.userId) return true;
            const userBucket = calculateRolloutBucket(context.userId, flagId);
            return userBucket >= rolloutTarget;
        }
        return false;
    });

    return !failsRollout;
};