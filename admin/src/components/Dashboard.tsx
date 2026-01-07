import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Trash2,
    RefreshCw,
    Filter,
    LogOut,
    Shield,
    Users,
    FileText,
    Activity
} from 'lucide-react';
import type { FeedbackItem, Stats, Status, AdminRole } from '../types';
import { FilterDropdown } from './FilterDropdown';
import { supabase } from '../lib/supabase';
import { UserManagement } from './UserManagement';
import { SystemLogs } from './SystemLogs';
import { ManualEntry } from './ManualEntry';
import { SystemVisualizer } from './SystemVisualizer';
import { TrafficVisualizer } from './TrafficVisualizer';
import { Edit, X } from 'lucide-react';
import { ToastContainer, type ToastProps, type ToastType } from './Toast';



export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState<{ id: number | 'all' | 'resolved', type: 'single' | 'all' | 'resolved' } | null>(null);

    // Toast State
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const addToast = (message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type, onClose: removeToast }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Superadmin State - Fetch role from user metadata
    const [role, setRole] = useState<AdminRole>('admin');
    const [currentTab, setCurrentTab] = useState<'feedback' | 'users' | 'logs' | 'traffic' | 'metrics'>('feedback');
    const [showManualEntry, setShowManualEntry] = useState(false);

    // Fetch user role on mount
    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Check user metadata for role
                const userRole = user.user_metadata?.role || user.app_metadata?.role;

                // Also check if email matches a superadmin pattern (fallback)
                const isSuperadmin = userRole === 'superadmin' ||
                    user.email?.includes('irfanasim') ||
                    user.email?.includes('superadmin');

                setRole(isSuperadmin ? 'superadmin' : (userRole || 'admin'));
            }
        };
        fetchUserRole();
    }, []);

    // Trash / Soft Delete State
    const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

    // Edit State
    const [editingItem, setEditingItem] = useState<FeedbackItem | null>(null);

    // Animation Variants - High Performance Spring
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03, // Faster stagger
                when: "beforeChildren"
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 500, damping: 30, mass: 1 }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2 }
        }
    };

    const fetchData = async (isBackground = false) => {
        try {
            if (!isBackground && feedback.length === 0) setLoading(true);

            // Fetch Stats (Calculate manually from DB for now)
            const { count: total } = await supabase.from('feedback').select('*', { count: 'exact', head: true });
            const { data: allItems } = await supabase.from('feedback').select('category, priority, status');

            // derive stats
            const byCategory = allItems?.reduce((acc: any[], curr) => {
                const found = acc.find(c => c.category === curr.category);
                if (found) found.count++;
                else acc.push({ category: curr.category, count: 1 });
                return acc;
            }, []) || [];

            const byPriority = allItems?.reduce((acc: any[], curr) => {
                const found = acc.find(p => p.priority === curr.priority);
                if (found) found.count++;
                else acc.push({ priority: curr.priority, count: 1 });
                return acc;
            }, []) || [];

            setStats({ total: total || 0, byCategory, byPriority, recent: [] });

            // Fetch Feedback
            let query = supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(50);

            if (filterCategory !== 'all') query = query.eq('category', filterCategory);
            if (filterStatus !== 'all') query = query.eq('status', filterStatus);
            if (viewMode === 'trash') query = query.eq('deletion_requested', true);
            else query = query.eq('deletion_requested', false);

            const { data: feedbackData, error } = await query;
            if (error) throw error;

            setFeedback(feedbackData || []);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterCategory, filterStatus, viewMode]);

    const updateStatus = async (id: number, newStatus: Status) => {
        try {
            const { error } = await supabase.from('feedback').update({ status: newStatus }).eq('id', id);
            if (error) throw error;

            setFeedback(prev => prev.map(item =>
                item.id === id ? { ...item, status: newStatus } : item
            ));
            addToast(`Status updated to ${newStatus}`, 'success');
        } catch (err) {
            console.error('Update failed', err);
            addToast('Failed to update status', 'error');
        }
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        try {
            const { error } = await supabase.from('feedback').update({
                message: editingItem.message,
                category: editingItem.category,
                priority: editingItem.priority
            }).eq('id', editingItem.id);

            if (error) throw error;

            setEditingItem(null);
            fetchData();
            addToast('Feedback updated successfully', 'success');
        } catch (err) {
            console.error('Edit failed', err);
            addToast('Failed to update feedback', 'error');
        }
    };

    const handleRestore = async (id: number) => {
        try {
            const { error } = await supabase.from('feedback').update({ deletion_requested: false }).eq('id', id);
            if (error) throw error;
            fetchData();
            addToast('Feedback restored to Active', 'success');
        } catch (err) {
            console.error('Restore failed', err);
            addToast('Failed to restore item', 'error');
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;

        try {
            let error;
            if (confirmDelete.type === 'single') {
                // Hard delete if already in trash or superadmin, else soft delete
                if (viewMode === 'trash') {
                    const { error: e } = await supabase.from('feedback').delete().eq('id', confirmDelete.id);
                    error = e;
                } else {
                    const { error: e } = await supabase.from('feedback').update({ deletion_requested: true }).eq('id', confirmDelete.id);
                    error = e;
                }
            } else if (confirmDelete.type === 'resolved') {
                const { error: e } = await supabase.from('feedback').delete().eq('status', 'resolved');
                error = e;
            } else if (confirmDelete.type === 'all') {
                const { error: e } = await supabase.from('feedback').delete().neq('id', 0);
                error = e;
            }

            if (error) throw error;

            setConfirmDelete(null);
            fetchData();

            if (viewMode === 'trash' || confirmDelete.type === 'resolved' || confirmDelete.type === 'all') {
                addToast('Items permanently deleted', 'delete');
            } else {
                addToast('Moved to Recycle Bin', 'delete');
            }
        } catch (err) {
            console.error('Delete failed', err);
            addToast('Failed to delete item', 'error');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {title}
                </span>
                <div style={{ padding: '8px', borderRadius: '12px', background: `${color}20`, color: color }}>
                    <Icon size={20} />
                </div>
            </div>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                {value}
            </span>
        </motion.div>
    );

    if (role === 'pending' as any) {
        return (
            <div style={{
                height: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
                    <Shield size={40} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Access Denied</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '30px' }}>
                    Your account is pending Superadmin approval.
                </p>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px',
                        color: '#fff', border: 'none', cursor: 'pointer'
                    }}
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
                        Command Deck
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>MEC Analysis & Control</p>
                </div>
                <button
                    onClick={() => fetchData()}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: '#fff',
                        padding: '10px',
                        borderRadius: '12px',
                        cursor: 'pointer'
                    }}
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            {/* Superadmin Navigation */}
            {role === 'superadmin' && (
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '5px', borderRadius: '12px' }}>
                    {[
                        { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                        { id: 'users', label: 'Personnel', icon: Users },
                        { id: 'logs', label: 'Audit Logs', icon: FileText },
                        { id: 'traffic', label: 'Traffic', icon: Activity },
                        { id: 'metrics', label: 'System Health', icon: LayoutDashboard }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id as any)}
                            style={{
                                flex: 1,
                                border: 'none',
                                background: currentTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: currentTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {currentTab === 'users' ? (
                <UserManagement />
            ) : currentTab === 'logs' ? (
                <SystemLogs />
            ) : currentTab === 'metrics' ? (
                <SystemVisualizer />
            ) : currentTab === 'traffic' ? (
                <TrafficVisualizer />
            ) : (
                <>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                        <StatCard
                            title="Total Feedback"
                            value={stats?.total || 0}
                            icon={MessageSquare}
                            color="#3b82f6"
                        />
                        <StatCard
                            title="Critical Issues"
                            value={stats?.byPriority?.find(p => p.priority === 'critical')?.count || 0}
                            icon={AlertCircle}
                            color="#ef4444"
                        />
                        <StatCard
                            title="Resolved"
                            value={stats?.byCategory?.reduce((acc: number, curr: any) => acc + (curr.status === 'resolved' ? 1 : 0), 0) || 'Active'}
                            icon={CheckCircle2}
                            color="#10b981"
                        />
                        <StatCard
                            title="Pending"
                            value={stats?.total ? stats.total - (stats?.byCategory?.reduce((acc: number, curr: any) => acc + (curr.status === 'resolved' ? 1 : 0), 0) || 0) : 0}
                            icon={LayoutDashboard}
                            color="#a855f7"
                        />
                    </div>

                    {/* Control Bar */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '20px',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '20px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <FilterDropdown
                                label="Category"
                                value={filterCategory}
                                onChange={setFilterCategory}
                                icon={Filter}
                                options={[
                                    { value: 'all', label: 'All Categories' },
                                    { value: 'teaching', label: 'Teaching' },
                                    { value: 'facilities', label: 'Facilities' },
                                    { value: 'safety', label: 'Safety' },
                                    { value: 'events', label: 'Events' },
                                    { value: 'administration', label: 'Admin' },
                                    { value: 'general', label: 'General' }
                                ]}
                            />

                            <FilterDropdown
                                label="Status"
                                value={filterStatus}
                                onChange={setFilterStatus}
                                options={[
                                    { value: 'all', label: 'All Status' },
                                    { value: 'new', label: 'New' },
                                    { value: 'reviewed', label: 'Reviewed' },
                                    { value: 'resolved', label: 'Resolved' }
                                ]}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            {role === 'superadmin' && (
                                <>
                                    <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: viewMode === 'trash' ? '#dc2626' : 'rgba(255,255,255,0.2)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setViewMode(viewMode === 'active' ? 'trash' : 'active')}
                                        style={{
                                            background: viewMode === 'trash' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        <Trash2 size={14} /> {viewMode === 'active' ? 'Recycle Bin' : 'Back to Active'}
                                    </motion.button>
                                    <button
                                        onClick={() => setShowManualEntry(true)}
                                        style={{
                                            background: 'rgba(168, 85, 247, 0.1)',
                                            color: '#a855f7',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        + Manual Input
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setConfirmDelete({ id: 'resolved', type: 'resolved' })}
                                style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}
                            >
                                Clear Resolved
                            </button>

                            <button
                                onClick={() => setConfirmDelete({ id: 'all', type: 'all' })}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Trash2 size={14} /> Purge All
                            </button>

                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    </div>

                    {/* Feedback Feed */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
                        >
                            <AnimatePresence mode="popLayout">
                                {feedback.map((item) => (
                                    <motion.div
                                        layout
                                        variants={itemVariants}
                                        key={item.id}
                                        initial="hidden"
                                        animate="show"
                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            borderLeft: `4px solid ${item.priority === 'critical' ? '#ef4444' :
                                                item.priority === 'high' ? '#f97316' :
                                                    item.priority === 'medium' ? '#eab308' : '#3b82f6'
                                                }`,
                                            borderRadius: '4px 16px 16px 4px',
                                            padding: '20px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: '20px',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                            willChange: 'transform, opacity'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    color: 'rgba(255,255,255,0.5)',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {item.category}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p style={{ color: '#e5e7eb', fontSize: '1rem', lineHeight: 1.5, marginBottom: '12px' }}>
                                                {item.message}
                                            </p>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {['new', 'reviewed', 'resolved'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => updateStatus(item.id, status as Status)}
                                                        style={{
                                                            background: item.status === status ? '#fff' : 'transparent',
                                                            color: item.status === status ? '#000' : 'rgba(255,255,255,0.4)',
                                                            border: `1px solid ${item.status === status ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                            textTransform: 'capitalize'
                                                        }}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {viewMode === 'trash' && (
                                                <button
                                                    onClick={() => handleRestore(item.id)}
                                                    title="Restore to Active"
                                                    style={{
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        border: 'none',
                                                        color: '#10b981',
                                                        cursor: 'pointer',
                                                        padding: '8px',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <RefreshCw size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setConfirmDelete({ id: item.id, type: 'single' })}
                                                title={viewMode === 'trash' ? 'Permanently Delete' : 'Move to Trash'}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: viewMode === 'trash' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.4)',
                                                    cursor: 'pointer',
                                                    padding: '8px'
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        {/* Edit Button for Superadmin */}
                                        {role === 'superadmin' && (
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'rgba(59, 130, 246, 0.4)',
                                                    cursor: 'pointer',
                                                    padding: '8px'
                                                }}
                                            >
                                                <Edit size={18} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {feedback.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                No signals detected.
                            </div>
                        )}
                    </div>

                    {/* Edit Modal */}
                    {
                        editingItem && (
                            <div style={{
                                position: 'fixed', inset: 0, zIndex: 100,
                                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{
                                    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '90%',
                                    position: 'relative'
                                }}>
                                    <button
                                        onClick={() => setEditingItem(null)}
                                        style={{
                                            position: 'absolute', top: '20px', right: '20px',
                                            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                    <h2 style={{ color: '#fff', marginBottom: '20px' }}>Edit Feedback</h2>
                                    <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                                        <textarea
                                            value={editingItem.message}
                                            onChange={e => setEditingItem({ ...editingItem, message: e.target.value })}
                                            rows={4}
                                            style={{
                                                width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'
                                            }}
                                        />

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <select
                                                value={editingItem.category}
                                                onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any })}
                                                style={{
                                                    flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'
                                                }}
                                            >
                                                {['general', 'teaching', 'facilities', 'safety', 'events', 'administration'].map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={editingItem.priority}
                                                onChange={e => setEditingItem({ ...editingItem, priority: e.target.value as any })}
                                                style={{
                                                    flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'
                                                }}
                                            >
                                                {['low', 'medium', 'high', 'critical'].map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button type="submit" style={{
                                            marginTop: '10px', padding: '12px', borderRadius: '12px',
                                            background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'
                                        }}>
                                            Save Changes
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* Delete Confirmation Modal */}
                    {
                        confirmDelete && (
                            <div style={{
                                position: 'fixed', inset: 0, zIndex: 100,
                                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{
                                    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '30px', borderRadius: '24px', maxWidth: '400px', width: '90%',
                                    textAlign: 'center'
                                }}>
                                    <h3 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.2rem' }}>Confirm Deletion</h3>
                                    <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>
                                        This action is irreversible. Are you sure?
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            style={{
                                                padding: '10px 20px', borderRadius: '12px', border: 'none',
                                                background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            style={{
                                                padding: '10px 20px', borderRadius: '12px', border: 'none',
                                                background: '#ef4444', color: '#fff', cursor: 'pointer'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        showManualEntry && (
                            <ManualEntry
                                onClose={() => setShowManualEntry(false)}
                                onSuccess={fetchData}
                            />
                        )
                    }
                </>
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div >
    );
};
