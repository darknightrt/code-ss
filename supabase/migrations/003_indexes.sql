-- =====================================================
-- 索引优化
-- =====================================================

-- =====================================================
-- 用户配置索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- =====================================================
-- 聊天会话索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_order ON public.chat_sessions(user_id, order_index DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated ON public.chat_sessions(user_id, updated_at DESC);

-- =====================================================
-- 聊天消息索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id, created_at);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_search 
    ON public.chat_messages 
    USING GIN(to_tsvector('english', content));

-- =====================================================
-- 自定义角色索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_custom_personas_user_id ON public.custom_personas(user_id);

-- =====================================================
-- 学习计划索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON public.learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_status ON public.learning_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_plans_deleted ON public.learning_plans(user_id, deleted_at);

-- =====================================================
-- 面试题库索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_interview_questions_user_id ON public.interview_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_category ON public.interview_questions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_interview_questions_difficulty ON public.interview_questions(user_id, difficulty);

-- =====================================================
-- 错题本索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_mistake_records_user_id ON public.mistake_records(user_id);
CREATE INDEX IF NOT EXISTS idx_mistake_records_question_id ON public.mistake_records(question_id);

-- =====================================================
-- 导航书签索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_nav_items_user_id ON public.nav_items(user_id);
CREATE INDEX IF NOT EXISTS idx_nav_items_category ON public.nav_items(user_id, category);

-- =====================================================
-- 用户成就索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- =====================================================
-- 专注趋势索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_focus_trends_user_date ON public.focus_trends(user_id, date DESC);
