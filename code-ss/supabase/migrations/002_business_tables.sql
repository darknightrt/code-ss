-- =====================================================
-- 业务数据表
-- =====================================================

-- =====================================================
-- 用户配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'matrix')),
    api_provider TEXT DEFAULT 'deepseek' CHECK (api_provider IN ('deepseek', 'qwen', 'doubao', 'openai')),
    provider_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- 聊天会话表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    persona_id TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    system_prompt_override TEXT,
    model_params JSONB DEFAULT '{"temperature": 0.7}'::jsonb,
    order_index BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    custom_persona JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 聊天消息表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model', 'system')),
    content TEXT NOT NULL,
    is_thinking BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 自定义角色表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.custom_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT NOT NULL,
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    greeting TEXT,
    avatar_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 学习计划表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.learning_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
    category TEXT NOT NULL CHECK (category IN ('frontend', 'backend', 'algorithm', 'soft-skills')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 面试题库表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interview_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 错题本表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mistake_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
    ai_analysis TEXT,
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    added_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- =====================================================
-- 导航书签表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nav_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    icon_url TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 用户成就表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_icon TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- 专注趋势表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.focus_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_name TEXT NOT NULL,
    focus_hours DECIMAL(5,2) DEFAULT 0 CHECK (focus_hours >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =====================================================
-- 触发器：自动更新 updated_at
-- =====================================================
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_personas_updated_at
    BEFORE UPDATE ON public.custom_personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_plans_updated_at
    BEFORE UPDATE ON public.learning_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_questions_updated_at
    BEFORE UPDATE ON public.interview_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mistake_records_updated_at
    BEFORE UPDATE ON public.mistake_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nav_items_updated_at
    BEFORE UPDATE ON public.nav_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_focus_trends_updated_at
    BEFORE UPDATE ON public.focus_trends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
