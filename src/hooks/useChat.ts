import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

// 类型定义
interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  persona_id: string;
  tags: string[];
  system_prompt_override?: string | null;
  model_params?: any;
  order_index: number;
  custom_persona?: any;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  is_thinking: boolean;
  created_at: string;
}

interface CreateSessionInput {
  title: string;
  persona_id: string;
  tags?: string[];
  system_prompt_override?: string;
  model_params?: any;
  custom_persona?: any;
}

interface UpdateSessionInput {
  title?: string;
  tags?: string[];
  persona_id?: string;
  system_prompt_override?: string;
  model_params?: any;
  custom_persona?: any;
  order_index?: number;
}

/**
 * 获取用户的所有聊天会话
 */
export function useChatSessions(includeMessages = false) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['chat-sessions', session?.user?.id, includeMessages],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeMessages) {
        params.append('includeMessages', 'true');
      }

      const response = await fetch(`/api/sessions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();
      return data.sessions as ChatSession[];
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 获取单个会话及其消息
 */
export function useChatSession(sessionId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      const data = await response.json();
      return data.session as ChatSession;
    },
    enabled: !!session?.user?.id && !!sessionId,
  });
}

/**
 * 获取会话的消息列表
 */
export function useSessionMessages(sessionId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      return data.session.messages as ChatMessage[];
    },
    enabled: !!session?.user?.id && !!sessionId,
  });
}

/**
 * 创建新会话
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      return data.session as ChatSession;
    },
    onSuccess: () => {
      // 使会话列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

/**
 * 更新会话
 */
export function useUpdateSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSessionInput) => {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      const data = await response.json();
      return data.session as ChatSession;
    },
    onSuccess: () => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['chat-session', sessionId] });
    },
  });
}

/**
 * 删除会话
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      return sessionId;
    },
    onSuccess: () => {
      // 使会话列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

/**
 * 发送消息（乐观更新）
 */
export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: { content: string; role: 'user' | 'model' }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: message.content,
          role: message.role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    },
    // 乐观更新
    onMutate: async (newMessage) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });

      // 获取当前数据
      const previousMessages = queryClient.getQueryData<ChatMessage[]>([
        'chat-messages',
        sessionId,
      ]);

      // 乐观更新
      if (previousMessages) {
        queryClient.setQueryData<ChatMessage[]>(['chat-messages', sessionId], [
          ...previousMessages,
          {
            id: `temp-${Date.now()}`,
            session_id: sessionId,
            role: newMessage.role,
            content: newMessage.content,
            is_thinking: false,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      return { previousMessages };
    },
    // 如果失败，回滚
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', sessionId], context.previousMessages);
      }
    },
    // 总是重新获取
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    },
  });
}

/**
 * 搜索消息
 */
export function useSearchMessages(query: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['search-messages', query],
    queryFn: async () => {
      const response = await fetch(`/api/chat/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search messages');
      }
      const data = await response.json();
      return data.results as ChatMessage[];
    },
    enabled: !!session?.user?.id && query.length > 0,
  });
}
