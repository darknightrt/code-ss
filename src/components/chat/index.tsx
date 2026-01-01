'use client';

/**
 * AI 聊天组件 - 数据库集成版本
 * 
 * 主要改进：
 * 1. 使用 React Query hooks 替代 Zustand
 * 2. 数据持久化到数据库
 * 3. 支持跨设备同步
 * 4. 乐观更新提升用户体验
 */

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { 
  useChatSessions, 
  useChatSession, 
  useSessionMessages,
  useSendMessage,
  useCreateSession,
  useDeleteSession,
  useUpdateSession,
} from '@/hooks/useChat';
import { useUserSettings } from '@/hooks/useSettings';
import { PERSONAS } from '@/lib/constants';
import { Send, User, Bot, Loader2, Copy, Sparkles, Check, Search, Download, X, Edit2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RoleConfigModal } from './role-config-modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { ChatSession } from '@/types';

// 代码块组件
const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-3 rounded-lg overflow-hidden border bg-[#1e1e1e] shadow-md">
      <div className="flex justify-between items-center px-4 py-1.5 bg-[#2d2d2d] border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono lowercase">{language || 'code'}</span>
        <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-200 leading-relaxed"><code>{code}</code></pre>
      </div>
    </div>
  );
};

// Markdown 渲染组件
const MessageContent = ({ content }: { content: string }) => {
  const markdownComponents: Components = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      
      if (!inline && language) {
        return <CodeBlock code={codeString} language={language} />;
      }
      
      return (
        <code 
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border" 
          {...props}
        >
          {children}
        </code>
      );
    },
    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 ml-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-2">{children}</ol>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 py-2 my-3 bg-muted/50 rounded-r">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary hover:underline font-medium"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export function AIChat() {
  // ========== UI 状态（来自 Zustand） ==========
  const { 
    activeSessionId, 
    setActiveSession, 
    isChatLoading, 
    setChatLoading,
  } = useStore();
  
  // ========== 数据状态（来自 React Query） ==========
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: activeSession } = useChatSession(activeSessionId || '');
  const { data: messages, isLoading: messagesLoading } = useSessionMessages(activeSessionId || '');
  
  // ========== Mutations ==========
  const sendMessage = useSendMessage(activeSessionId || '');
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession(activeSessionId || '');
  // TODO: 实现会话排序功能
  // const reorderSessions = useReorderSessions();
  
  // ========== 本地 UI 状态 ==========
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [configSessionId, setConfigSessionId] = useState<string | null>(null);
  const [isWideScreen, setIsWideScreen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ========== 计算属性 ==========
  const activePersona = activeSession 
    ? (PERSONAS.find((p) => p.id === activeSession.persona_id) || PERSONAS[0])
    : null;

  const filteredSessions = sessions?.filter((s: any) => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // ========== 副作用 ==========
  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isChatLoading]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (personaMenuRef.current && !personaMenuRef.current.contains(event.target as Node)) {
        setShowPersonaMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 编辑时自动聚焦
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  // ========== 事件处理 ==========
  const handleSend = async () => {
    if (!input.trim() || isChatLoading || !activeSessionId) return;

    const userMessage = input.trim();
    setInput('');
    setChatLoading(true);

    try {
      await sendMessage.mutateAsync({
        content: userMessage,
        role: 'user',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // 错误已经通过 React Query 的 onError 处理
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateSession = async (personaId: string) => {
    try {
      const persona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];
      const newSession = await createSession.mutateAsync({
        title: `与 ${persona.name} 的对话`,
        persona_id: personaId,
        tags: ['Frontend'],
      });
      setActiveSession(newSession.id);
      setShowPersonaMenu(false);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定删除此对话？')) return;
    
    try {
      await deleteSession.mutateAsync(sessionId);
      // 如果删除的是当前会话，切换到第一个会话
      if (activeSessionId === sessionId && sessions && sessions.length > 1) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setActiveSession(remainingSessions[0].id);
        } else {
          setActiveSession(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (editingSessionId && editingTitle.trim()) {
      try {
        await updateSession.mutateAsync({
          title: editingTitle.trim(),
        });
      } catch (error) {
        console.error('Failed to update session:', error);
      }
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const exportChat = () => {
    if (!activeSession || !messages) return;
    
    const persona = PERSONAS.find((p) => p.id === activeSession.persona_id) || PERSONAS[0];
    let markdown = `# ${activeSession.title}\n\n`;
    markdown += `**角色**: ${persona.name} ${persona.avatar}\n`;
    markdown += `**描述**: ${persona.description}\n`;
    markdown += `**对话数量**: ${messages.length}\n`;
    markdown += `**导出时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    markdown += `---\n\n`;
    
    messages.forEach((msg: any, index: number) => {
      const role = msg.role === 'user' ? '👤 用户' : `🤖 ${persona.name}`;
      const time = new Date(msg.created_at).toLocaleString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      
      markdown += `## ${role} - ${time}\n\n`;
      markdown += `${msg.content}\n\n`;
      
      if (index < messages.length - 1) {
        markdown += `---\n\n`;
      }
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${activeSession.title}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== 渲染 ==========
  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="flex h-full w-full overflow-hidden rounded-none border-0 shadow-none animate-in fade-in duration-500">
        {/* Sidebar */}
        <div className="w-16 md:w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-3 border-b space-y-2">
            <div className="hidden md:flex items-center gap-2 bg-background px-2.5 py-1.5 rounded-lg border">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input 
                className="bg-transparent border-none outline-none text-xs w-full" 
                placeholder="搜索历史..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="relative" ref={personaMenuRef}>
              <Button onClick={() => setShowPersonaMenu(!showPersonaMenu)} className="w-full">
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline ml-2">新建对话</span>
              </Button>
              {showPersonaMenu && (
                <div className="absolute top-full left-0 w-full mt-1.5 bg-background rounded-xl shadow-2xl border z-50 overflow-hidden animate-in fade-in">
                  <div className="p-1 space-y-0.5">
                    {PERSONAS.filter((p: any) => p.id !== 'interviewer').map((p: any) => (
                      <button 
                        key={p.id} 
                        onClick={() => handleCreateSession(p.id)} 
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent rounded-lg transition-colors group"
                      >
                        <span className="text-lg">{p.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold group-hover:text-primary">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{p.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {filteredSessions.map((session: any) => {
              const p = PERSONAS.find((per: any) => per.id === session.persona_id) || PERSONAS[0];
              const isActive = activeSessionId === session.id;
              const isEditing = editingSessionId === session.id;
              
              return (
                <div
                  key={session.id}
                  onClick={() => { if (!isEditing) setActiveSession(session.id); }}
                  className={`group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                    isActive ? 'bg-background border-border shadow-sm ring-1 ring-primary/10' : 'border-transparent hover:bg-accent/50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 bg-muted">{p.avatar}</div>
                  <div className="hidden md:block flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-1">
                      {isEditing ? (
                        <input
                          ref={editInputRef}
                          className="font-medium text-xs bg-primary/10 border-none outline-none rounded px-2 py-0.5 flex-1"
                          value={editingTitle}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') {
                              setEditingSessionId(null);
                              setEditingTitle('');
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditingTitle(e.target.value)}
                        />
                      ) : (
                        <>
                          <h4 className={`font-medium text-xs truncate flex-1 ${isActive ? '' : 'text-muted-foreground'}`}>
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSessionId(session.id);
                                setEditingTitle(session.title);
                              }}
                              className="p-1 text-muted-foreground hover:text-primary"
                              title="修改标题"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfigSessionId(session.id);
                              }}
                              className="p-1 text-muted-foreground hover:text-primary"
                              title="角色配置"
                            >
                              <Settings className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive"
                              title="删除对话"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        {activeSession ? (
          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b bg-background/80 backdrop-blur z-20">
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xl shadow-sm">
                  {activePersona?.avatar}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-sm truncate">{activeSession.title}</span>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium">{activePersona?.name}</span>
                    <span className="opacity-30">•</span>
                    <span>{messages?.length || 0} 条对话</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="lcon" 
                  onClick={() => setIsWideScreen(!isWideScreen)} 
                  title={isWideScreen ? "切换到居中模式" : "切换到宽屏模式"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isWideScreen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    )}
                  </svg>
                </Button>
                <Button variant="ghost" size="lcon" onClick={exportChat} title="导出记录">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className={`w-full py-8 space-y-8 ${isWideScreen ? 'max-w-5xl px-6' : 'max-w-4xl mx-auto px-6'}`}>
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  messages?.map((msg: any) => (
                    <div key={msg.id} className={`flex gap-4 animate-in fade-in ${msg.role === 'user' ? 'flex-row' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md mt-1 ${
                        msg.role === 'user' 
                          ? 'bg-foreground text-background' 
                          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                      }`}>
                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      <div className={`relative max-w-[85%] md:max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-card border rounded-tl-none'
                      }`}>
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <MessageContent content={msg.content} />
                        )}
                        <div className={`text-[10px] mt-2 opacity-40 font-mono ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isChatLoading && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="bg-card border px-5 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-sm">
                      <span className="text-xs text-primary font-bold tracking-widest uppercase">Thinking</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 md:p-6 bg-transparent z-10 border-t">
              <div className={`w-full ${isWideScreen ? 'px-4 md:px-6' : 'max-w-4xl mx-auto'}`}>
                <div className="flex items-center gap-3 bg-muted/80 backdrop-blur-sm p-3 rounded-2xl border focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all shadow-xl">
                  <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        handleSend(); 
                      } 
                    }} 
                    placeholder={`对 ${activePersona?.name} 提问...`} 
                    rows={1} 
                    className="flex-1 max-h-48 bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground resize-none px-3 py-2 text-[15px] leading-relaxed custom-scrollbar outline-none" 
                    style={{ minHeight: '65px' }} 
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!input.trim() || isChatLoading} 
                    size="lcon" 
                    className="rounded-xl self-center"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <div className="text-[10px] text-muted-foreground text-left pl-4 mt-2 opacity-60">
                  由 AI 生成，请注意甄别
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-sm font-bold uppercase tracking-widest">No Active Session</h3>
            <p className="text-[10px] mt-1 opacity-60">Create a new chat from the sidebar</p>
          </div>
        )}
      </Card>

      {/* Role Config Modal */}
      {configSessionId && sessions && (() => {
        const dbSession = sessions.find((s: any) => s.id === configSessionId);
        if (!dbSession) return null;
        
        // 转换数据库类型到组件期望的类型
        const uiSession: ChatSession = {
          id: dbSession.id,
          title: dbSession.title,
          personaId: dbSession.persona_id,
          messages: dbSession.messages?.map((m: any) => ({
            id: m.id,
            role: m.role as 'user' | 'model',
            content: m.content,
            timestamp: new Date(m.created_at).getTime(),
            isThinking: m.is_thinking,
          })) || [],
          tags: dbSession.tags,
          createdAt: new Date(dbSession.created_at).getTime(),
          updatedAt: new Date(dbSession.updated_at).getTime(),
          systemPromptOverride: dbSession.system_prompt_override || undefined,
          modelParams: dbSession.model_params || { temperature: 0.7 },
          order: dbSession.order_index,
          customPersona: dbSession.custom_persona,
        };
        
        return (
          <RoleConfigModal
            session={uiSession}
            onClose={() => setConfigSessionId(null)}
          />
        );
      })()}
    </>
  );
}
