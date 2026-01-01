'use client';

import { useState, useRef, useEffect } from 'react';
import type { InterviewQuestion, MistakeRecord } from '@/types';
import { generateMistakeAnalysis } from '@/lib/services/ai';
import { Play, Trash2, Upload, Download, Plus, Briefcase, Code, Database, Cpu, Search, BookX, AlertCircle, BrainCircuit, CheckCircle2, BookmarkPlus, ChevronUp, Loader2, X } from 'lucide-react';
import { useQuestions, useCreateQuestion, useDeleteQuestion, useMistakeBook, useAddToMistakeBook, useRemoveFromMistakeBook, useUpdateMistakeAnalysis } from '@/hooks/useQuestions';
import { useUserSettings } from '@/hooks/useSettings';
import { useCreateSession } from '@/hooks/useChat';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InterviewSimulatorProps {
  onStartChat: () => void;
}

export function InterviewSimulator({ onStartChat }: InterviewSimulatorProps) {
  // React Query hooks
  const { data: questionBank = [], isLoading: questionsLoading } = useQuestions();
  const { data: mistakeBook = [], isLoading: mistakesLoading } = useMistakeBook();
  const { data: settings } = useUserSettings();
  const createQuestion = useCreateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const addToMistakeBook = useAddToMistakeBook();
  const removeFromMistakeBook = useRemoveFromMistakeBook();
  const updateMistakeAnalysis = useUpdateMistakeAnalysis();
  const createSession = useCreateSession();
  
  const [activeTab, setActiveTab] = useState<'practice' | 'manage' | 'mistakes'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('interview_active_tab') as any) || 'practice';
    return 'practice';
  });
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try { const saved = localStorage.getItem('interview_expanded_reports'); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
    }
    return {};
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQ, setNewQ] = useState<Partial<InterviewQuestion>>({ category: 'Vue3', difficulty: 'Medium', title: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('interview_active_tab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('interview_expanded_reports', JSON.stringify(expandedReports)); }, [expandedReports]);

  const filteredQuestions = questionBank.filter((q) => q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.category.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = Array.from(new Set(filteredQuestions.map((q) => q.category))).sort();

  const handleStartInterview = async (q: InterviewQuestion) => {
    const prompt = `你现在是阿里P8前端面试官。请针对"${q.title}"这个话题对我进行面试。题目描述：${q.description || '无'}。请先不要直接解释答案，而是以面试官的身份向我提问，考察我对这个知识点的深度理解。如果我回答得好，请继续深挖底层原理；如果回答不出来，请适当引导。`;
    const initialMsg = `你好，我是面试官。我看你简历上写了关于 ${q.title} 的内容。能具体讲讲你的理解吗？`;
    
    try {
      await createSession.mutateAsync({
        title: `面试：${q.title}`,
        persona_id: 'interviewer',
        system_prompt_override: prompt,
        // 初始消息会在创建会话后自动添加
      });
      onStartChat();
    } catch (error) {
      console.error('创建面试会话失败:', error);
      alert('创建面试会话失败，请重试');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          const existingIds = new Set(questionBank.map((q) => q.id));
          const existingTitles = new Set(questionBank.map((q) => q.title));
          const newQuestions = json.filter((q: InterviewQuestion) => { if (!q.title || !q.category) return false; return !existingIds.has(q.id) && !existingTitles.has(q.title); });
          if (newQuestions.length > 0) { 
            // TODO: 实现批量导入API
            alert('批量导入功能开发中'); 
          } else { 
            alert('未发现新题目（可能全部重复）'); 
          }
        }
      } catch { alert('导入失败：文件格式错误'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questionBank, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'interview_questions.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleAddQuestion = async () => {
    if (!newQ.title || !newQ.category) return;
    
    try {
      await createQuestion.mutateAsync({
        title: newQ.title,
        category: newQ.category,
        difficulty: (newQ.difficulty as any) || 'Medium',
        description: newQ.description,
      });
      setShowAddModal(false);
      setNewQ({ category: 'Vue3', difficulty: 'Medium', title: '', description: '' });
    } catch (error) {
      console.error('添加题目失败:', error);
      alert('添加失败，请重试');
    }
  };

  const toggleReport = (id: string) => setExpandedReports((prev) => ({ ...prev, [id]: !prev[id] }));

  const generateAnalysis = async (mistake: any) => {
    // 数据库返回的是 snake_case 字段
    const aiAnalysis = mistake.ai_analysis || mistake.aiAnalysis;
    const questionId = mistake.question_id || mistake.questionId;
    const questionTitle = mistake.question?.title || mistake.title;
    
    if (aiAnalysis || !settings) return;
    setAnalyzingId(mistake.id);
    try {
      // API路由会从数据库读取用户设置，不需要传递settings
      const analysis = await generateMistakeAnalysis(questionTitle);
      await updateMistakeAnalysis.mutateAsync({
        questionId,
        analysis,
      });
      setExpandedReports((prev) => ({ ...prev, [mistake.id]: true }));
    } catch (e) {
      console.error(e);
      alert('生成分析失败，请重试');
    } finally {
      setAnalyzingId(null);
    }
  };

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'Easy': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'Medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Hard': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="flex flex-col h-full w-full overflow-hidden relative rounded-none border-0 shadow-none animate-in fade-in duration-500">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between p-4 border-b bg-card/50 backdrop-blur">
        <div className="flex gap-2">
          <Button variant={activeTab === 'practice' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('practice')}><Code className="w-4 h-4 mr-2" />模拟面试</Button>
          <Button variant={activeTab === 'mistakes' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('mistakes')} className={activeTab === 'mistakes' ? 'bg-red-500 hover:bg-red-600' : ''}><BookX className="w-4 h-4 mr-2" />错题本{mistakeBook.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{mistakeBook.length}</span>}</Button>
          <Button variant={activeTab === 'manage' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('manage')}><Database className="w-4 h-4 mr-2" />题库管理</Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeTab === 'practice' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input placeholder="搜索题目 (例如: Vue3, Fiber...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            {questionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground"><Briefcase className="w-16 h-16 mx-auto mb-4 opacity-20" /><p>没有找到相关题目</p></div>
            ) : (
              categories.map((category) => (
                <div key={category}>
                  <h3 className="flex items-center gap-2 font-bold text-muted-foreground mb-3 text-sm uppercase tracking-wider"><Cpu className="w-4 h-4" />{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredQuestions.filter((q) => q.category === category).map((q) => (
                      <div key={q.id} className="group flex flex-col justify-between bg-card p-4 rounded-xl border hover:shadow-lg hover:border-black-200 dark:hover:border-black-900 transition-all h-full">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={async () => {
                                  try {
                                    await addToMistakeBook.mutateAsync(q.id);
                                  } catch (error) {
                                    console.error('加入错题本失败:', error);
                                    alert('加入失败，请重试');
                                  }
                                }}
                                disabled={addToMistakeBook.isPending}
                                className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" 
                                title="加入错题本"
                              >
                                <BookmarkPlus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-semibold mb-2 line-clamp-2 min-h-[3rem]" title={q.title}>{q.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">{q.description || '暂无描述'}</p>
                        </div>
                        <Button variant="outline" onClick={() => handleStartInterview(q)} className="w-full mt-auto"><Play className="w-4 h-4 mr-2" />开始模拟</Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="space-y-4 animate-in fade-in">
            {mistakesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : mistakeBook.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground"><CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20" /><p>太棒了！目前没有错题记录。</p></div>
            ) : (
              mistakeBook.map((mistake) => (
                <div key={mistake.id} className="bg-card rounded-xl border overflow-hidden shadow-sm">
                  <div className="p-4 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
                      <div><h4 className="font-bold">{mistake.question.title}</h4><div className="text-xs text-muted-foreground mt-0.5">记录时间: {mistake.added_at}</div></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleReport(mistake.id)}>{expandedReports[mistake.id] ? <ChevronUp className="w-4 h-4 mr-1" /> : <BrainCircuit className="w-4 h-4 mr-1" />}{expandedReports[mistake.id] ? '收起分析' : 'AI 分析'}</Button>
                      <Button 
                        variant="ghost" 
                        size="lcon" 
                        onClick={async () => {
                          try {
                            await removeFromMistakeBook.mutateAsync(mistake.question_id);
                          } catch (error) {
                            console.error('移除失败:', error);
                            alert('移除失败，请重试');
                          }
                        }}
                        disabled={removeFromMistakeBook.isPending}
                        title="已掌握，移除"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </Button>
                    </div>
                  </div>
                  {expandedReports[mistake.id] && (
                    <div className="p-6 border-t bg-muted/30 animate-in slide-in-from-top-2">
                      {mistake.ai_analysis ? (
                        <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: mistake.ai_analysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">暂无分析报告</p>
                          <Button onClick={() => generateAnalysis(mistake)} disabled={analyzingId === mistake.id}>{analyzingId === mistake.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}生成技术难点分析</Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex gap-4 mb-6">
              <Button onClick={() => setShowAddModal(true)} className="flex-1"><Plus className="w-5 h-5 mr-2" />手动录入题目</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1"><Upload className="w-5 h-5 mr-2" />导入 JSON 题库</Button>
              <Button variant="outline" onClick={handleExport} className="flex-1"><Download className="w-5 h-5 mr-2" />导出备份</Button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
            </div>
            <div className="bg-card rounded-xl border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground uppercase tracking-wider font-medium">
                  <tr><th className="px-6 py-3">题目</th><th className="px-6 py-3">分类</th><th className="px-6 py-3">难度</th><th className="px-6 py-3 text-right">操作</th></tr>
                </thead>
                <tbody className="divide-y">
                  {questionBank.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">{q.title}</td>
                      <td className="px-6 py-3 text-muted-foreground">{q.category}</td>
                      <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</span></td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={async () => {
                            try {
                              await deleteQuestion.mutateAsync(q.id);
                            } catch (error) {
                              console.error('删除失败:', error);
                              alert('删除失败，请重试');
                            }
                          }}
                          disabled={deleteQuestion.isPending}
                          className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>录入新题</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">题目</label><Input value={newQ.title} onChange={(e) => setNewQ({ ...newQ, title: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">描述</label><Textarea value={newQ.description || ''} onChange={(e) => setNewQ({ ...newQ, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">分类</label><Input value={newQ.category} onChange={(e) => setNewQ({ ...newQ, category: e.target.value })} placeholder="e.g. React" /></div>
              <div><label className="block text-sm font-medium mb-1">难度</label><Select value={newQ.difficulty} onValueChange={(v) => setNewQ({ ...newQ, difficulty: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Hard">Hard</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddQuestion} 
              disabled={!newQ.title || createQuestion.isPending}
            >
              {createQuestion.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
