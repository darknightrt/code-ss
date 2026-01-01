import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { questionRepository } from '@/lib/db/repositories';

/**
 * 获取用户的所有题目
 */
export function useQuestions() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['interview-questions', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await questionRepository.getQuestionsByUser(session.user.id);
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 创建题目
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (input: any) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await questionRepository.createQuestion(session.user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
    },
  });
}

/**
 * 获取错题本
 */
export function useMistakeBook() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['mistake-book', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await questionRepository.getMistakeBook(session.user.id);
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 添加到错题本
 */
export function useAddToMistakeBook() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await questionRepository.addToMistakeBook(session.user.id, questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistake-book'] });
    },
  });
}

/**
 * 更新错题分析
 */
export function useUpdateMistakeAnalysis() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({ questionId, analysis }: { questionId: string; analysis: string }) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await questionRepository.updateMistakeAnalysis(session.user.id, questionId, analysis);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistake-book'] });
    },
  });
}

/**
 * 删除题目
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await questionRepository.deleteQuestion(questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      queryClient.invalidateQueries({ queryKey: ['mistake-book'] });
    },
  });
}

/**
 * 从错题本移除
 */
export function useRemoveFromMistakeBook() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await questionRepository.removeFromMistakeBook(session.user.id, questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mistake-book'] });
    },
  });
}
