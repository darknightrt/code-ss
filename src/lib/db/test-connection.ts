/**
 * 数据库连接测试工具
 * 用于验证 Supabase 连接是否正常
 */

import { supabase } from './client';

export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // 测试基本连接
    const { data, error } = await supabase
      .from('next_auth.users')
      .select('count')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: '数据库连接失败',
        details: error,
      };
    }

    return {
      success: true,
      message: '数据库连接成功',
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      message: '数据库连接异常',
      details: error,
    };
  }
}

export async function testRLSPolicies(userId: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // 测试 RLS 策略
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return {
        success: false,
        message: 'RLS 策略测试失败',
        details: error,
      };
    }

    return {
      success: true,
      message: 'RLS 策略正常工作',
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'RLS 策略测试异常',
      details: error,
    };
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  (async () => {
    console.log('🔍 测试数据库连接...\n');

    const connectionResult = await testDatabaseConnection();
    console.log(
      connectionResult.success ? '✅' : '❌',
      connectionResult.message
    );
    if (connectionResult.details) {
      console.log('详情:', connectionResult.details);
    }

    console.log('\n测试完成！');
  })();
}
