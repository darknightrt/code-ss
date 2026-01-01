import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 受保护的路由列表
 * 这些路由需要用户登录才能访问
 */
const protectedRoutes = [
  '/chat',
  '/plan',
  '/interview',
  '/profile',
  '/settings',
  '/nav',
];

/**
 * 公开路由列表
 * 这些路由不需要登录即可访问
 */
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/verify-request',
];

/**
 * 中间件函数
 * 处理认证和路由保护
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // 如果是受保护的路由且用户未登录，重定向到登录页
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 如果用户已登录且访问登录页，重定向到首页
  if (isAuthenticated && pathname === '/auth/signin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 允许请求继续
  return NextResponse.next();
});

/**
 * 中间件配置
 * 指定哪些路由需要经过中间件处理
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路由，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
