import { useEffect, useState } from 'react';
import { Terminal, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AdminLog } from '../types';

const API_BASE = 'http://localhost:3000/api';

export const SystemLogs = () => {
    const [logs, setLogs] = useState<AdminLog[]>([]);

    const fetchLogs = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch(`${API_BASE}/admin/logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setLogs(await res.json());
    };

    useEffect(() => { fetchLogs(); }, []);

    const flushLogs = async () => {
        if (!confirm('WARNING: This will wipe ALL audit logs locally. This cannot be undone.')) return;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        await fetch(`${API_BASE}/admin/logs`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchLogs();
    };

    return (
        <div style={{
            background: '#0a0a0a',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            fontFamily: 'monospace'
        }}>
            <div style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Terminal size={14} /> System Audit Trail
                </div>
                <button
                    onClick={() => flushLogs()}
                    style={{
                        background: 'transparent', border: '1px solid #ef4444', color: '#ef4444',
                        padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem'
                    }}
                >
                    FLUSH LOGS
                </button>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {logs.map((log, i) => (
                    <div key={log.id} style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        display: 'grid',
                        gridTemplateColumns: '140px 140px 1fr 120px',
                        gap: '20px',
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.8)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={12} /> {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                        <span style={{
                            color: log.action.includes('DELETE') || log.action.includes('DESTROY') || log.action.includes('FLUSH') ? '#ef4444' :
                                log.action.includes('APPROVE') ? '#10b981' : '#3b82f6',
                            fontWeight: 600
                        }}>
                            {log.action}
                        </span>
                        <span>{log.details}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>{log.ip_address || 'N/A'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
