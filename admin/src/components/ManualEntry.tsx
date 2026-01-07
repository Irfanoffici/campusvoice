import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, Priority } from '../types';

const API_BASE = 'http://localhost:3000/api';

interface ManualEntryProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const ManualEntry: React.FC<ManualEntryProps> = ({ onClose, onSuccess }) => {
    const [category, setCategory] = useState<Category>('general');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        await fetch(`${API_BASE}/admin/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category, message, priority, status: 'new' })
        });

        setLoading(false);
        onSuccess();
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '90%',
                    position: 'relative'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '20px', right: '20px',
                        background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '20px' }}>Manual Entry</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '8px' }}>TOPIC</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value as Category)}
                            style={{
                                width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'
                            }}
                        >
                            <option value="general">General</option>
                            <option value="teaching">Teaching</option>
                            <option value="facilities">Facilities</option>
                            <option value="safety">Safety</option>
                            <option value="events">Events</option>
                            <option value="administration">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '8px' }}>MESSAGE</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            required
                            rows={4}
                            style={{
                                width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff',
                                resize: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '8px' }}>PRIORITY</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['low', 'medium', 'high', 'critical'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p as Priority)}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                                        borderColor: priority === p ? '#fff' : 'rgba(255,255,255,0.1)',
                                        background: priority === p ? '#fff' : 'transparent',
                                        color: priority === p ? '#000' : 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer', textTransform: 'capitalize'
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '10px',
                            background: '#fff', color: '#000', border: 'none',
                            padding: '14px', borderRadius: '12px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><Plus size={18} /> Create Record</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
