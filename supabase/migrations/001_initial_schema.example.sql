-- =====================================================
-- CodeSensei 数据库初始化脚本
-- 基于 NextAuth v5 + Supabase 架构
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. NextAuth Schema
-- =====================================================

CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- 用户表（扩展 NextAuth 标准字段）
CREATE TABLE IF NOT EXISTS next_auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    email_verified TIMESTAMPTZ,
    image TEXT,
    -- 扩展字段
    username TEXT UNIQUE,
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
    completed_tasks INTEGER DEFAULT 0 CHECK (completed_tasks >= 0),
    hours_focused DECIMAL(10,2) DEFAULT 0 CHECK (hours_focused >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 会话表
CREATE TABLE IF NOT EXISTS next_auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expires TIMESTAMPTZ NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- 账户表（OAuth）
CREATE TABLE IF NOT EXISTS next_auth.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    oauth_token_secret TEXT,
    oauth_token TEXT,
    user_id UUID REFERENCES next_auth.users(id) ON DELETE CASCADE,
    UNIQUE(provider, provider_account_id)
);

-- 验证令牌表
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
    identifier TEXT,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (token),
    UNIQUE(token, identifier)
);

-- 授权权限
GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;
GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;
GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;
GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- RLS 辅助函数：获取当前用户 ID
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_users_email ON next_auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON next_auth.users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON next_auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON next_auth.accounts(user_id);



-- =====================================================
-- 2. 业务数据表
-- =====================================================

-- 用户配置表
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

-- 聊天会话表
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

-- 聊天消息表
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model', 'system')),
    content TEXT NOT NULL,
    is_thinking BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自定义角色表
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

-- 学习计划表
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

-- 面试题库表
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

-- 错题本表
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

-- 导航书签表
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

-- 用户成就表
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_icon TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 专注趋势表
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
-- 3. 索引优化
-- =====================================================

-- 用户配置索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 聊天会话索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_order ON public.chat_sessions(user_id, order_index DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated ON public.chat_sessions(user_id, updated_at DESC);

-- 聊天消息索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id, created_at);
-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_search 
    ON public.chat_messages 
    USING GIN(to_tsvector('english', content));

-- 自定义角色索引
CREATE INDEX IF NOT EXISTS idx_custom_personas_user_id ON public.custom_personas(user_id);

-- 学习计划索引
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON public.learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_status ON public.learning_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_plans_deleted ON public.learning_plans(user_id, deleted_at);

-- 面试题库索引
CREATE INDEX IF NOT EXISTS idx_interview_questions_user_id ON public.interview_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_category ON public.interview_questions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_interview_questions_difficulty ON public.interview_questions(user_id, difficulty);

-- 错题本索引
CREATE INDEX IF NOT EXISTS idx_mistake_records_user_id ON public.mistake_records(user_id);
CREATE INDEX IF NOT EXISTS idx_mistake_records_question_id ON public.mistake_records(question_id);

-- 导航书签索引
CREATE INDEX IF NOT EXISTS idx_nav_items_user_id ON public.nav_items(user_id);
CREATE INDEX IF NOT EXISTS idx_nav_items_category ON public.nav_items(user_id, category);

-- 用户成就索引
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- 专注趋势索引
CREATE INDEX IF NOT EXISTS idx_focus_trends_user_date ON public.focus_trends(user_id, date DESC);



-- =====================================================
-- 4. Row Level Security (RLS) 策略
-- =====================================================

-- 启用 RLS
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

-- 用户配置 RLS
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (next_auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (next_auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (next_auth.uid() = user_id);

-- 聊天会话 RLS
CREATE POLICY "Users can manage own sessions"
    ON public.chat_sessions FOR ALL
    USING (next_auth.uid() = user_id);

-- 聊天消息 RLS（通过会话关联）
CREATE POLICY "Users can manage own messages"
    ON public.chat_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = next_auth.uid()
        )
    );

-- 自定义角色 RLS
CREATE POLICY "Users can manage own personas"
    ON public.custom_personas FOR ALL
    USING (next_auth.uid() = user_id);

-- 学习计划 RLS
CREATE POLICY "Users can manage own plans"
    ON public.learning_plans FOR ALL
    USING (next_auth.uid() = user_id);

-- 面试题库 RLS
CREATE POLICY "Users can manage own questions"
    ON public.interview_questions FOR ALL
    USING (next_auth.uid() = user_id);

-- 错题本 RLS
CREATE POLICY "Users can manage own mistakes"
    ON public.mistake_records FOR ALL
    USING (next_auth.uid() = user_id);

-- 导航书签 RLS
CREATE POLICY "Users can manage own nav items"
    ON public.nav_items FOR ALL
    USING (next_auth.uid() = user_id);

-- 用户成就 RLS
CREATE POLICY "Users can view own achievements"
    ON public.user_achievements FOR SELECT
    USING (next_auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (next_auth.uid() = user_id);

-- 专注趋势 RLS
CREATE POLICY "Users can manage own focus trends"
    ON public.focus_trends FOR ALL
    USING (next_auth.uid() = user_id);



-- =====================================================
-- 5. 触发器和函数
-- =====================================================

-- 自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有需要的表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON next_auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- 新用户初始化函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 创建用户配置
    INSERT INTO public.user_settings (user_id, theme, api_provider)
    VALUES (NEW.id, 'light', 'deepseek');
    
    -- 创建本周的专注趋势记录
    INSERT INTO public.focus_trends (user_id, date, day_name, focus_hours)
    SELECT 
        NEW.id,
        current_date + i,
        TO_CHAR(current_date + i, 'Dy'),
        0
    FROM generate_series(0, 6) AS i;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新用户触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON next_auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 计划完成时增加经验值的函数
CREATE OR REPLACE FUNCTION public.handle_plan_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 增加用户经验值
        UPDATE next_auth.users
        SET 
            xp = xp + 50,
            completed_tasks = completed_tasks + 1
        WHERE id = NEW.user_id;
        
        -- 检查是否升级
        UPDATE next_auth.users
        SET level = FLOOR(xp / 1000) + 1
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 计划完成触发器
CREATE TRIGGER on_plan_completed
    AFTER UPDATE ON public.learning_plans
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION public.handle_plan_completion();

-- =====================================================
-- 6. 视图（可选）
-- =====================================================

-- 用户统计视图
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
    u.id AS user_id,
    u.username,
    u.level,
    u.xp,
    u.streak_days,
    u.completed_tasks,
    u.hours_focused,
    COUNT(DISTINCT cs.id) AS total_sessions,
    COUNT(DISTINCT cm.id) AS total_messages,
    COUNT(DISTINCT lp.id) AS total_plans,
    COUNT(DISTINCT lp.id) FILTER (WHERE lp.status = 'completed') AS completed_plans,
    COUNT(DISTINCT ua.id) AS unlocked_achievements
FROM next_auth.users u
LEFT JOIN public.chat_sessions cs ON u.id = cs.user_id
LEFT JOIN public.chat_messages cm ON cs.id = cm.session_id
LEFT JOIN public.learning_plans lp ON u.id = lp.user_id AND lp.deleted_at IS NULL
LEFT JOIN public.user_achievements ua ON u.id = ua.user_id
GROUP BY u.id, u.username, u.level, u.xp, u.streak_days, u.completed_tasks, u.hours_focused;

-- =====================================================
-- 完成
-- =====================================================

-- 验证迁移
DO $$
BEGIN
    RAISE NOTICE 'Database schema initialized successfully!';
    RAISE NOTICE 'Tables created: %', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema IN ('next_auth', 'public')
        AND table_type = 'BASE TABLE'
    );
END $$;
