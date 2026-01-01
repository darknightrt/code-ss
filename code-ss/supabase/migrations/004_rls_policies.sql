-- =====================================================
-- Row Level Security (RLS) 策略
-- =====================================================

-- =====================================================
-- 启用 RLS
-- =====================================================
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_trends ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 用户配置 RLS
-- =====================================================
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (next_auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (next_auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (next_auth.uid() = user_id);

-- =====================================================
-- 聊天会话 RLS
-- =====================================================
CREATE POLICY "Users can manage own sessions"
    ON public.chat_sessions FOR ALL
    USING (next_auth.uid() = user_id);

-- =====================================================
-- 聊天消息 RLS（通过会话关联）
-- =====================================================
CREATE POLICY "Users can manage own messages"
    ON public.chat_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = next_auth.uid()
        )
    );

-- =====================================================
-- 自定义角色 RLS
-- =====================================================
CREATE POLICY "Users can manage own personas"
    ON public.custom_personas FOR ALL
    USING (next_auth.uid() = user_id);

-- =====================================================
-- 学习计划 RLS
-- =====================================================
CREATE POLICY "Users can manage own plans"
    ON public.learning_plans FOR ALL
    USING (next_auth.uid() = user_id);

-- =====================================================
-- 面试题库 RLS
-- =====================================================
CREATE POLICY "Users can manage own questions"
    ON public.interview_questions FOR ALL
    USING (next_auth.uid() = user_id);

-- =====================================================
-- 错题本 RLS
-- =====================================================
CREATE POLICY "Users can manage own mistakes"
    ON public.mistake_records FOR ALL
    USING (next_auth.uid() = user_id);

-- =====================================================
-- 导航书签 RLS
-- =====================================================
CREATE POLICY "Users can manage own nav items"
    ON public.nav_items FOR ALL
    USING (next_auth.uid() = user_id);

-- =====================================================
-- 用户成就 RLS
-- =====================================================
CREATE POLICY "Users can view own achievements"
    ON public.user_achievements FOR SELECT
    USING (next_auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (next_auth.uid() = user_id);

-- =====================================================
-- 专注趋势 RLS
-- =====================================================
CREATE POLICY "Users can manage own focus trends"
    ON public.focus_trends FOR ALL
    USING (next_auth.uid() = user_id);
