/**
 * 数据库操作错误
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * 数据验证错误
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends Error {
  constructor(
    message: string = 'Resource not found',
    public resource?: string,
    public id?: string
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * 重试机制工具函数
 * @param fn 要执行的异步函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 函数执行结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 如果是最后一次重试，直接抛出错误
      if (i === maxRetries - 1) {
        throw error;
      }

      // 某些错误不应该重试
      if (
        error instanceof AuthenticationError ||
        error instanceof AuthorizationError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // 等待后重试，使用指数退避
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * 处理 Supabase 错误并转换为应用错误
 */
export function handleSupabaseError(error: any): never {
  if (!error) {
    throw new DatabaseError('Unknown database error', 'UNKNOWN');
  }

  const message = error.message || 'Database operation failed';
  const code = error.code || 'UNKNOWN';

  // 根据错误代码分类
  switch (code) {
    case '23505': // unique_violation
      throw new ValidationError('Duplicate entry', undefined, error.details);
    
    case '23503': // foreign_key_violation
      throw new ValidationError('Referenced record does not exist', undefined, error.details);
    
    case '23502': // not_null_violation
      throw new ValidationError('Required field is missing', undefined, error.details);
    
    case '42501': // insufficient_privilege
      throw new AuthorizationError('Insufficient permissions to perform this operation');
    
    case 'PGRST116': // Row Level Security violation
      throw new AuthorizationError('Access denied by security policy');
    
    case 'PGRST301': // JWT expired
      throw new AuthenticationError('Session expired, please login again');
    
    default:
      throw new DatabaseError(message, code, error.details);
  }
}
