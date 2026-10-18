import { request } from '../../lib/http';
import type { User } from '../user/user';

export const authApi = {
    login: (email: string, password: string) =>
        request<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        }),

    register: (name: string, email: string, password: string) =>
        request<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        }),

    me: () => request<User>('/auth/me'),
};