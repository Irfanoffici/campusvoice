import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AccessLog } from '../types';



export const TrafficVisualizer = () => {
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            // Note: In a serverless environment with direct client-side Supabase usage, 
            // "traffic logs" usually require a middleware or edge function to populate 'access_logs'.
            // If that's not set up, this might return empty.
            // As a fallback to avoid errors, we check if the table exists first implicitly by try/catch.

            const { data, error } = await supabase
                .from('access_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                // If the table doesn't exist or we can't read it, just show empty
                console.log('Access logs unavailable or empty');
            } else {
                setLogs(data || []);
            }
        } catch (err) {
            console.error('Error fetching traffic logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 3000); // Live update every 3s
        return () => clearInterval(interval);
    }, []);

    const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);

    // Color code status
    const getStatusColor = (code: number) => {
        if (code >= 500) return '#ef4444'; // Red
        if (code >= 400) return '#eab308'; // Yellow
        if (code >= 300) return '#3b82f6'; // Blue
        return '#10b981'; // Green
    };

    if (loading && logs.length === 0) return <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>Loading Network Data...</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                display: 'flex', flexDirection: 'column', gap: '20px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '20px', maxHeight: '600px', overflowY: 'auto'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={20} color="#3b82f6" /> Global Network Traffic
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>LIVE FEED</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {logs.map((log) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 100px 1fr 80px 100px',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(255,255,255,0.02)',
                            padding: '12px',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${getStatusColor(log.status_code)}`,
                            fontFamily: 'monospace',
                            fontSize: '0.85rem'
                        }}
                    >
                        {/* Time */}
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>

                        {/* Method */}
                        <span style={{
                            color: log.method === 'GET' ? '#3b82f6' : log.method === 'POST' ? '#10b981' : log.method === 'DELETE' ? '#ef4444' : '#fff',
                            fontWeight: 600
                        }}>
                            {log.method}
                        </span>

                        {/* Path */}
                        <span style={{ color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {log.path}
                        </span>

                        {/* Status */}
                        <span style={{
                            color: getStatusColor(log.status_code),
                            fontWeight: 700
                        }}>
                            {log.status_code}
                        </span>

                        {/* IP / Duration */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{log.ip_address?.replace('::ffff:', '') || 'Unknown'}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>{log.duration_ms}ms</span>
                        </div>
                        <button
                            onClick={() => setSelectedLog(log)}
                            style={{
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                                borderRadius: '6px', cursor: 'pointer', padding: '4px 8px', fontSize: '0.7rem'
                            }}
                        >
                            Inspect
                        </button>
                    </motion.div>
                ))}
            </div>

            {selectedLog && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '800px',
                        maxHeight: '80vh', overflowY: 'auto', position: 'relative'
                    }}>
                        <button
                            onClick={() => setSelectedLog(null)}
                            style={{
                                position: 'absolute', top: '20px', right: '20px',
                                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer'
                            }}
                        >
                            <Activity size={20} style={{ transform: 'rotate(45deg)' }} /> Close
                        </button>

                        <h2 style={{ color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Activity size={24} color="#3b82f6" /> Flight Recorder Data
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                                <h4 style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Request Details</h4>
                                <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                    <div>Method: <span style={{ color: '#3b82f6' }}>{selectedLog.method}</span></div>
                                    <div>Path: {selectedLog.path}</div>
                                    <div>IP: {selectedLog.ip_address}</div>
                                    <div>Status: <span style={{ color: getStatusColor(selectedLog.status_code) }}>{selectedLog.status_code}</span></div>
                                    <div>Latency: {selectedLog.duration_ms}ms</div>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                                <h4 style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Client Info</h4>
                                <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                    <div>User Agent:</div>
                                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{selectedLog.user_agent}</div>
                                </div>
                            </div>
                        </div>

                        {selectedLog.metadata && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Metadata / Payload</h4>
                                <pre style={{
                                    background: '#000', padding: '15px', borderRadius: '12px',
                                    color: '#10b981', overflowX: 'auto', fontSize: '0.85rem'
                                }}>
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                </pre>
                            </div>
                        )}

                        {(selectedLog as any).request_body && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Request Body</h4>
                                <pre style={{
                                    background: '#000', padding: '15px', borderRadius: '12px',
                                    color: '#eab308', overflowX: 'auto', fontSize: '0.85rem'
                                }}>
                                    {JSON.stringify((selectedLog as any).request_body, null, 2)}
                                </pre>
                            </div>
                        )}

                        {(selectedLog as any).headers && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Headers</h4>
                                <pre style={{
                                    background: '#000', padding: '15px', borderRadius: '12px',
                                    color: '#3b82f6', overflowX: 'auto', fontSize: '0.85rem'
                                }}>
                                    {JSON.stringify((selectedLog as any).headers, null, 2)}
                                </pre>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </motion.div>
    );
};
