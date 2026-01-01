import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { navRepository } from '@/lib/db/repositories';

// PATCH /api/nav/[id] - 更新导航书签
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const navItem = await navRepository.updateNavItem(
      id,
      body
    );

    return NextResponse.json({ navItem });
  } catch (error) {
    console.error('更新导航失败:', error);
    return NextResponse.json(
      { error: '更新导航失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/nav/[id] - 删除导航书签
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    await navRepository.deleteNavItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除导航失败:', error);
    return NextResponse.json(
      { error: '删除导航失败' },
      { status: 500 }
    );
  }
}
