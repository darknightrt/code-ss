import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('ENCRYPTION_KEY environment variable is required in production');
}

/**
 * 使用 AES-256-GCM 加密文本
 * @param text 要加密的明文
 * @returns 加密后的文本，格式为 "iv:authTag:encrypted"
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    console.warn('ENCRYPTION_KEY not set, returning plain text (development only)');
    return text;
  }

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * 解密使用 AES-256-GCM 加密的文本
 * @param encryptedText 加密的文本，格式为 "iv:authTag:encrypted"
 * @returns 解密后的明文
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    console.warn('ENCRYPTION_KEY not set, returning encrypted text as-is (development only)');
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * 生成一个随机的加密密钥（32字节，hex编码）
 * 用于生成 ENCRYPTION_KEY 环境变量的值
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
