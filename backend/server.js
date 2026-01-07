const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Config
const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("WARNING: Missing Supabase Env Vars!");
}

// Initialize Supabase (Global / Anon Access)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Middlewares (MUST BE FIRST) ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors()); // Allow All Origins
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// SERVICE ROLE CLIENT (For Admin Actions like Logging that shouldn't fail due to User RLS)
// Ideally reuse SUPABASE_KEY if it was service role, but typically it's anon. 
// Since we don't have the Service Key in the code (it was anon), we will try to use the `supabase` client
// but we MUST ensure `access_logs` allows INSERT from anon/authenticated if we don't have service key.
// UPDATE: User provided only one key. We assume it's ANON.
// So we must add RLS policy for INSERT to access_logs for 'anon' and 'authenticated' roles.
// Or we just disable RLS on access_logs (Risky? No, just logs). 
// Let's rely on the middleware using `supabase` (Anon) to log.

// --- Traffic Surveillance Middleware ---
app.use(async (req, res, next) => {
    const start = Date.now();

    // Capture response finish
    res.on('finish', async () => {
        const duration = Date.now() - start;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Skip internal/high-frequency polling from logging to reduce noise
        if (req.path.includes('/api/admin/traffic') || req.path.includes('/api/admin/system-health')) {
            return;
        }

        // Sanitize Body (Remove Passwords)
        let body = { ...req.body };
        if (body.password) body.password = '***REDACTED***';

        // Filter Headers
        const headers = {
            referer: req.headers['referer'],
            origin: req.headers['origin'],
            host: req.headers['host'],
            'content-type': req.headers['content-type']
        };

        try {
            // Log to DB (Fire & Forget)
            await supabase.from('access_logs').insert({
                ip_address: ip,
                method: req.method,
                path: req.path,
                status_code: res.statusCode,
                duration_ms: duration,
                user_agent: req.headers['user-agent'],
                metadata: req.user ? { user_id: req.user.id, role: req.user.role } : null,
                request_body: Object.keys(body).length ? body : null,
                query_params: Object.keys(req.query).length ? req.query : null,
                headers: headers
            });
        } catch (err) {
            // Silet fail to not crash request
            console.error('Log Error:', err.message);
        }
    });
    next();
});



// --- Auth Middleware ---

/**
 * Creates a Supabase client scoped to the user's JWT.
 * Used for Protected/Admin routes.
 */
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create a scoped client for this user
    const scopedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });

    // Verify the user
    const { data: { user }, error } = await scopedClient.auth.getUser();

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // STRICT APPROVAL CHECK
    // We must query the 'admins' table to see if this user is approved.
    const { data: adminData, error: adminError } = await scopedClient
        .from('admins')
        .select('approved, role')
        .eq('id', user.id)
        .single();

    // If strict RLS hides the row, adminData might be null. 
    // We assume RLS allows users to read their OWN 'admins' row.
    if (adminError || !adminData || !adminData.approved) {
        return res.status(403).json({ error: 'Account Pending Approval. Contact Superadmin.' });
    }

    // Attach to request
    req.supabase = scopedClient;
    req.user = { ...user, ...adminData }; // Attach role and approved status
    next();
};

// --- Helpers ---
// Helper to calculate minimal diff (Delta)
const getDiff = (oldObj, newObj) => {
    const changes = {};
    Object.keys(newObj).forEach(key => {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            changes[key] = { from: oldObj[key], to: newObj[key] };
        }
    });
    return Object.keys(changes).length > 0 ? changes : null;
};

const logAdminAction = async (supabase, adminId, action, details, req, diff = null) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await supabase.from('admin_logs').insert({
            admin_id: adminId,
            action,
            details,
            ip_address: ip,
            changes: diff
        });
    } catch (err) {
        console.error('Logging failed:', err);
    }
};

// --- RBAC Middleware ---
const ROLE_HIERARCHY = { 'superadmin': 3, 'admin': 2, 'resolver': 1 };

const requireRole = (minRole) => async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Auth required' });

    // Fetch fresh role from DB (Safety)
    const { data, error } = await req.supabase
        .from('admins')
        .select('role')
        .eq('id', req.user.id)
        .single();

    if (error || !data) return res.status(403).json({ error: 'Access denied' });

    const userRoleLevel = ROLE_HIERARCHY[data.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userRoleLevel < requiredLevel) {
        return res.status(403).json({ error: `Insufficient permissions. Required: ${minRole.toUpperCase()}` });
    }
    req.user.role = data.role; // Update permission
    next();
};

// Shortcuts
const requireSuperAdmin = requireRole('superadmin');
const requireAdmin = requireRole('admin');
const requireResolver = requireRole('resolver');

// ... existing routes ...

