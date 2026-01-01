'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider } from 'next-auth/react';
import { getQueryClient } from '@/lib/query-client';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // 使用 useState 确保每个客户端只创建一次 QueryClient
  const [queryClient] = useState(() => getQueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}
