'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareCode,
  CalendarDays,
  Settings as SettingsIcon,
  Briefcase,
  Compass,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: '仪表盘' },
  { href: '/plan', icon: CalendarDays, label: '学习计划' },
  { href: '/nav', icon: Compass, label: '全栈罗盘' },
  { href: '/chat', icon: MessageSquareCode, label: 'AI 聊天室' },
  { href: '/interview', icon: Briefcase, label: '面试模拟' },
];

const bottomItems = [
  { href: '/profile', icon: User, label: '个人设置' },
  { href: '/settings', icon: SettingsIcon, label: '系统设置' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 lg:w-64 bg-card border-r border-border z-10 flex flex-col justify-between transition-all duration-300">
      <div>
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30">
            C
          </div>
          <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight">
            CodeSensei
          </span>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'w-full flex items-center p-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <item.icon className="w-6 h-6 lg:mr-3" />
                <span className="hidden lg:block font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border space-y-2">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'w-full flex items-center p-3 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              <item.icon className="w-6 h-6 lg:mr-3" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
