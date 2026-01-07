export type Category =
    | 'teaching'
    | 'facilities'
    | 'administration'
    | 'safety'
    | 'events'
    | 'general';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'new' | 'reviewed' | 'resolved';

export interface FeedbackItem {
    id: number;
    category: Category;
    message: string;
    priority: Priority;
    status: Status;
    created_at: string;
}

export interface Stats {
    total: number;
    byCategory: { category: string; count: number }[];
    byPriority: { priority: string; count: number }[];
    recent: FeedbackItem[];
}

export type AdminRole = 'admin' | 'superadmin';

export interface AdminUser {
    id: string;
    email: string;
    role: AdminRole;
    approved: boolean;
    created_at: string;
}

export interface AdminLog {
    id: number;
    admin_id: string;
    action: string;
    details: string;
    ip_address: string;
    created_at: string;
}

export interface SystemHealth {
    uptime: number;
    memory: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers: number;
    };
    counts: {
        feedback: number;
        admins: number;
        logs: number;
    };
    status: string;
    timestamp: string;
}

export interface AccessLog {
    id: number;
    ip_address: string;
    method: string;
    path: string;
    status_code: number;
    duration_ms: number;
    created_at: string;
    user_agent?: string;
    metadata?: any;
}
