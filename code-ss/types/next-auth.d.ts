import { DefaultSession } from 'next-auth';

/**
 * 扩展 NextAuth 类型定义
 */
declare module 'next-auth' {
  /**
   * 扩展 Session 接口
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
    supabaseAccessToken?: string;
  }

  /**
   * 扩展 User 接口
   */
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    username?: string | null;
    level?: number;
    xp?: number;
    streak_days?: number;
    completed_tasks?: number;
    hours_focused?: number;
  }
}

declare module 'next-auth/jwt' {
  /**
   * 扩展 JWT 接口
   */
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    picture?: string | null;
  }
}
