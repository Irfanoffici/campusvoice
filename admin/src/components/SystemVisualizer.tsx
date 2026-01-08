import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Server } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { SystemHealth } from '../types';



export const SystemVisualizer = () => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        try {
            // Check basic connectivity checking a public table or just assuming true if query works
            const { count: feedbackCount, error: fError } = await supabase.from('feedback').select('*', { count: 'exact', head: true });

            // Query the admins table to get the actual count
            const { count: adminsCount } = await supabase.from('admins').select('*', { count: 'exact', head: true });

            // Query admin logs
            const { count: logsCount } = await supabase.from('admin_logs').select('*', { count: 'exact', head: true });

            if (fError) throw fError;

            setHealth({
                status: 'Operational',
                uptime: 0, // Not applicable in serverless
                memory: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 }, // Mocked
                counts: {
                    feedback: feedbackCount || 0,
                    admins: adminsCount || 0,
                    logs: logsCount || 0
                },
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('Health check failed', err);
            setHealth(prev => prev ? { ...prev, status: 'Degraded' } : null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000); // 10s Polling
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div>Initializing Metrics...</div>;
    if (!health) return <div>System Status Unavailable</div>;



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
                    Mode: Serverless / Cloud
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
