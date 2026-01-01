import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { navRepository } from '@/lib/db/repositories';

// GET /api/nav - 获取用户的导航书签列表
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const navItems = await navRepository.getNavItemsByUser(session.user.id);
    return NextResponse.json({ navItems });
  } catch (error) {
    console.error('获取导航列表失败:', error);
    return NextResponse.json(
      { error: '获取导航列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/nav - 创建新的导航书签
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, url, icon_url, category } = body;

    if (!title || !url || !category) {
      return NextResponse.json(
        { error: '标题、链接和分类不能为空' },
        { status: 400 }
      );
    }

    const navItem = await navRepository.createNavItem(session.user.id, {
      title,
      description: description || '',
      url,
      icon_url: icon_url || null,
      category,
    });

    return NextResponse.json({ navItem });
  } catch (error) {
    console.error('创建导航失败:', error);
    return NextResponse.json(
      { error: '创建导航失败' },
      { status: 500 }
    );
  }
}
