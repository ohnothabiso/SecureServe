import { apiRequest } from './queryClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiRequest('POST', '/api/auth/login', credentials);
  return response.json();
}

export async function logout(): Promise<void> {
  await apiRequest('POST', '/api/auth/logout');
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  const response = await apiRequest('POST', '/api/auth/refresh');
  return response.json();
}

export async function getCurrentUser() {
  const response = await apiRequest('GET', '/api/me');
  return response.json();
}
