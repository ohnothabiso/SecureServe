import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/me'],
    enabled: !!accessToken,
    retry: false,
  });

  // Auto-refresh token
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.accessToken);
          
          // Set default authorization header
          queryClient.setMutationDefaults(['auth'], {
            mutationFn: async (variables: any) => {
              return apiRequest(variables.method, variables.url, variables.data);
            },
          });
        }
      } catch (error) {
        console.log('Token refresh failed');
      }
    };

    refreshToken();

    // Refresh token every 5 minutes
    const interval = setInterval(refreshToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Update axios defaults when token changes
  useEffect(() => {
    if (accessToken) {
      // Update default query client to include auth header
      queryClient.setDefaultOptions({
        queries: {
          queryFn: async ({ queryKey }) => {
            const response = await fetch(queryKey.join('/') as string, {
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });

            if (!response.ok) {
              throw new Error(`${response.status}: ${response.statusText}`);
            }

            return response.json();
          },
        },
      });
    }
  }, [accessToken, queryClient]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      setAccessToken(null);
      queryClient.clear();
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider 
      value={{
        user: (user as User) || null,
        login,
        logout,
        isLoading: isLoading || loginMutation.isPending,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
