-- =====================================================
-- 种子数据
-- =====================================================

-- 注意：这个文件用于开发环境的测试数据
-- 生产环境不应该运行这个文件

-- =====================================================
-- 创建测试用户
-- =====================================================
INSERT INTO next_auth.users (id, name, email, email_verified, username, level, xp)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@example.com', NOW(), 'testuser', 1, 0)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 默认成就列表（示例）
-- =====================================================
-- 注意：实际使用时，成就应该通过应用逻辑解锁，这里只是示例数据

-- =====================================================
-- 示例面试题
-- =====================================================
INSERT INTO public.interview_questions (user_id, category, title, description, difficulty)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'JavaScript',
    '什么是闭包？',
    '请解释 JavaScript 中的闭包概念，并给出一个实际应用场景。',
    'Medium'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'React',
    'React Hooks 的使用规则',
    '请列举 React Hooks 的使用规则，并解释为什么需要这些规则。',
    'Easy'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Algorithm',
    '实现二叉树的层序遍历',
    '给定一个二叉树，返回其节点值的层序遍历结果。',
    'Medium'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 示例学习计划
-- =====================================================
INSERT INTO public.learning_plans (user_id, title, description, status, category, progress, start_date, end_date)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'React 进阶学习',
    '深入学习 React 高级特性，包括性能优化、状态管理等',
    'in-progress',
    'frontend',
    30,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'TypeScript 类型系统',
    '掌握 TypeScript 的高级类型系统',
    'pending',
    'frontend',
    0,
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '37 days'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 示例导航书签
-- =====================================================
INSERT INTO public.nav_items (user_id, title, description, url, category)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'MDN Web Docs',
    'Mozilla 开发者网络文档',
    'https://developer.mozilla.org',
    'Documentation'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'React 官方文档',
    'React 官方中文文档',
    'https://react.dev',
    'Documentation'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'TypeScript 官方文档',
    'TypeScript 官方文档',
    'https://www.typescriptlang.org/docs',
    'Documentation'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 验证种子数据
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Test user created with email: test@example.com';
END $$;
