'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => (window.location.href = '/auth/signin')}
        >
          登录
        </Button>
        <Button onClick={() => (window.location.href = '/auth/signup')}>
          注册
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || '用户'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {session.user.name?.[0] || session.user.email?.[0] || 'U'}
          </div>
        )}
        <span className="text-sm font-medium hidden md:inline">
          {session.user.name || session.user.email}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        登出
      </Button>
    </div>
  );
}
