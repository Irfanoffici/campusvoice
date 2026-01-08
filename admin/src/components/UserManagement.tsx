import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Shield, User, Trash2, Check, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AdminUser } from '../types';



export const UserManagement = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showInvite, setShowInvite] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showRoleEdit, setShowRoleEdit] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    // Invite State
    const [inviteEmail, setInviteEmail] = useState('');

    // Manual Create State
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'resolver' });

    // Role Edit State
    const [newRole, setNewRole] = useState('resolver');

    const fetchUsers = async () => {
        try {
            // Query the admins table directly from Supabase
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                return;
            }

            setUsers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleApproval = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('admins')
                .update({ approved: !currentStatus })
                .eq('id', id);

            if (error) {
                alert(`Error: ${error.message}`);
                return;
            }

            // Refresh the list
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Failed to update approval status');
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('admins')
                .delete()
                .eq('id', id);

            if (error) {
                alert(`Error: ${error.message}`);
                return;
            }

            // Refresh the list
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Failed to delete user');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { api } = await import('../lib/api');
            await api.users.invite(inviteEmail, 'resolver');

            setShowInvite(false);
            setInviteEmail('');
            alert('User invited successfully!');
        } catch (err: any) {
            console.error('Invite failed:', err);
            alert(`Failed to invite user: ${err.message}`);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { api } = await import('../lib/api');
            await api.users.create(newUser.email, newUser.password, newUser.role);

            setShowCreate(false);
            setNewUser({ email: '', password: '', role: 'resolver' });
            fetchUsers(); // Refresh the list
            alert('User created successfully!');
        } catch (err: any) {
            console.error('User creation failed:', err);
            alert(`Failed to create user: ${err.message}`);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;

        try {
            const { error } = await supabase
                .from('admins')
                .update({ role: newRole })
                .eq('id', selectedUser.id);

            if (error) {
                alert(`Error: ${error.message}`);
                return;
            }

            // Refresh the list
            fetchUsers();
            setShowRoleEdit(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update role');
        }
    };

    const openRoleModal = (user: AdminUser) => {
        setSelectedUser(user);
        setNewRole(user.role || 'resolver');
        setShowRoleEdit(true);
    };

    if (loading) return <div>Loading personnel...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowInvite(true)}
                        style={{
                            background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none',
                            padding: '10px 20px', borderRadius: '12px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        + Invite Agent
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            background: '#3b82f6', color: '#fff', border: 'none',
                            padding: '10px 20px', borderRadius: '12px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        + Create User
                    </button>
                </div>
            </div>

            {users.map((user) => (
                <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            padding: '10px',
                            background: user.role === 'superadmin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: user.role === 'superadmin' ? '#a855f7' : '#fff'
                        }}>
                            {user.role === 'superadmin' ? <Shield size={20} /> : <User size={20} />}
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{user.email}</div>
                            <div style={{
                                color: user.approved ? '#10b981' : '#ef4444',
                                fontSize: '0.8rem',
                                marginTop: '4px',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: user.approved ? '#10b981' : '#ef4444' }} />
                                {user.approved ? 'Active' : 'Pending Approval'}
                                <span style={{
                                    marginLeft: '10px',
                                    background: user.role === 'superadmin' ? '#a855f7' : user.role === 'admin' ? '#f59e0b' : '#3b82f6',
                                    color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.7rem'
                                }}>
                                    {user.role || 'resolver'}
                                </span>
                                {user.role !== 'superadmin' && (
                                    <button
                                        onClick={() => openRoleModal(user)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '2px', marginLeft: '5px' }}
                                        title="Edit Role"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {user.role !== 'superadmin' && ( // Only show controls for non-superadmins (except Update Role which is separate)
                            <>
                                <button
                                    onClick={() => toggleApproval(user.id, user.approved)}
                                    style={{
                                        background: user.approved ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: user.approved ? '#ef4444' : '#10b981',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    {user.approved ? <><Lock size={14} /> Revoke</> : <><Unlock size={14} /> Approve</>}
                                </button>
                                <button
                                    onClick={() => deleteUser(user.id)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: 'none',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                        {/* Allow Deleting Admins/Resolvers for Superadmin, but hidden for others */}
                    </div>
                </motion.div>
            ))}

            {showInvite && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '30px', borderRadius: '24px', maxWidth: '400px', width: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <h3 style={{ color: '#fff', marginBottom: '20px' }}>Whitelist New Agent</h3>
                        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                type="email"
                                placeholder="agent@mec.edu"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowInvite(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Whitelist</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {showCreate && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '30px', borderRadius: '24px', maxWidth: '400px', width: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <h3 style={{ color: '#fff', marginBottom: '20px' }}>Manually Create Agent</h3>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                type="email" placeholder="Email Address" required
                                value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                            <input
                                type="password" placeholder="Set Password (min 6 chars)" required minLength={6}
                                value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ color: '#888', fontSize: '0.8rem' }}>Assign Role</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        { id: 'resolver', label: 'Resolver', desc: 'Status Only', color: '#3b82f6' },
                                        { id: 'admin', label: 'Admin', desc: 'Edit/Delete', color: '#f59e0b' },
                                        { id: 'superadmin', label: 'Superadmin', desc: 'God Mode', color: '#a855f7' }
                                    ].map((roleOption) => (
                                        <button
                                            key={roleOption.id}
                                            type="button"
                                            onClick={() => setNewUser({ ...newUser, role: roleOption.id })}
                                            style={{
                                                padding: '12px', borderRadius: '12px', textAlign: 'left',
                                                background: newUser.role === roleOption.id ? `rgba(${roleOption.color === '#3b82f6' ? '59, 130, 246' : roleOption.color === '#f59e0b' ? '245, 158, 11' : '168, 85, 247'}, 0.2)` : 'rgba(255,255,255,0.05)',
                                                border: newUser.role === roleOption.id ? `1px solid ${roleOption.color}` : '1px solid transparent',
                                                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                                            }}
                                        >
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: roleOption.color }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{roleOption.label}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{roleOption.desc}</div>
                                            </div>
                                            {newUser.role === roleOption.id && <Check size={16} color={roleOption.color} style={{ marginLeft: 'auto' }} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Create Agent</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Role Edit Modal */}
            {showRoleEdit && selectedUser && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '30px', borderRadius: '24px', maxWidth: '400px', width: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <h3 style={{ color: '#fff', marginBottom: '20px' }}>Change Role</h3>
                        <p style={{ color: '#aaa', marginBottom: '20px' }}>
                            Assign a new clearance level for <strong>{selectedUser.email}</strong>.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={() => setNewRole('resolver')}
                                style={{
                                    padding: '15px', borderRadius: '12px', textAlign: 'left',
                                    background: newRole === 'resolver' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: newRole === 'resolver' ? '1px solid #3b82f6' : '1px solid transparent',
                                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                                }}
                            >
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Resolver</div>
                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Can only view and update status</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setNewRole('admin')}
                                style={{
                                    padding: '15px', borderRadius: '12px', textAlign: 'left',
                                    background: newRole === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: newRole === 'admin' ? '1px solid #f59e0b' : '1px solid transparent',
                                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                                }}
                            >
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Admin</div>
                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Can delete feedback and edit data</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setNewRole('superadmin')}
                                style={{
                                    padding: '15px', borderRadius: '12px', textAlign: 'left',
                                    background: newRole === 'superadmin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: newRole === 'superadmin' ? '1px solid #a855f7' : '1px solid transparent',
                                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
                                }}
                            >
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a855f7' }} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Superadmin</div>
                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Full System Access (God Mode)</div>
                                </div>
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setShowRoleEdit(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleUpdateRole()} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Update Role</button>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
};
