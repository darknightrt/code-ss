'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings as SettingsIcon, Save, Key, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useUserSettings, useUpdateSettings } from '@/hooks/useSettings';
import { SUPPORTED_PROVIDERS, DEFAULT_MODELS } from '@/lib/constants';
import type { ApiProvider, Theme } from '@/types';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();

  const [theme, setTheme] = useState<Theme>('light');
  const [apiProvider, setApiProvider] = useState<ApiProvider>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // 加载设置
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme || 'light');
      setApiProvider(settings.api_provider || 'deepseek');
      
      const providerSettings = settings.provider_settings?.[settings.api_provider || 'deepseek'];
      if (providerSettings) {
        setApiKey(providerSettings.apiKey || '');
        setBaseUrl(providerSettings.baseUrl || '');
        setSelectedModel(providerSettings.selectedModel || '');
      }
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        theme,
        api_provider: apiProvider,
        provider_settings: {
          ...settings?.provider_settings,
          [apiProvider]: {
            apiKey,
            baseUrl,
            selectedModel,
            models: DEFAULT_MODELS[apiProvider].map(m => ({
              id: m,
              name: m,
              provider: apiProvider,
            })),
          },
        },
      });
      alert('设置已保存');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const currentProvider = SUPPORTED_PROVIDERS.find(p => p.id === apiProvider);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-blue-600" />
            系统设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 主题设置 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <Palette className="w-4 h-4" />
              主题设置
            </label>
            <div className="flex gap-3">
              {(['light', 'dark', 'matrix'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    theme === t
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t === 'light' && '☀️ 明亮'}
                  {t === 'dark' && '🌙 暗黑'}
                  {t === 'matrix' && '💚 黑客'}
                </button>
              ))}
            </div>
          </div>

          {/* API 提供商 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <Key className="w-4 h-4" />
              AI 提供商
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SUPPORTED_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setApiProvider(provider.id)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    apiProvider === provider.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{provider.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {provider.requiresUrl ? '需要配置 Base URL' : '官方 API'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`请输入 ${currentProvider?.name} API Key`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              API Key 将被加密存储
            </p>
          </div>

          {/* Base URL (仅 OpenAI 兼容) */}
          {currentProvider?.requiresUrl && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Base URL <span className="text-red-500">*</span>
              </label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                OpenAI 兼容 API 的基础 URL
              </p>
            </div>
          )}

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">模型选择</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">选择模型</option>
              {DEFAULT_MODELS[apiProvider].map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* 保存按钮 */}
          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending || !apiKey}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettings.isPending ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
