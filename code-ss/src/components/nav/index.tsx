'use client';

import { useState, useMemo } from 'react';
import type { NavItem } from '@/types';
import { Plus, Search, ExternalLink, Edit2, Trash2, Globe, LayoutGrid, X, Save, Tag, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavItems, useCreateNavItem, useUpdateNavItem, useDeleteNavItem } from '@/hooks/useNavItems';

export function LearningNav() {
  const { data: navItems = [], isLoading } = useNavItems();
  const createNavItem = useCreateNavItem();
  const updateNavItem = useUpdateNavItem();
  const deleteNavItem = useDeleteNavItem();
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<NavItem>>({});

  const categories = useMemo(() => {
    const cats = Array.from(new Set(navItems.map((item) => item.category)));
    return ['All', ...cats.sort()];
  }, [navItems]);

  const existingCategories = useMemo(() => {
    return Array.from(new Set(navItems.map((item) => item.category))).filter((c) => !!c).sort();
  }, [navItems]);

  const filteredItems = useMemo(() => {
    return navItems.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [navItems, activeCategory, searchTerm]);

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://favicon.im/{domain}?larger=true`;
    } catch {
      return '';
    }
  };

  const handleOpenModal = (item?: NavItem) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({ title: '', description: '', url: '', category: activeCategory === 'All' ? 'Frontend' : activeCategory });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem.title || !editingItem.url || !editingItem.category) return;
    
    let url = editingItem.url;
    if (!url.startsWith('http')) url = 'https://' + url;
    
    try {
      const itemToSave = { ...editingItem, url };
      if (editingItem.id) {
        await updateNavItem.mutateAsync({
          id: editingItem.id,
          data: itemToSave as NavItem,
        });
      } else {
        await createNavItem.mutateAsync(itemToSave as Omit<NavItem, 'id'>);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个导航吗？')) return;
    
    try {
      await deleteNavItem.mutateAsync(id);
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <Card className="flex flex-col h-full w-full overflow-hidden relative rounded-none border-0 shadow-none animate-in fade-in duration-300">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <CardTitle className="flex items-center gap-2"><LayoutGrid className="w-6 h-6 text-primary" />全栈罗盘</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">你的专属全栈学习资源库与导航</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索资源..." className="pl-9" />
            </div>
            <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /><span className="hidden sm:inline">添加资源</span></Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map((cat) => (
            <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat)}>{cat}</Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-muted/30">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Globe className="w-16 h-16 mb-4 opacity-20" />
            <p>没有找到相关资源</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} onClick={() => window.open(item.url, '_blank')} className="group relative bg-card rounded-xl p-4 border hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer flex flex-col h-[170px]">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted p-1.5 border overflow-hidden">
                    {item.iconUrl ? <img src={item.iconUrl} alt="icon" className="w-full h-full object-contain" /> : <img src={getFaviconUrl(item.url)} onError={(e) => { (e.target as HTMLImageElement).src = 'https://unpkg.com/lucide-static@latest/icons/globe.svg'; }} alt="favicon" className="w-full h-full object-contain opacity-80" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-bold truncate mb-1 pr-4">{item.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description || '暂无描述'}</p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{item.category}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingItem.id ? '编辑资源' : '添加新资源'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> 链接地址</label>
              <Input value={editingItem.url || ''} onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">标题</label>
              <Input value={editingItem.title || ''} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="资源名称" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">标语 / 描述</label>
              <Textarea value={editingItem.description || ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} rows={2} placeholder="简短的描述..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> 分类标签</label>
              <Input value={editingItem.category || ''} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} placeholder="输入新分类或从下方选择..." className="mb-3" />
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-xl border border-dashed">
                {existingCategories.length === 0 && <span className="text-xs text-muted-foreground w-full text-center">暂无标签，请输入创建一个</span>}
                {existingCategories.map((cat) => {
                  const isActive = editingItem.category === cat;
                  return (
                    <button key={cat} onClick={() => setEditingItem({ ...editingItem, category: isActive ? '' : cat })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'bg-background border hover:border-primary/50'}`}>
                      {cat}
                      {isActive ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-50" />}
                    </button>
                  );
                })}
              </div>
            </div>
            {editingItem.url && (
              <div className="bg-muted p-3 rounded-lg border flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-background p-1 border"><img src={getFaviconUrl(editingItem.url)} alt="preview" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>
                <div className="text-xs text-muted-foreground">自动获取图标预览</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button 
              onClick={handleSave} 
              disabled={!editingItem.title || !editingItem.url || createNavItem.isPending || updateNavItem.isPending}
            >
              {(createNavItem.isPending || updateNavItem.isPending) ? (
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
