import api from './api';

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'agent' | 'client';
}

export type UserRole = User['role'];

export function getTokenKeyForRole(role: UserRole): `${UserRole}_token` {
    return `${role}_token`;
}

export function setRoleSession(role: UserRole, token: string, user: Pick<User, 'name' | 'email'>) {
    const tokenKey = getTokenKeyForRole(role);
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(`${role}_name`, user.name);
    localStorage.setItem(`${role}_email`, user.email);

    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${tokenKey}=1; Path=/; Max-Age=604800; SameSite=Lax${secure}`;
}

export function clearRoleSession(role: UserRole) {
    const tokenKey = getTokenKeyForRole(role);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(`${role}_name`);
    localStorage.removeItem(`${role}_email`);
    document.cookie = `${tokenKey}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export const getSession = async (): Promise<User | null> => {
    try {
        const response = await api.get('/user');
        return response.data;
    } catch {
        return null;
    }
};

export const logout = async (role: UserRole) => {
    try {
        await api.post('/logout');
    } catch {
        // ignore
    } finally {
        clearRoleSession(role);
        window.location.href = `/login/${role}`;
    }
};
