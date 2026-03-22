import { queue } from '../../config/queue.js';
import { redis } from '../../config/redis.js';
import { supabase } from '../../config/supabase.js';
import { sendEmailNotification } from '../../shared/utils/mailer.js';
import { broadcastFlagUpdate } from "../../shared/utils/realtime.js";

export const createFlag = async (req, res) => {
    try {
        const { projectId, name, description } = req.body;

        if (!projectId || !name?.trim()) {
            return res.status(400).json({ error: 'Project ID and Flag name are required.' });
        }

        const { data, error } = await supabase
            .from('feature_flags')
            .insert([{ project_id: projectId, name: name.trim(), description }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Feature flag created successfully', data });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to create flag.' });
    }
};

export const getFlagsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const { data, error } = await supabase
            .from('feature_flags')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch flags.' });
    }
};

export const toggleFlag = async (req, res) => {
    try {
        const { flagId } = req.params;
        const userId = req.user.id;

        const { data: currentFlag, error: fetchError } = await supabase
            .from('feature_flags')
            .select('*')
            .eq('id', flagId)
            .single();

        if (fetchError || !currentFlag) {
            return res.status(404).json({ error: 'Feature flag not found.' });
        }

        const newState = !currentFlag.status;
        const actionText = newState ? 'TOGGLED_ON' : 'TOGGLED_OFF';

        const { data: updatedFlag, error: updateError } = await supabase
            .from('feature_flags')
            .update({ status: newState, updated_at: new Date().toISOString() })
            .eq('id', flagId)
            .select()
            .single();

        if (updateError) throw updateError;

        const cacheKey = `project_flags_rules:${currentFlag.project_id}`;
        await redis.del(cacheKey);

        await broadcastFlagUpdate(currentFlag.project_id);

        // FIX: Audit log failure now returns error instead of failing silently
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert([{
                flag_id: flagId,
                user_id: userId,
                action: actionText,
                previous_state: { status: currentFlag.status },
                new_state: { status: newState }
            }]);

        if (auditError) {
            console.error('Audit Log Error:', auditError);
            return res.status(500).json({ error: 'Flag toggled but audit log failed. Please contact support.' });
        }

        const userEmail = req.user.email;
        await sendEmailNotification(
            userEmail,
            `Flag Toggled: ${currentFlag.name}`,
            `<p>Your feature flag <strong>${currentFlag.name}</strong> was manually toggled to <strong>${newState ? 'ON' : 'OFF'}</strong>.</p>`
        );

        res.status(200).json({ message: `Flag ${actionText}`, updatedFlag });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to toggle flag.' });
    }
};

export const addTargetingRule = async (req, res) => {
    try {
        const { flagId } = req.params;
        const { attribute, operator, value, rolloutPercentage } = req.body;

        const { data: flag, error: flagError } = await supabase
            .from('feature_flags')
            .select('project_id')
            .eq('id', flagId)
            .single();

        if (flagError || !flag) {
            return res.status(404).json({ error: 'Feature flag not found.' });
        }

        const { data: rule, error: ruleError } = await supabase
            .from('targeting_rules')
            .insert([{
                flag_id: flagId,
                attribute,
                operator,
                value,
                rollout_percentage: rolloutPercentage !== undefined ? rolloutPercentage : 100
            }])
            .select()
            .single();

        if (ruleError) throw ruleError;

        const cacheKey = `project_flags_rules:${flag.project_id}`;
        await redis.del(cacheKey);

        await broadcastFlagUpdate(flag.project_id);

        res.status(201).json({ message: 'Targeting rule added successfully', data: rule });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to add targeting rule.' });
    }
};

export const removeTargetingRule = async (req, res) => {
    try {
        const { flagId, ruleId } = req.params;

        const { data: flag, error: flagError } = await supabase
            .from('feature_flags')
            .select('project_id')
            .eq('id', flagId)
            .single();

        if (flagError || !flag) return res.status(404).json({ error: 'Flag not found.' });

        const { error: deleteError } = await supabase
            .from('targeting_rules')
            .delete()
            .match({ id: ruleId, flag_id: flagId });

        if (deleteError) throw deleteError;

        const cacheKey = `project_flags_rules:${flag.project_id}`;
        await redis.del(cacheKey);

        await broadcastFlagUpdate(flag.project_id);

        res.status(200).json({ message: 'Targeting rule removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to remove targeting rule.' });
    }
};

export const rollbackFlag = async (req, res) => {
    try {
        const { flagId } = req.params;
        const userId = req.user.id;

        const { data: latestLog, error: logError } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('flag_id', flagId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (logError || !latestLog) {
            return res.status(404).json({ error: 'No audit history found to rollback.' });
        }

        if (!latestLog.previous_state || latestLog.previous_state.status === undefined) {
            return res.status(400).json({ error: 'Cannot rollback: previous state is unknown.' });
        }

        const targetStatus = latestLog.previous_state.status;

        const { data: flag, error: flagError } = await supabase
            .from('feature_flags')
            .select('project_id, status')
            .eq('id', flagId)
            .single();

        if (flagError || !flag) return res.status(404).json({ error: 'Flag not found.' });

        if (flag.status === targetStatus) {
            return res.status(400).json({ message: 'Flag is already in the target state.' });
        }

        const { data: updatedFlag, error: updateError } = await supabase
            .from('feature_flags')
            .update({ status: targetStatus, updated_at: new Date().toISOString() })
            .eq('id', flagId)
            .select()
            .single();

        if (updateError) throw updateError;

        await supabase.from('audit_logs').insert([{
            flag_id: flagId,
            user_id: userId,
            action: 'ROLLBACK',
            previous_state: { status: flag.status },
            new_state: { status: targetStatus }
        }]);

        const cacheKey = `project_flags_rules:${flag.project_id}`;
        await redis.del(cacheKey);
        await broadcastFlagUpdate(flag.project_id);

        const userEmail = req.user.email;
        await sendEmailNotification(
            userEmail,
            `Rollback Performed`,
            `<p>A rollback was performed. A flag was restored to <strong>${targetStatus ? 'ON' : 'OFF'}</strong>.</p>`
        );

        res.status(200).json({ message: 'Rollback successful', data: updatedFlag });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to rollback flag.' });
    }
};

export const scheduleFlagToggle = async (req, res) => {
    try {
        const { flagId } = req.params;
        const { targetStatus, scheduledTime } = req.body;
        const userId = req.user.id;

        if (typeof targetStatus !== 'boolean' || !scheduledTime) {
            return res.status(400).json({ error: 'targetStatus (boolean) and scheduledTime (ISO string) are required.' });
        }

        const date = new Date(scheduledTime);
        if (date <= new Date()) {
            return res.status(400).json({ error: 'Scheduled time must be in the future.' });
        }

        const userEmail = req.user.email;
        const jobId = await queue.send('toggle-flag',
            { flagId, targetStatus, userId, userEmail },
            { startAfter: date }
        );

        res.status(202).json({
            message: `Flag toggle scheduled successfully for ${date.toLocaleString()}`,
            jobId
        });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to schedule flag.' });
    }
};

export const getFlagById = async (req, res) => {
    try {
        const { flagId } = req.params;

        const { data, error } = await supabase
            .from('feature_flags')
            .select(`*, targeting_rules (*)`)
            .eq('id', flagId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Feature flag not found.' });
        }

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch flag details.' });
    }
};

export const getFlagAuditLogs = async (req, res) => {
    try {
        const { flagId } = req.params;

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('flag_id', flagId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch audit logs.' });
    }
};
