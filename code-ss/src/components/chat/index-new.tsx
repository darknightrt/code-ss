'use client';

import { useState } from 'react';
import { PERSONAS } from '@/lib/constants';
import { X, Save, Plus, Trash2, Settings2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Persona, ChatSession, Message } from '@/types';
import { usePersonas, useCreatePersona, useDeletePersona } from '@/hooks/usePersonas';
import { useUpdateSession, useSendMessage } from '@/hooks/useChat';

interface RoleConfigModalProps {
  session: ChatSession;
  onClose: () => void;
}

export function RoleConfigModal({ session, onClose }: RoleConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom' | 'params'>('preset');
  
  // React Query hooks
  const { data: customPersonas = [], isLoading: personasLoading } = usePersonas();
  const createPersona = useCreatePersona();
  const deletePersona = useDeletePersona();
  const updateSession = useUpdateSession(session.id);
  const sendMessage = useSendMessage(session.id);
  
  // 获取当前角色（可能是预设或自定义）
  const allPersonas = [...PERSONAS, ...customPersonas];
  const currentPersona = session.customPersona || allPersonas.find(p => p.id === session.personaId) || PERSONAS[0];
  
  // 自定义角色表单
  const [customForm, setCustomForm] = useState<Partial<Persona>>({
    avatar: '🤖',
    name: '',
    role: '',
    description: '',
    systemPrompt: '',
  });

  // 参数调优
  const [params, setParams] = useState(session.modelParams);

  const handleApplyPreset = async (persona: Persona) => {
    try {
      // 获取介绍语：预设角色使用自己的 greeting，自定义角色使用通用介绍语
      const greeting = persona.isCustom 
        ? `你好！我是 ${persona.name}。很高兴为你服务，有什么我可以帮助你的吗？`
        : (persona.greeting || `你好！我是 ${persona.name}。有什么我可以帮助你的吗？`);
      
      // 更新会话
      await updateSession.mutateAsync({
        persona_id: persona.id,
        custom_persona: undefined,
        system_prompt_override: undefined,
        title: `与 ${persona.name} 的对话`,
      });
      
      // 添加介绍语消息
      await sendMessage.mutateAsync({
        role: 'model',
        content: greeting,
      });
      
      onClose();
    } catch (error) {
      console.error('应用角色失败:', error);
      alert('应用角色失败，请重试');
    }
  };

  const handleSaveCustom = async () => {
    if (!customForm.name || !customForm.systemPrompt) {
      alert('请填写角色名称和系统提示词');
      return;
    }
    
    try {
      // 创建自定义角色
      const newPersona = await createPersona.mutateAsync({
        name: customForm.name!,
        role: customForm.role || 'Custom',
        avatar: customForm.avatar || '🤖',
        description: customForm.description || '',
        systemPrompt: customForm.systemPrompt!,
      });
      
      // 自定义角色使用通用介绍语
      const greeting = `你好！我是 ${newPersona.name}。很高兴为你服务，有什么我可以帮助你的吗？`;
      
      // 更新会话
      await updateSession.mutateAsync({
        persona_id: newPersona.id,
        custom_persona: newPersona,
        title: `与 ${newPersona.name} 的对话`,
      });
      
      // 添加介绍语消息
      await sendMessage.mutateAsync({
        role: 'model',
        content: greeting,
      });
      
      // 重置表单
      setCustomForm({
        name: '',
        role: '',
        avatar: '🤖',
        description: '',
        systemPrompt: '',
      });
      
      onClose();
    } catch (error) {
      console.error('保存自定义角色失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleSaveParams = async () => {
    try {
      await updateSession.mutateAsync({ model_params: params });
      onClose();
    } catch (error) {
      console.error('保存参数失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDeleteCustomPersona = async (id: string) => {
    if (!confirm('确定删除此自定义角色？')) return;
    
    try {
      await deletePersona.mutateAsync(id);
      
      // 如果当前会话使用的是被删除的角色，切换到默认角色
      if (session.personaId === id) {
        await updateSession.mutateAsync({
          persona_id: PERSONAS[0].id,
          custom_persona: undefined,
          title: `与 ${PERSONAS[0].name} 的对话`,
        });
      }
    } catch (error) {
      console.error('删除角色失败:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
              {currentPersona.avatar}
            </div>
            <div>
              <h2 className="text-lg font-bold">角色配置</h2>
              <p className="text-xs text-muted-foreground">当前: {currentPersona.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="lcon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/20">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'preset'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            预设角色库
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'custom'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            自定义角色
          </button>
          <button
            onClick={() => setActiveTab('params')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'params'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings2 className="w-4 h-4 inline mr-2" />
            参数调优
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'preset' && (
            <>
              {personasLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allPersonas.map((persona) => (
                <Card
                  key={persona.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group ${
                    currentPersona.id === persona.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleApplyPreset(persona)}
                >
                  <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                      {persona.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-sm">{persona.name}</h3>
                        {persona.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomPersona(persona.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{persona.description}</p>
                      <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2 max-h-20 overflow-y-auto custom-scrollbar">
                        {persona.systemPrompt.slice(0, 150)}...
                      </div>
                    </div>
                  </div>
                </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">角色名称</label>
                  <Input
                    placeholder="例如：代码审查专家"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">角色标签</label>
                  <Input
                    placeholder="例如：Code Reviewer"
                    value={customForm.role}
                    onChange={(e) => setCustomForm({ ...customForm, role: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">头像 Emoji</label>
                <Input
                  placeholder="🤖"
                  value={customForm.avatar}
                  onChange={(e) => setCustomForm({ ...customForm, avatar: e.target.value })}
                  className="text-2xl"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">角色描述</label>
                <Textarea
                  placeholder="简短描述这个角色的特点和用途..."
                  value={customForm.description}
                  onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">系统提示词</label>
                <Textarea
                  placeholder="定义角色的行为、风格和专业领域..."
                  value={customForm.systemPrompt}
                  onChange={(e) => setCustomForm({ ...customForm, systemPrompt: e.target.value })}
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  提示词将决定 AI 的回答风格和专业方向
                </p>
              </div>

              <Button 
                onClick={handleSaveCustom} 
                className="w-full"
                disabled={createPersona.isPending || updateSession.isPending}
              >
                {createPersona.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                保存并应用
              </Button>
            </div>
          )}

          {activeTab === 'params' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Temperature (创造性)</label>
                  <span className="text-sm font-mono text-primary">{params.temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={params.temperature}
                  onChange={(e) => setParams({ ...params, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  较低值使输出更确定，较高值使输出更随机和创造性
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Top K (候选词数量)</label>
                  <span className="text-sm font-mono text-primary">{params.topK || 40}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={params.topK || 40}
                  onChange={(e) => setParams({ ...params, topK: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  限制每步采样的候选词数量，影响输出的多样性
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Max Output Tokens (最大输出长度)</label>
                  <span className="text-sm font-mono text-primary">{params.maxOutputTokens || 2048}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={params.maxOutputTokens || 2048}
                  onChange={(e) => setParams({ ...params, maxOutputTokens: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  控制 AI 回复的最大长度
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveParams} 
                  className="flex-1"
                  disabled={updateSession.isPending}
                >
                  {updateSession.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  保存参数
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setParams({ temperature: 0.7, topK: 40, maxOutputTokens: 2048 })}
                >
                  重置默认
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
