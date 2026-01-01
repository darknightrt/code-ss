import NextAuth from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import jwt from 'jsonwebtoken';

/**
 * NextAuth v5 配置
 * 使用 Supabase 作为数据库适配器
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // 使用 Supabase 适配器
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),

  // 认证提供商
  providers: [
    // 邮箱密码登录
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // TODO: 实现邮箱密码验证逻辑
        // 可以使用 Supabase Auth 或自定义验证
        
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 这里应该验证用户凭证
        // 示例：从数据库查询用户并验证密码
        // const user = await verifyCredentials(credentials.email, credentials.password);
        
        // 暂时返回 null，需要实现实际的验证逻辑
        return null;
      },
    }),

    // GitHub OAuth 登录
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      // 请求的权限范围
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],

  // 会话配置
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  // 回调函数
  callbacks: {
    /**
     * JWT 回调 - 在创建或更新 JWT 时调用
     */
    async jwt({ token, user, account }) {
      // 首次登录时，将用户信息添加到 token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      return token;
    },

    /**
     * Session 回调 - 在创建或更新 session 时调用
     * 生成 Supabase access token 用于 RLS
     */
    async session({ session, token }) {
      if (token && session.user) {
        // 添加用户 ID 到 session
        session.user.id = token.id as string;

        // 生成 Supabase access token 用于 RLS
        const signingSecret = process.env.SUPABASE_JWT_SECRET;
        if (signingSecret) {
          const payload = {
            aud: 'authenticated',
            exp: Math.floor(new Date(session.expires).getTime() / 1000),
            sub: token.id as string,
            email: token.email,
            role: 'authenticated',
          };

          session.supabaseAccessToken = jwt.sign(payload, signingSecret);
        }
      }

      return session;
    },

    /**
     * 登录回调 - 控制用户是否允许登录
     */
    async signIn({ user, account, profile }) {
      // 可以在这里添加额外的验证逻辑
      // 例如：检查用户是否被禁用、是否需要邮箱验证等
      return true;
    },

    /**
     * 重定向回调 - 控制登录后的重定向
     */
    async redirect({ url, baseUrl }) {
      // 允许相对路径的回调 URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // 允许同域名的回调 URL
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  // 自定义页面
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },

  // 事件处理
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', user.email);
      
      // 可以在这里添加登录后的逻辑
      // 例如：记录登录日志、发送欢迎邮件等
    },
    async signOut() {
      console.log('User signed out');
    },
    async createUser({ user }) {
      console.log('New user created:', user.email);
      
      // 新用户创建后的逻辑
      // 注意：数据库触发器会自动创建 user_settings 和 focus_trends
    },
  },

  // 调试模式（仅开发环境）
  debug: process.env.NODE_ENV === 'development',
});
