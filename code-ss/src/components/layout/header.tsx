'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserStats } from '@/hooks/useGrowth';

const pageTitles: Record<string, string> = {
  '/': '学习概览',
  '/plan': '全栈进阶路线',
  '/nav': '技术资源导航',
  '/chat': 'AI 导师实验室',
  '/interview': '大厂面试模拟舱',
  '/settings': '系统设置',
  '/profile': '个人资料',
};

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: userStats } = useUserStats();

  const title = pageTitles[pathname] || '学习概览';

  // 从 session 中获取用户信息
  const username = session?.user?.name || session?.user?.email?.split('@')[0] || 'Guest';
  const avatar = session?.user?.image || '/default-avatar.png';
  const level = userStats?.level || 1;

  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-20">
      <h1 className="text-xl font-bold">{title}</h1>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          在线学习中
        </div>

        <Link
          href="/profile"
          className="flex items-center gap-3 transition-opacity hover:opacity-80 focus:outline-none"
          title="个人设置"
        >
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold leading-tight">
              {username}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Lv.{level} Developer
            </div>
          </div>
          <img
            src={avatar}
            alt={username}
            className="w-10 h-10 rounded-full border-2 border-background shadow-sm object-cover hover:border-primary transition-colors"
          />
        </Link>
      </div>
    </header>
  );
}
