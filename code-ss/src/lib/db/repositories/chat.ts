import { supabase } from '../client';
import { handleSupabaseError } from '../errors';
import type { Database } from '../types';

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert'];
type ChatSessionUpdate = Database['public']['Tables']['chat_sessions']['Update'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

/**
 * 聊天数据访问层
 */
export class ChatRepository {
  /**
   * 创建聊天会话
   */
  async createSession(
    userId: string,
    sessionData: Omit<ChatSessionInsert, 'user_id'>
  ): Promise<ChatSession> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          ...sessionData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取用户的所有会话
   */
  async getSessionsByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'order_index' | 'updated_at' | 'created_at';
      ascending?: boolean;
    }
  ): Promise<ChatSession[]> {
    try {
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId);

      // 排序
      const orderBy = options?.orderBy || 'order_index';
      const ascending = options?.ascending ?? false;
      query = query.order(orderBy, { ascending });

      // 分页
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取单个会话（包含消息）
   */
  async getSessionById(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取会话及其消息
   */
  async getSessionWithMessages(sessionId: string): Promise<{
    session: ChatSession;
    messages: ChatMessage[];
  } | null> {
    try {
      const [session, messages] = await Promise.all([
        this.getSessionById(sessionId),
        this.getMessagesBySession(sessionId),
      ]);

      if (!session) return null;

      return { session, messages };
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新会话
   */
  async updateSession(
    sessionId: string,
    updates: ChatSessionUpdate
  ): Promise<ChatSession> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 删除会话（级联删除消息）
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 重新排序会话
   */
  async reorderSessions(
    sessionId: string,
    newOrderIndex: number
  ): Promise<ChatSession> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({ order_index: newOrderIndex })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 批量更新会话顺序
   */
  async batchReorderSessions(
    updates: Array<{ id: string; order_index: number }>
  ): Promise<void> {
    try {
      // 使用事务批量更新
      const promises = updates.map(({ id, order_index }) =>
        supabase
          .from('chat_sessions')
          .update({ order_index })
          .eq('id', id)
      );

      await Promise.all(promises);
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 添加消息到会话
   */
  async addMessage(
    sessionId: string,
    message: Omit<ChatMessageInsert, 'session_id'>
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          ...message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 批量添加消息
   */
  async addMessages(
    sessionId: string,
    messages: Array<Omit<ChatMessageInsert, 'session_id'>>
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(
          messages.map(msg => ({
            session_id: sessionId,
            ...msg,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取会话的所有消息
   */
  async getMessagesBySession(
    sessionId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 全文搜索消息
   */
  async searchMessages(
    userId: string,
    query: string,
    options?: {
      limit?: number;
      sessionId?: string;
    }
  ): Promise<Array<ChatMessage & { session?: ChatSession }>> {
    try {
      let dbQuery = supabase
        .from('chat_messages')
        .select('*, chat_sessions!inner(*)')
        .eq('chat_sessions.user_id', userId)
        .textSearch('content', query);

      if (options?.sessionId) {
        dbQuery = dbQuery.eq('session_id', options.sessionId);
      }

      if (options?.limit) {
        dbQuery = dbQuery.limit(options.limit);
      }

      const { data, error } = await dbQuery;

      if (error) throw error;

      // 转换数据格式
      return data.map((item: any) => ({
        ...item,
        session: item.chat_sessions,
        chat_sessions: undefined,
      }));
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取会话的消息数量
   */
  async getMessageCount(sessionId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取用户的会话数量
   */
  async getSessionCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 删除会话的所有消息
   */
  async deleteMessages(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
}

// 导出单例实例
export const chatRepository = new ChatRepository();
