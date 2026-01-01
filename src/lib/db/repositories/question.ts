import { supabase } from '../client';
import { handleSupabaseError } from '../errors';
import type { Database } from '../types';

type InterviewQuestion = Database['public']['Tables']['interview_questions']['Row'];
type InterviewQuestionInsert = Database['public']['Tables']['interview_questions']['Insert'];
type InterviewQuestionUpdate = Database['public']['Tables']['interview_questions']['Update'];
type MistakeRecord = Database['public']['Tables']['mistake_records']['Row'];
type MistakeRecordInsert = Database['public']['Tables']['mistake_records']['Insert'];
type MistakeRecordUpdate = Database['public']['Tables']['mistake_records']['Update'];

/**
 * 面试题库和错题本数据访问层
 */
export class QuestionRepository {
  /**
   * 创建面试题
   */
  async createQuestion(
    userId: string,
    questionData: Omit<InterviewQuestionInsert, 'user_id'>
  ): Promise<InterviewQuestion> {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .insert({
          user_id: userId,
          ...questionData,
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
   * 获取用户的所有题目
   */
  async getQuestionsByUser(
    userId: string,
    options?: {
      category?: string;
      difficulty?: 'Easy' | 'Medium' | 'Hard';
      limit?: number;
      offset?: number;
    }
  ): Promise<InterviewQuestion[]> {
    try {
      let query = supabase
        .from('interview_questions')
        .select('*')
        .eq('user_id', userId);

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.difficulty) {
        query = query.eq('difficulty', options.difficulty);
      }

      query = query.order('created_at', { ascending: false });

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
   * 根据 ID 获取题目
   */
  async getQuestionById(questionId: string): Promise<InterviewQuestion | null> {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新题目
   */
  async updateQuestion(
    questionId: string,
    updates: InterviewQuestionUpdate
  ): Promise<InterviewQuestion> {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .update(updates)
        .eq('id', questionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 删除题目
   */
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 按难度筛选题目
   */
  async filterByDifficulty(
    userId: string,
    difficulty: 'Easy' | 'Medium' | 'Hard'
  ): Promise<InterviewQuestion[]> {
    return this.getQuestionsByUser(userId, { difficulty });
  }

  /**
   * 按分类筛选题目
   */
  async filterByCategory(
    userId: string,
    category: string
  ): Promise<InterviewQuestion[]> {
    return this.getQuestionsByUser(userId, { category });
  }

  /**
   * 获取所有分类
   */
  async getCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('category')
        .eq('user_id', userId);

      if (error) throw error;

      // 去重
      const categories = [...new Set(data.map(q => q.category))];
      return categories;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 搜索题目
   */
  async searchQuestions(
    userId: string,
    query: string
  ): Promise<InterviewQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 添加到错题本
   */
  async addToMistakeBook(
    userId: string,
    questionId: string,
    aiAnalysis?: string
  ): Promise<MistakeRecord> {
    try {
      const { data, error } = await supabase
        .from('mistake_records')
        .insert({
          user_id: userId,
          question_id: questionId,
          ai_analysis: aiAnalysis,
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
   * 从错题本移除
   */
  async removeFromMistakeBook(recordId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mistake_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新错题分析
   */
  async updateMistakeAnalysis(
    recordId: string,
    aiAnalysis: string
  ): Promise<MistakeRecord> {
    try {
      const { data, error } = await supabase
        .from('mistake_records')
        .update({ ai_analysis: aiAnalysis })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 增加复习次数
   */
  async incrementReviewCount(recordId: string): Promise<MistakeRecord> {
    try {
      // 先获取当前记录
      const { data: current, error: fetchError } = await supabase
        .from('mistake_records')
        .select('review_count')
        .eq('id', recordId)
        .single();

      if (fetchError) throw fetchError;

      // 更新复习次数
      const { data, error } = await supabase
        .from('mistake_records')
        .update({ review_count: (current.review_count || 0) + 1 })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取用户的错题本
   */
  async getMistakeBook(userId: string): Promise<
    Array<MistakeRecord & { question: InterviewQuestion }>
  > {
    try {
      const { data, error } = await supabase
        .from('mistake_records')
        .select('*, interview_questions(*)')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      // 转换数据格式
      return data.map((item: any) => ({
        ...item,
        question: item.interview_questions,
        interview_questions: undefined,
      }));
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 检查题目是否在错题本中
   */
  async isInMistakeBook(
    userId: string,
    questionId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('mistake_records')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取错题本统计
   */
  async getMistakeBookStatistics(userId: string): Promise<{
    total: number;
    byDifficulty: Record<string, number>;
    byCategory: Record<string, number>;
    averageReviewCount: number;
  }> {
    try {
      const mistakes = await this.getMistakeBook(userId);

      const stats = {
        total: mistakes.length,
        byDifficulty: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        averageReviewCount: 0,
      };

      let totalReviews = 0;

      mistakes.forEach(mistake => {
        const { question, review_count } = mistake;

        // 按难度统计
        stats.byDifficulty[question.difficulty] =
          (stats.byDifficulty[question.difficulty] || 0) + 1;

        // 按分类统计
        stats.byCategory[question.category] =
          (stats.byCategory[question.category] || 0) + 1;

        // 累计复习次数
        totalReviews += review_count;
      });

      // 计算平均复习次数
      if (stats.total > 0) {
        stats.averageReviewCount = Math.round(totalReviews / stats.total);
      }

      return stats;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取题目统计
   */
  async getQuestionStatistics(userId: string): Promise<{
    total: number;
    byDifficulty: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    try {
      const questions = await this.getQuestionsByUser(userId);

      const stats = {
        total: questions.length,
        byDifficulty: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
      };

      questions.forEach(question => {
        stats.byDifficulty[question.difficulty] =
          (stats.byDifficulty[question.difficulty] || 0) + 1;
        stats.byCategory[question.category] =
          (stats.byCategory[question.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
}

// 导出单例实例
export const questionRepository = new QuestionRepository();
