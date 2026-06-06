import axios from 'axios';

// Helper: get the role-specific token key based on current URL path
export function getRoleTokenKey(): 'admin_token' | 'agent_token' | 'client_token' {
    if (typeof window === 'undefined') return 'admin_token';
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin_token';
    if (path.startsWith('/agent')) return 'agent_token';
    return 'client_token';
}

// Helper: get the role-specific login page for current path
export function getLoginPageForPath(): string {
    if (typeof window === 'undefined') return '/login/admin';
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return '/login/admin';
    if (path.startsWith('/agent')) return '/login/agent';
    return '/login/client';
}

export function resolveApiBaseUrl(): string {
    const liveApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.crm.webbuilders.lk/api';
    const localApiUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:8000/api';
    const envTarget = (process.env.NEXT_PUBLIC_API_TARGET || 'live').toLowerCase();

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        const storedTarget = localStorage.getItem('webbuilders_api_target');
        const target = (storedTarget || envTarget || 'live').toLowerCase();

        if (hostname === 'crm.webbuilders.lk' || hostname === 'www.crm.webbuilders.lk') {
            return liveApiUrl;
        }

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return localApiUrl;
        }

        if (target === 'local') {
            return localApiUrl;
        }
    }

    return liveApiUrl;
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.crm.webbuilders.lk/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Attach the ROLE-SPECIFIC Bearer token to every request
api.interceptors.request.use((config) => {
    config.baseURL = resolveApiBaseUrl();

    if (typeof window !== 'undefined') {
        const tokenKey = getRoleTokenKey();
        const token = localStorage.getItem(tokenKey);
        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }
    }
    return config;
});

// Handle 401: clear ONLY the current role's token, redirect to role-specific login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                const tokenKey = getRoleTokenKey();
                const loginPage = getLoginPageForPath();
                localStorage.removeItem(tokenKey);
                window.location.href = loginPage;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
