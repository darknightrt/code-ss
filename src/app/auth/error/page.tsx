'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const errorMessages: Record<string, string> = {
  Configuration: '服务器配置错误',
  AccessDenied: '访问被拒绝',
  Verification: '验证失败',
  Default: '发生错误，请重试',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">认证错误</h1>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => (window.location.href = '/auth/signin')}
            className="w-full"
          >
            返回登录
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="w-full"
          >
            返回首页
          </Button>
        </div>
      </Card>
    </div>
  );
}
