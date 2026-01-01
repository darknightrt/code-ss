/**
 * 数据库模块导出
 */

// 客户端
export { supabase, supabaseAdmin } from './client';

// 类型
export type { Database } from './types';

// 加密工具
export { encrypt, decrypt, generateEncryptionKey } from './crypto';

// 错误处理
export {
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  withRetry,
  handleSupabaseError,
} from './errors';

// 测试工具
export { testDatabaseConnection, testRLSPolicies } from './test-connection';