// 15. System Health (God Mode Metrics)
app.get('/api/admin/system-health', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const uptime = process.uptime();
        const memory = process.memoryUsage();

        // Parallel DB counts
        const [feedback, admins, logs] = await Promise.all([
            req.supabase.from('feedback').select('*', { count: 'exact', head: true }),
            req.supabase.from('admins').select('*', { count: 'exact', head: true }),
            req.supabase.from('admin_logs').select('*', { count: 'exact', head: true })
        ]);

        res.json({
            uptime,
            memory,
            counts: {
                feedback: feedback.count || 0,
                admins: admins.count || 0,
                logs: logs.count || 0
            },
            status: 'OPERATIONAL',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 16. Full Edit Feedback (God Mode)
app.patch('/api/admin/feedback/:id/details', requireAuth, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { message, category, priority } = req.body;

    // Fetch OLD data for diff
    const { data: oldData, error: fetchError } = await req.supabase
        .from('feedback')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) return res.status(404).json({ error: 'Feedback not found' });

    // Update
    const { data: newData, error: updateError } = await req.supabase
        .from('feedback')
        .update({ message, category, priority })
        .eq('id', id)
        .select()
        .single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    // Calculate Diff
    const diff = getDiff(oldData, newData);

    await logAdminAction(
        req.supabase,
        req.user.id,
        'EDIT_FEEDBACK',
        `Modified feedback ${id}`,
        req,
        diff // Pass the diff
    );

    res.json({ success: true, data: newData });
});

// --- Routes ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', system: 'Supabase Powered' });
});

// 1. Submit Feedback (Anonymous)
app.post('/api/feedback', async (req, res) => {
    const { category, message, priority = 'medium' } = req.body;

    if (!category || !message) {
        return res.status(400).json({ error: 'Category and message are required' });
    }

    // Use global anon client
    const { error } = await supabase
        .from('feedback')
        .insert([{ category, message, priority }]);

    if (error) {
        console.error('Supabase Error:', error);
        return res.status(500).json({ error: 'Submission failed' });
    }

    res.json({ success: true, message: 'Feedback submitted anonymously' });
});

// 2. Stats (Protected - RLS will handle visibility)
app.get('/api/stats', requireAuth, async (req, res) => {
    // We execute separate queries using the scoped client.
    // Use Promise.all for speed.
    const client = req.supabase;

    try {
        const [totalRes, catRes, priRes, recentRes] = await Promise.all([
            // Total
            client.from('feedback').select('*', { count: 'exact', head: true }),
            // By Category (Client-side aggregation or raw fetch)
            // Note: Postgres GROUP BY via Supabase JS is tricky. 
            // For now, we fetch basic stats or use RPC if defined.
            // Simpler: Fetch all id/category and aggregate in JS (Not scalable but fine for MVP)
            client.from('feedback').select('category'),
            // By Priority
            client.from('feedback').select('priority'),
            // Recent
            client.from('feedback').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        if (totalRes.error) throw totalRes.error;

        // Custom Aggregation (Safely handle null data)
        const byCategory = (catRes.data || []).reduce((acc, curr) => {
            const found = acc.find(c => c.category === curr.category);
            if (found) found.count++;
            else acc.push({ category: curr.category, count: 1 });
            return acc;
        }, []);

        const byPriority = (priRes.data || []).reduce((acc, curr) => {
            const found = acc.find(p => p.priority === curr.priority);
            if (found) found.count++;
            else acc.push({ priority: curr.priority, count: 1 });
            return acc;
        }, []);

        res.json({
            total: totalRes.count || 0,
            byCategory,
            byPriority,
            recent: recentRes.data || []
        });

    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// 3. Admin: Get Feedback
app.get('/api/admin/feedback', requireAuth, async (req, res) => {
    const { category, status, page = 1, limit = 50, deletion_status } = req.query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = req.supabase
        .from('feedback')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (category && category !== 'all') query = query.eq('category', category);
    if (status && status !== 'all') query = query.eq('status', status);

    // Soft Delete Filtering
    if (deletion_status === 'pending') {
        // View Trash (Superadmin Only ideally, but RLS protects if strict)
        // Actually RLS for SELECT is broad for approved admins. 
        // But let's filter here.
        query = query.eq('deletion_requested', true);
    } else {
        // Default View: Hide Trash
        query = query.eq('deletion_requested', false);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error('Supabase Admin Fetch Error:', error);
        return res.status(500).json({ error: error.message });
    }

    res.json({
        feedback: data || [],
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
        }
    });
});

// 3.5. Admin: Edit Feedback (Admin+)
// (Existing edit logic...)

// 4. Admin: Update Status (...)

// 5. Admin: Delete Single (Smart Delete)
app.delete('/api/admin/feedback/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;

    // Check if user is Superadmin
    const isSuper = req.user.role === 'superadmin';

    // 1. Fetch current state to check if already pending
    const { data: item } = await req.supabase.from('feedback').select('deletion_requested').eq('id', id).single();

    if (isSuper) {
        // SUPERADMIN BEHAVIOR:
        // If it's already in Trash (deletion_requested=true) OR they want to force delete?
        // Let's say Superadmin deletes PERMANENTLY always? 
        // Or if it's not in trash, move to trash?
        // User said: "SuperAdmin is GOD". This implies force.
        // But for workflow: Admin -> Request. Super -> Approve (which is delete).
        // If Superadmin is browsing Main View and clicks delete, maybe they expect it to be gone.

        // Let's implement: Superadmin always HARD DELETES.
        const { error } = await req.supabase.from('feedback').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        await logAdminAction(req.supabase, req.user.id, 'DELETE_PERMANENT', `Superadmin nuked feedback ${id}`, req);
        return res.json({ success: true, message: 'Permanently deleted.' });
    } else {
        // ADMIN BEHAVIOR:
        // Soft Delete (Request Deletion)
        const { error } = await req.supabase
            .from('feedback')
            .update({ deletion_requested: true, deletion_requested_by: req.user.id })
            .eq('id', id);

        if (error) return res.status(500).json({ error: error.message });
        await logAdminAction(req.supabase, req.user.id, 'DELETE_REQUEST', `Requested deletion for ${id}`, req);
        return res.json({ success: true, message: 'Moved to Trash (Pending Approval).' });
    }
});

// 5.5. Superadmin: Restore (Undo Delete)
app.post('/api/admin/feedback/:id/restore', requireAuth, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;

    const { error } = await req.supabase
        .from('feedback')
        .update({ deletion_requested: false, deletion_requested_by: null })
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    await logAdminAction(req.supabase, req.user.id, 'RESTORE_FEEDBACK', `Restored feedback ${id}`, req);
    res.json({ success: true, message: 'Feedback restored.' });
});

// 6. Admin: Purge Resolved (Batch Delete)
app.delete('/api/admin/feedback/resolved', requireAuth, async (req, res) => {
    const { error } = await req.supabase
        .from('feedback')
        .delete()
        .eq('status', 'resolved');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: 'Resolved items purged' });
});

