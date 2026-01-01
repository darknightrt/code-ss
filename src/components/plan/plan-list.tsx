'use client';

import { useState } from 'react';
import { generateStudyPlan } from '@/lib/services/ai';
import {
  Plus,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
  BookOpen,
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, useCompletePlan } from '@/hooks/usePlans';
import { useUserSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PlanItem } from '@/types';

interface PlanListProps {
  hideControls?: boolean;
}

export function PlanList({ hideControls }: PlanListProps) {
  // React Query hooks
  const { data: plans = [], isLoading } = usePlans();
  const { data: settings } = useUserSettings();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const completePlan = useCompletePlan();

  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [showGenerator, setShowGenerator] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<PlanItem>>({});

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      // AI 生成计划会自动保存到数据库
      // API 路由会从数据库读取用户设置，不需要传递 settings
      await generateStudyPlan(topic, level);
      setShowGenerator(false);
      setTopic('');
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenNewPlan = () => {
    setEditingPlan({
      title: '',
      description: '',
      category: 'frontend',
      status: 'pending',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  const handleOpenEditPlan = (plan: PlanItem) => {
    setEditingPlan({ ...plan });
    setShowEditModal(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan.title) return;

    try {
      if (editingPlan.id) {
        await updatePlan.mutateAsync({
          planId: editingPlan.id,
          data: {
            title: editingPlan.title,
            description: editingPlan.description,
            status: editingPlan.status,
            progress: editingPlan.progress,
            start_date: editingPlan.startDate,
            end_date: editingPlan.endDate,
          },
        });
      } else {
        await createPlan.mutateAsync({
          title: editingPlan.title!,
          description: editingPlan.description,
          category: (editingPlan.category as any) || 'frontend',
          start_date: editingPlan.startDate!,
          end_date: editingPlan.endDate!,
        });
      }
      setShowEditModal(false);
    } catch (error) {
      console.error('保存计划失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('确定要删除这个计划吗？')) return;
    
    try {
      await deletePlan.mutateAsync(id);
    } catch (error) {
      console.error('删除计划失败:', error);
      alert('删除失败，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="h-full w-full flex flex-col rounded-none border-0 shadow-none animate-in fade-in duration-300">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-card dark:to-card border-b">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            学习计划
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">管理你的学习进度与目标</p>
        </div>
        {!hideControls && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenNewPlan}>
              <Plus className="w-4 h-4 mr-2" />
              新建计划
            </Button>
            <Button onClick={() => setShowGenerator(!showGenerator)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 生成
            </Button>
          </div>
        )}
      </CardHeader>

      {showGenerator && !hideControls && (
        <div className="p-6 bg-primary/5 border-b flex-shrink-0">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">想要学习什么技术？</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如: Vue3 源码, Node.js 性能优化..."
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">当前水平</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">入门 (Beginner)</SelectItem>
                  <SelectItem value="Intermediate">进阶 (Intermediate)</SelectItem>
                  <SelectItem value="Advanced">专家 (Advanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !topic} className="min-w-[120px]">
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : '开始生成'}
            </Button>
          </div>
        </div>
      )}

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>还没有计划，试着新建一个或让 AI 帮你制定！</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="group relative bg-card p-4 rounded-xl border hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={async () => {
                    if (plan.status === 'completed') {
                      await updatePlan.mutateAsync({
                        planId: plan.id,
                        data: { status: 'in-progress', progress: 50 },
                      });
                    } else {
                      await completePlan.mutateAsync(plan.id);
                    }
                  }}
                  disabled={updatePlan.isPending || completePlan.isPending}
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    plan.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {plan.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className={`font-semibold text-lg cursor-pointer hover:text-primary ${
                        plan.status === 'completed' ? 'text-muted-foreground line-through' : ''
                      }`}
                      onClick={() => handleOpenEditPlan({
                        ...plan,
                        startDate: plan.start_date,
                        endDate: plan.end_date,
                      })}
                    >
                      {plan.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditPlan({
                            ...plan,
                            startDate: plan.start_date,
                            endDate: plan.end_date,
                          })}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-3 whitespace-pre-wrap">{plan.description}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        {plan.startDate} ~ {plan.endDate}
                      </span>
                      <span className="uppercase tracking-wider px-2 py-1 bg-muted rounded">{plan.category}</span>
                    </div>
                    <span>{plan.progress}%</span>
                  </div>

                  <Progress value={plan.progress} className="h-1.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan.id ? '编辑计划' : '新建计划'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">标题</label>
              <Input
                value={editingPlan.title || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                placeholder="例如：学习 TypeScript 高级类型"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <Textarea
                value={editingPlan.description || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                placeholder="具体的学习内容和目标..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">分类</label>
                <Select
                  value={editingPlan.category || 'frontend'}
                  onValueChange={(v) => setEditingPlan({ ...editingPlan, category: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="backend">Backend</SelectItem>
                    <SelectItem value="algorithm">Algorithm</SelectItem>
                    <SelectItem value="soft-skills">Soft Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">状态</label>
                <Select
                  value={editingPlan.status || 'pending'}
                  onValueChange={(v) => setEditingPlan({ ...editingPlan, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">未开始</SelectItem>
                    <SelectItem value="in-progress">进行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">开始日期</label>
                <Input
                  type="date"
                  value={editingPlan.startDate || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">结束日期</label>
                <Input
                  type="date"
                  value={editingPlan.endDate || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex justify-between">
                <span>当前进度</span>
                <span className="text-primary font-bold">{editingPlan.progress || 0}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={editingPlan.progress || 0}
                onChange={(e) => setEditingPlan({ ...editingPlan, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSavePlan} 
              disabled={!editingPlan.title || createPlan.isPending || updatePlan.isPending}
            >
              {(createPlan.isPending || updatePlan.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
