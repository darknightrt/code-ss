import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { chatRepository } from '@/lib/db/repositories';
import { handleSupabaseError, NotFoundError } from '@/lib/db/errors';

/**
 * GET /api/sessions/[id]
 * 获取单个会话及其消息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sessionData = await chatRepository.getSessionWithMessages(id);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // 验证会话属于当前用户
    if (sessionData.session.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ session: sessionData });
  } catch (error) {
    console.error('Get session error:', error);
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sessions/[id]
 * 更新会话信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    // 验证会话属于当前用户
    const existingSession = await chatRepository.getSessionById(id);
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (existingSession.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, tags, system_prompt_override, model_params, order_index } = body;

    const updatedSession = await chatRepository.updateSession(id, {
      title,
      tags,
      system_prompt_override,
      model_params,
      order_index,
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Update session error:', error);
    handleSupabaseError(error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[id]
 * 删除会话
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    // 验证会话属于当前用户
    const existingSession = await chatRepository.getSessionById(id);
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (existingSession.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await chatRepository.deleteSession(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