// 7. Admin: Purge All


// ... existing routes ...

// 7. Admin: Purge All
app.delete('/api/admin/feedback', requireAuth, async (req, res) => {
    const { error } = await req.supabase
        .from('feedback')
        .delete()
        .neq('id', 0);

    if (error) return res.status(500).json({ error: error.message });

    // Log it
    await logAdminAction(req.supabase, req.user.id, 'PURGE_ALL', 'Deleted all feedback', req);

    res.json({ success: true, message: 'All items purged' });
});

// --- Superadmin Routes ---

// 8. List Personnel (Admins)
app.get('/api/admin/users', requireAuth, requireSuperAdmin, async (req, res) => {
    const { data, error } = await req.supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 9. Approve/Revoke Admin
app.patch('/api/admin/users/:id', requireAuth, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { approved } = req.body; // true or false

    const { data, error } = await req.supabase
        .from('admins')
        .update({ approved })
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    await logAdminAction(
        req.supabase,
        req.user.id,
        approved ? 'APPROVE_ADMIN' : 'REVOKE_ADMIN',
        `Target: ${data.email}`,
        req
    );

    res.json({ success: true, user: data });
});

// 10. System Logs
app.get('/api/admin/logs', requireAuth, requireSuperAdmin, async (req, res) => {
    const { data, error } = await req.supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});




// 11. Delete Admin (Destructive) - PROTECTED
app.delete('/api/admin/users/:id', requireAuth, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const MASTER_EMAIL = process.env.MASTER_ADMIN_EMAIL;

    // 1. Check if target is the Master Admin
    const { data: targetUser, error: fetchError } = await req.supabase
        .from('admins')
        .select('email')
        .eq('id', id)
        .single();

    if (fetchError) return res.status(404).json({ error: 'User not found' });

    if (targetUser.email === MASTER_EMAIL) {
        return res.status(403).json({ error: 'HERESY: You cannot delete the Creator.' });
    }

    // 2. Prevent Self-Deletion (Optional, but good practice)
    if (id === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete yourself.' });
    }

    // 3. Delete from public table
    const { error: dbError } = await req.supabase
        .from('admins')
        .delete()
        .eq('id', id);

    if (dbError) return res.status(500).json({ error: dbError.message });

    // 4. Delete from Auth (requires Service Role usually, but here we only have client)
    // NOTE: Without Service Role Key, we cannot delete from auth.users via API.
    // We can only remove their Admin access (which we just did).

    await logAdminAction(req.supabase, req.user.id, 'DELETE_USER', `Deleted admin ${targetUser.email}`, req);
    res.json({ success: true });
});

