'use client';

import { useState, useEffect } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ChatSession } from '@/types';

interface RoleConfigModalProps {
  session: ChatSession;
  onClose: () => void;
}

export function RoleConfigModal({ session, onClose }: RoleConfigModalProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  useEffect(() => {
    setSystemPrompt(session.systemPromptOverride || '');
    setTemperature(session.modelParams?.temperature || 0.7);
  }, [session]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt_override: systemPrompt || null,
          model_params: {
            ...session.modelParams,
            temperature,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      alert('角色配置已更新');
      onClose();
    } catch (error) {
      console.error('Failed to update role config:', error);
      alert('更新失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">角色配置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">
              系统提示词 (System Prompt)
            </label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="自定义 AI 角色的行为和风格..."
              rows={8}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              留空则使用默认角色设定
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium mb-2">
              温度 (Temperature): {temperature.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>更精确 (0.0)</span>
              <span>更创造性 (2.0)</span>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">会话标题:</span>{' '}
              <span className="font-medium">{session.title}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">消息数量:</span>{' '}
              <span className="font-medium">{session.messages?.length || 0}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">创建时间:</span>{' '}
              <span className="font-medium">
                {new Date(session.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} className="bg-primary">
            <Save className="w-4 h-4 mr-2" />
            保存配置
          </Button>
        </div>
      </div>
    </div>
  );
}
