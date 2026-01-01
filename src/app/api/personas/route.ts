import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { personaRepository } from '@/lib/db/repositories';

// GET /api/personas - 获取用户的自定义角色列表
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const personas = await personaRepository.getPersonasByUser(session.user.id);
    return NextResponse.json({ personas });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json(
      { error: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/personas - 创建新的自定义角色
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, avatar, description, system_prompt } = body;

    if (!name || !system_prompt) {
      return NextResponse.json(
        { error: '角色名称和系统提示词不能为空' },
        { status: 400 }
      );
    }

    const persona = await personaRepository.createPersona(session.user.id, {
      name,
      role: role || 'Custom',
      avatar: avatar || '🤖',
      description: description || '',
      system_prompt,
    });

    return NextResponse.json({ persona });
  } catch (error) {
    console.error('创建角色失败:', error);
    return NextResponse.json(
      { error: '创建角色失败' },
      { status: 500 }
    );
  }
}
