-- =====================================================
-- 视图（可选）
-- =====================================================

-- =====================================================
-- 用户统计视图
-- =====================================================
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
-- 验证迁移
-- =====================================================
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
