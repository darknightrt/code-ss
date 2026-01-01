'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * 认证守卫组件
 * 
 * 用于保护需要登录才能访问的页面
 * 未认证用户将被重定向到登录页
 * 
 * @example
 * ```tsx
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/auth/signin'
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // 保存当前路径，登录后可以返回
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  }, [status, router, redirectTo]);

  // 加载中状态
  if (status === 'loading') {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      )
    );
  }

  // 未认证状态
  if (status === 'unauthenticated') {
    return null;
  }

  // 已认证，显示内容
  return <>{children}</>;
}

/**
 * 可选认证守卫
 * 
 * 不强制要求登录，但会提供认证状态
 * 适用于可以匿名访问但登录后有额外功能的页面
 */
export function OptionalAuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
