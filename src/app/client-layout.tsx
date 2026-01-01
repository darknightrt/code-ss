'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MatrixRain } from '@/components/layout/matrix-rain';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove('dark', 'matrix-mode');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'matrix') {
      root.classList.add('dark', 'matrix-mode');
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen transition-colors duration-300 flex overflow-hidden bg-background">
      {theme === 'matrix' && <MatrixRain />}

      <Sidebar />

      <main className="flex-1 relative z-10 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
