import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userRepository } from '@/lib/db/repositories';
import { encrypt, decrypt } from '@/lib/db/crypto';
import { handleSupabaseError } from '@/lib/db/errors';

/**
 * GET /api/settings
 * 获取用户配置
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let settings = await userRepository.getUserSettings(session.user.id);

    // 如果设置不存在，创建默认设置
    if (!settings) {
      settings = await userRepository.createUserSettings(session.user.id, {
        theme: 'light',
        api_provider: 'deepseek',
        provider_settings: {},
      });
    }

    // 解密敏感配置
    if (settings.provider_settings && typeof settings.provider_settings === 'object') {
      const providerSettings = settings.provider_settings as Record<string, any>;
      const decryptedSettings: Record<string, any> = {};

      for (const [key, value] of Object.entries(providerSettings)) {
        if (typeof value === 'string' && value.includes(':')) {
          // 假设加密的值包含冒号（iv:authTag:encrypted）
          try {
            decryptedSettings[key] = decrypt(value);
          } catch {
            // 如果解密失败，可能是未加密的值
            decryptedSettings[key] = value;
          }
        } else {
          decryptedSettings[key] = value;
        }
      }

      settings = {
        ...settings,
        provider_settings: decryptedSettings,
      };
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * 更新用户配置
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { theme, api_provider, provider_settings } = body;

    // 加密敏感配置
    let encryptedSettings = provider_settings;
    if (provider_settings && typeof provider_settings === 'object') {
      encryptedSettings = {};
      for (const [key, value] of Object.entries(provider_settings)) {
        // 加密 API keys 和其他敏感信息
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
          encryptedSettings[key] = encrypt(value as string);
        } else {
          encryptedSettings[key] = value;
        }
      }
    }

    const updatedSettings = await userRepository.updateUserSettings(
      session.user.id,
      {
        theme,
        api_provider,
        provider_settings: encryptedSettings,
      }
    );

    // 解密返回的设置
    if (updatedSettings.provider_settings && typeof updatedSettings.provider_settings === 'object') {
      const providerSettings = updatedSettings.provider_settings as Record<string, any>;
      const decryptedSettings: Record<string, any> = {};

      for (const [key, value] of Object.entries(providerSettings)) {
        if (typeof value === 'string' && value.includes(':')) {
          try {
            decryptedSettings[key] = decrypt(value);
          } catch {
            decryptedSettings[key] = value;
          }
        } else {
          decryptedSettings[key] = value;
        }
      }

      return NextResponse.json({
        settings: {
          ...updatedSettings,
          provider_settings: decryptedSettings,
        },
      });
    }

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update settings error:', error);
    handleSupabaseError(error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
