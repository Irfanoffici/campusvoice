import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Get the current user's JWT token for API authentication
 */
async function getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

/**
 * Generic API request wrapper with authentication
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * API Client for Backend Endpoints
 */
export const api = {
    // User Management
    users: {
        list: () => apiRequest<any[]>('/api/admin/users'),

        create: (email: string, password: string, role: string) =>
            apiRequest<{ success: boolean; user: any; message: string }>('/api/admin/users/create', {
                method: 'POST',
                body: JSON.stringify({ email, password, role }),
            }),

        invite: (email: string, role: string) =>
            apiRequest<{ success: boolean; message: string }>('/api/admin/invite', {
                method: 'POST',
                body: JSON.stringify({ email, role }),
            }),

        updateApproval: (id: string, approved: boolean) =>
            apiRequest<{ success: boolean; user: any }>(`/api/admin/users/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ approved }),
            }),

        updateRole: (id: string, role: string) =>
            apiRequest<{ success: boolean }>(`/api/admin/users/${id}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role }),
            }),

        delete: (id: string) =>
            apiRequest<{ success: boolean }>(`/api/admin/users/${id}`, {
                method: 'DELETE',
            }),
    },

    // Feedback Management
    feedback: {
        list: (params?: { category?: string; status?: string; deletion_status?: string }) => {
            const query = new URLSearchParams(params as any).toString();
            return apiRequest<{ feedback: any[]; pagination: any }>(`/api/admin/feedback?${query}`);
        },

        create: (data: { category: string; message: string; priority: string; status?: string }) =>
            apiRequest<any>('/api/admin/feedback', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        updateStatus: (id: number, status: string) =>
            apiRequest<{ success: boolean }>(`/api/admin/feedback/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            }),

        updateDetails: (id: number, data: { message: string; category: string; priority: string }) =>
            apiRequest<{ success: boolean; data: any }>(`/api/admin/feedback/${id}/details`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),

        delete: (id: number) =>
            apiRequest<{ success: boolean; message: string }>(`/api/admin/feedback/${id}`, {
                method: 'DELETE',
            }),

        restore: (id: number) =>
            apiRequest<{ success: boolean; message: string }>(`/api/admin/feedback/${id}/restore`, {
                method: 'POST',
            }),

        deleteResolved: () =>
            apiRequest<{ success: boolean; message: string }>('/api/admin/feedback/resolved', {
                method: 'DELETE',
            }),

        deleteAll: () =>
            apiRequest<{ success: boolean; message: string }>('/api/admin/feedback', {
                method: 'DELETE',
            }),
    },

    // System Logs
    logs: {
        list: () => apiRequest<any[]>('/api/admin/logs'),

        flush: () =>
            apiRequest<{ success: boolean; message: string }>('/api/admin/logs', {
                method: 'DELETE',
            }),
    },

    // Traffic Logs
    traffic: {
        list: (limit = 100) =>
            apiRequest<any[]>(`/api/admin/traffic?limit=${limit}`),
    },

    // System Health
    health: {
        get: () =>
            apiRequest<{
                uptime: number;
                memory: any;
                counts: { feedback: number; admins: number; logs: number };
                status: string;
                timestamp: string;
            }>('/api/admin/system-health'),
    },
};
