import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, Key, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // New Toggle
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isLogin) {
                // LOGIN
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
            } else {
                // SIGNUP
                // Check whitelist first (optional, as backend trigger is best, but we can do client hint)
                // Actually, backend 'requireAuth' checks 'admins.approved'.
                // If we want Auto-Approve, we need a Database Trigger or Edge Function.
                // OR: Superadmin adds to 'admins' table with approved=true FIRST (Pre-provision).
                // If we rely on 'invited_emails', we need a trigger to copy to 'admins' on signup.
                // FOR NOW: We just sign them up. The user must manually approve or we rely on them being in 'admins' if we implemented that.
                // WAIT: My 'invite' endpoint just adds to 'invited_emails'.
                // I need a DB Trigger to auto-approve if email is in invited_emails.
                // I will add that to the SQL script.

                const { error } = await supabase.auth.signUp({
                    email,
                    password
                });
                if (error) throw error;

                // If whitelisted, they might be auto-approved by trigger (once I add it).
                setMessage('Access requested! If you were invited, you can log in immediately.');
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async () => {
        if (!email) {
            setError('Please enter your email first.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:5173/admin/update-password',
            });
            if (error) throw error;
            setMessage('Password reset link sent to your email.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            width: '100%'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '40px',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}
            >
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto'
                }}>
                    <Lock color="#fff" size={24} />
                </div>

                <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '8px' }}>
                    {isLogin ? 'Command Deck' : 'Request Access'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '30px' }}>
                    {isLogin ? 'Authenticate to proceed' : 'Create admin credentials'}
                </p>

                {message && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        marginBottom: '20px'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail
                            size={18}
                            color="rgba(255,255,255,0.3)"
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="email"
                            placeholder="admin@mec.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '12px 12px 12px 48px',
                                borderRadius: '12px',
                                color: '#fff',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Key
                            size={18}
                            color="rgba(255,255,255,0.3)"
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '12px 12px 12px 48px',
                                borderRadius: '12px',
                                color: '#fff',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                                padding: 0, display: 'flex'
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {isLogin && (
                        <div style={{ textAlign: 'right' }}>
                            <button
                                type="button"
                                onClick={handleForgot}
                                style={{
                                    background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem',
                                    cursor: 'pointer', padding: 0
                                }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    {error && (
                        <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'left' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: loading ? 0.7 : 1,
                            marginTop: '10px'
                        }}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Processing...' : (isLogin ? 'Unlock System' : 'Submit Request')}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '0.85rem',
                        marginTop: '20px',
                        cursor: 'pointer'
                    }}
                >
                    {isLogin ? "Need access? Request ID" : "Already confirmed? Log In"}
                </button>

            </motion.div>
        </div>
    );
};
