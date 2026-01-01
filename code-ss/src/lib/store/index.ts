'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/types';

/**
 * 应用 UI 状态管理
 * 
 * 注意：此 Store 仅用于管理 UI 临时状态
 * 所有业务数据（聊天、计划、题库等）已迁移到数据库，通过 React Query hooks 访问
 */
interface AppState {
  // ========== 主题设置 ==========
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // ========== 聊天 UI 状态 ==========
  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;
  isChatLoading: boolean;
  setChatLoading: (loading: boolean) => void;

  // ========== 侧边栏状态 ==========
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // ========== 模态框状态 ==========
  isRoleConfigOpen: boolean;
  setRoleConfigOpen: (open: boolean) => void;
  isPlanModalOpen: boolean;
  setPlanModalOpen: (open: boolean) => void;
  isQuestionModalOpen: boolean;
  setQuestionModalOpen: (open: boolean) => void;

  // ========== 导航状态 ==========
  activeNavCategory: string;
  setActiveNavCategory: (category: string) => void;

  // ========== 面试模拟状态 ==========
  selectedDifficulty: string;
  setSelectedDifficulty: (difficulty: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // ========== 主题设置 ==========
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // ========== 聊天 UI 状态 ==========
      activeSessionId: null,
      setActiveSession: (id) => set({ activeSessionId: id }),
      isChatLoading: false,
      setChatLoading: (loading) => set({ isChatLoading: loading }),

      // ========== 侧边栏状态 ==========
      isSidebarOpen: true,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      // ========== 模态框状态 ==========
      isRoleConfigOpen: false,
      setRoleConfigOpen: (open) => set({ isRoleConfigOpen: open }),
      isPlanModalOpen: false,
      setPlanModalOpen: (open) => set({ isPlanModalOpen: open }),
      isQuestionModalOpen: false,
      setQuestionModalOpen: (open) => set({ isQuestionModalOpen: open }),

      // ========== 导航状态 ==========
      activeNavCategory: 'All',
      setActiveNavCategory: (category) => set({ activeNavCategory: category }),

      // ========== 面试模拟状态 ==========
      selectedDifficulty: 'All',
      setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),
      selectedCategory: 'All',
      setSelectedCategory: (category) => set({ selectedCategory: category }),
    }),
    {
      name: 'codesensei-ui-state',
      version: 3, // 版本号更新，标记重大重构
      // 只持久化用户偏好设置，不持久化临时状态
      partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);

/**
 * 数据迁移说明：
 * 
 * 以下数据已从 Zustand Store 迁移到数据库：
 * - plans: 使用 usePlans hook
 * - sessions: 使用 useChatSessions hook
 * - questionBank: 使用 useQuestions hook
 * - mistakeBook: 使用 useMistakeBook hook
 * - userStats: 使用 useUserStats hook
 * - focusTrends: 使用 useFocusTrends hook
 * - apiConfig: 使用 useUserSettings hook
 * - navItems: 使用 useNavItems hook
 * - userProfile: 使用 useSession hook (NextAuth)
 * - customPersonas: 使用 usePersonas hook
 * 
 * 请使用相应的 React Query hooks 访问这些数据
 */
