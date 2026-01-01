import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userRepository } from '@/lib/db/repositories';

/**
 * PATCH /api/user/profile
 * 更新用户资料（用户名、头像）
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. 认证检查
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await request.json();
    const { name, image } = body;

    // 3. 验证输入
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '用户名不能为空' },
        { status: 400 }
      );
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: '用户名不能超过50个字符' },
        { status: 400 }
      );
    }

    // 4. 更新用户资料
    const updatedUser = await userRepository.updateUserProfile(session.user.id, {
      name: name.trim(),
      image: image || null,
    });

    // 5. 返回更新后的用户信息
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { error: '更新用户资料失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/profile
 * 获取用户资料
 */
export async function GET() {
  try {
    // 1. 认证检查
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 2. 获取用户信息
    const user = await userRepository.getUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 3. 返回用户信息
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        level: user.level,
        xp: user.xp,
        streak_days: user.streak_days,
        completed_tasks: user.completed_tasks,
        hours_focused: user.hours_focused,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { error: '获取用户资料失败' },
      { status: 500 }
    );
  }
}