// 13. Change Role (Superadmin Only)
app.patch('/api/admin/users/:id/role', requireAuth, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const MASTER_EMAIL = process.env.MASTER_ADMIN_EMAIL;

    if (!['resolver', 'admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
    }

    // 1. Fetch Target
    const { data: targetUser } = await req.supabase
        .from('admins')
        .select('email')
        .eq('id', id)
        .single();

    if (targetUser && targetUser.email === MASTER_EMAIL) {
        return res.status(403).json({ error: 'HERESY: You cannot change the Creator\'s role.' });
    }

    const { error } = await req.supabase
        .from('admins')
        .update({ role })
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    await logAdminAction(req.supabase, req.user.id, 'UPDATE_ROLE', `Changed ${targetUser?.email} role to ${role}`, req);
    res.json({ success: true });
});

// 12. Pre-Authorize / Invite (Superadmin Only)
app.post('/api/admin/invite', requireAuth, requireSuperAdmin, async (req, res) => {
    const { email, role = 'resolver' } = req.body;

    // Add to Whitelist with Role
    const { error } = await req.supabase
        .from('invited_emails')
        .insert([{ email, role, invited_by: req.user.id }]);

    if (error) return res.status(500).json({ error: error.message });

    await logAdminAction(req.supabase, req.user.id, 'INVITE_USER', `Whitelisted ${email} as ${role}`, req);
    res.json({ success: true, message: `User whitelisted as ${role.toUpperCase()}.` });
});

// 14. Manual User Creation (Proxy Signup)
app.post('/api/admin/users/create', requireAuth, requireSuperAdmin, async (req, res) => {
    const { email, password, role = 'resolver' } = req.body;

    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Invalid email or password (min 6 chars)' });
    }

    // 1. Whitelist first (so Trigger approves them)
    const { error: inviteError } = await req.supabase
        .from('invited_emails')
        .insert([{ email, role, invited_by: req.user.id }])
        .select()
        .single();

    // Ignore duplicate key error (if already invited/whitelisted, just proceed to signup)
    if (inviteError && !inviteError.message.includes('duplicate key')) {
        return res.status(500).json({ error: `Whitelist failed: ${inviteError.message}` });
    }

    // 2. Create Temp Client for Signup (Avoids session collision)
    const tempClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 3. Perform Signup
    const { data, error: signupError } = await tempClient.auth.signUp({
        email,
        password
    });

    if (signupError) return res.status(400).json({ error: signupError.message });

    // 4. Verification Check
    // If "Confirm Email" is disabled in Supabase, they are active.
    // The Database Trigger 'handle_new_user' will catch the INSERT into auth.users,
    // look up the email in 'invited_emails', finding the ROLE, and insert into 'admins' with approved=TRUE.

    await logAdminAction(req.supabase, req.user.id, 'CREATE_USER', `Manually created user ${email} (${role})`, req);

    res.json({ success: true, user: data.user, message: 'User created and auto-approved.' });
});

// 15. Diagnose (Health Check)
app.get('/api/admin/diagnose', async (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 12b. Get Traffic Logs
app.get('/api/admin/traffic', requireAuth, requireSuperAdmin, async (req, res) => {
    const { limit = 100 } = req.query;
    const { data, error } = await req.supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 13. Flush Logs (Nuclear)
app.delete('/api/admin/logs', requireAuth, requireSuperAdmin, async (req, res) => {
    const { error } = await req.supabase
        .from('admin_logs')
        .delete()
        .neq('id', 0); // Delete all

    if (error) return res.status(500).json({ error: error.message });

    // Log the flush (It will be the only log entry after flush, or maybe inserted after delete finishes)
    await logAdminAction(req.supabase, req.user.id, 'FLUSH_LOGS', 'Wiped all system logs', req);

    res.json({ success: true, message: 'Logs flushed' });
});

// 14. Manual Feedback Entry (God Mode)
app.post('/api/admin/feedback', requireAuth, requireSuperAdmin, async (req, res) => {
    const { category, message, priority, status } = req.body;

    // Use admin client (req.supabase) so RLS allows insert if policy permits (or we use service role... wait RLS allows anon insert, so admin insert is fine too)
    const { data, error } = await req.supabase
        .from('feedback')
        .insert([{
            category,
            message,
            priority: priority || 'medium',
            status: status || 'new'
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    await logAdminAction(req.supabase, req.user.id, 'MANUAL_CREATE_FEEDBACK', `Created feedback ${data.id}`, req);

    res.json(data);
});

// Serve Admin (Must be last)
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/dist/index.html'));
});

// Serve Frontend Fallback (Must be very last)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        // If API route not found, return JSON 404 instead of HTML
        return res.status(404).json({ error: 'API Endpoint Not Found' });
    }
    if (req.path.startsWith('/admin')) {
        res.sendFile(path.join(__dirname, '../admin/dist/index.html'));
    } else {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Supabase-Connected Server running on port ${PORT}`);
});