import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { chatRepository } from '@/lib/db/repositories';
import { handleSupabaseError } from '@/lib/db/errors';

/**
 * GET /api/sessions
 * 获取用户的所有聊天会话列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const includeMessages = searchParams.get('includeMessages') === 'true';

    const sessions = await chatRepository.getSessionsByUser(
      session.user.id,
      {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }
    );

    // 如果需要包含消息，获取每个会话的消息
    if (includeMessages) {
      const sessionsWithMessages = await Promise.all(
        sessions.map(async (s) => {
          const messages = await chatRepository.getMessagesBySession(s.id);
          return { ...s, messages };
        })
      );
      return NextResponse.json({ sessions: sessionsWithMessages });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 * 创建新的聊天会话
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, persona_id, tags, system_prompt_override, model_params, custom_persona } = body;

    if (!title || !persona_id) {
      return NextResponse.json(
        { error: 'Title and persona_id are required' },
        { status: 400 }
      );
    }

    const newSession = await chatRepository.createSession(session.user.id, {
      title,
      persona_id,
      tags: tags || [],
      system_prompt_override,
      model_params,
      custom_persona,
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    handleSupabaseError(error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
