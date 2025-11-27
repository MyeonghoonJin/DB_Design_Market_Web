'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseAuthOptions {
  redirectTo?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { redirectTo = '/auth/login' } = options;
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');

        if (response.status === 401) {
          alert('로그인이 필요합니다.');
          router.push(redirectTo);
          setIsAuthenticated(false);
          return;
        }

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          alert('로그인이 필요합니다.');
          router.push(redirectTo);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        alert('로그인이 필요합니다.');
        router.push(redirectTo);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, redirectTo]);

  return { isAuthenticated, isLoading };
}
