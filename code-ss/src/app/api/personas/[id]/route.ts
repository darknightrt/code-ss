import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { personaRepository } from '@/lib/db/repositories';

// DELETE /api/personas/[id] - 删除自定义角色
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
    await personaRepository.deletePersona(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除角色失败:', error);
    return NextResponse.json(
      { error: '删除角色失败' },
      { status: 500 }
    );
  }
}
