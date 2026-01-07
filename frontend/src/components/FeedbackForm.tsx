import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Category, type Priority } from '../types';
import { CategoryChips } from './CategoryChips';
import { PriorityControl } from './PriorityControl';
import { SuccessView } from './SuccessView';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const FeedbackForm: React.FC = () => {
    const [category, setCategory] = useState<Category | null>(null);
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !message.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await new Promise(r => setTimeout(r, 800)); // Aesthetic delay

            const { error: supabaseError } = await supabase
                .from('feedback')
                .insert([{
                    category,
                    message,
                    priority,
                    status: 'new' // Default status
                }]);

            if (supabaseError) throw supabaseError;

            setIsSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setIsSuccess(false);
        setCategory(null);
        setMessage('');
        setPriority('medium');
        setError(null);
    };

    return (
        <div style={{ perspective: '1000px', display: 'flex', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
                {isSuccess ? (
                    <motion.div
                        key="success-card"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            background: 'rgba(20, 20, 20, 0.6)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '32px',
                            padding: '60px',
                            width: '100%',
                            maxWidth: '600px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <SuccessView onReset={handleReset} />
                    </motion.div>
                ) : (
                    <motion.form
                        key="form"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Smooth Apple-like ease
                        style={{
                            background: 'rgba(20, 20, 20, 0.6)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '32px',
                            padding: '50px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '40px',
                            width: '100%',
                            maxWidth: '600px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Subtle inner gradient for depth */}
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, height: '100%',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
                            pointerEvents: 'none'
                        }} />

                        <header style={{ position: 'relative', zIndex: 1 }}>
                            <h1 style={{
                                fontSize: '2.5rem',
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                                marginBottom: '8px',
                                color: '#fff'
                            }}>
                                MEC - CampusVoice
                            </h1>
                            <p style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '1rem',
                                lineHeight: 1.5
                            }}>
                                Share your thoughts anonymously
                            </p>
                        </header>

                        <section style={{ position: 'relative', zIndex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Topic
                            </label>
                            <CategoryChips selected={category} onSelect={setCategory} />
                        </section>

                        <section style={{ position: 'relative', zIndex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Your Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="What's on your mind?"
                                required
                                rows={1}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    fontSize: '1.2rem',
                                    fontWeight: 400,
                                    color: '#fff',
                                    resize: 'none',
                                    outline: 'none',
                                    minHeight: '120px',
                                    lineHeight: 1.5,
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                                    e.target.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.target.style.background = 'rgba(255,255,255,0.03)';
                                }}
                            />
                        </section>

                        <section style={{ position: 'relative', zIndex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Priority
                            </label>
                            <PriorityControl selected={priority} onSelect={setPriority} />
                        </section>

                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
                            <motion.button
                                type="submit"
                                disabled={isSubmitting || !category}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    background: isSubmitting || !category ? 'rgba(255,255,255,0.05)' : '#fff',
                                    color: isSubmitting || !category ? 'rgba(255,255,255,0.2)' : '#000',
                                    border: 'none',
                                    borderRadius: '9999px',
                                    padding: '14px 28px',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.02em',
                                    cursor: isSubmitting || !category ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s',
                                    boxShadow: isSubmitting || !category ? 'none' : '0 0 20px rgba(255,255,255,0.2)'
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Sending
                                    </>
                                ) : (
                                    <>
                                        Submit Feedback <ArrowRight size={16} />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
};
