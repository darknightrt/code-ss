-- =====================================================
-- 触发器和业务逻辑函数
-- =====================================================

-- =====================================================
-- 新用户初始化函数
-- =====================================================
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

-- =====================================================
-- 计划完成时增加经验值的函数
-- =====================================================
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
