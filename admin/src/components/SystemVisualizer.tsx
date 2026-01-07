import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Server, Cpu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { SystemHealth } from '../types';

const API_BASE = 'http://localhost:3000/api';

export const SystemVisualizer = () => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE}/admin/system-health`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setHealth(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 5000); // 5s Polling
        return () => clearInterval(interval);
    }, []);

    if (loading || !health) return <div>Initializing Metrics...</div>;

    const formatBytes = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

            {/* Server Status */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '20px', padding: '24px'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#10b981' }}>
                    <Server size={24} /> <h3 style={{ margin: 0 }}>System Status</h3>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    {health.status}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                    Uptime: {formatUptime(health.uptime)}
                </div>
            </motion.div>

            {/* Memory Usage */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '20px', padding: '24px'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#3b82f6' }}>
                    <Cpu size={24} /> <h3 style={{ margin: 0 }}>Memory Load</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>RSS (Resident)</span>
                    <span style={{ color: '#fff' }}>{formatBytes(health.memory.rss)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Heap Used</span>
                    <span style={{ color: '#fff' }}>{formatBytes(health.memory.heapUsed)}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '15px' }}>
                    <div style={{
                        width: `${(health.memory.heapUsed / health.memory.heapTotal) * 100}%`,
                        height: '100%',
                        background: '#3b82f6',
                        borderRadius: '2px'
                    }} />
                </div>
            </motion.div>

            {/* Database Metrics */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'rgba(168, 85, 247, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '20px', padding: '24px'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#a855f7' }}>
                    <Database size={24} /> <h3 style={{ margin: 0 }}>Database Entities</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Total Feedback</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{health.counts.feedback}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Admins</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{health.counts.admins}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Audit Logs</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{health.counts.logs}</span>
                </div>
            </motion.div>

        </div>
    );
};
