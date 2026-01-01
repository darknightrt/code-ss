'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Upload, Image as ImageIcon, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const defaultAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sensei',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot',
];

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [username, setUsername] = useState('');
  const [localAvatar, setLocalAvatar] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.name || '');
      setLocalAvatar(session.user.image || defaultAvatars[0]);
    }
  }, [session]);

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      alert('请输入用户名');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: 调用API更新用户资料
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: username.trim(), 
          image: localAvatar 
        }),
      });

      if (!response.ok) {
        throw new Error('更新失败');
      }
      
      // 更新session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: username.trim(),
          image: localAvatar,
        },
      });
      
      alert('个人资料已更新');
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLocalAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="w-7 h-7 text-green-600" />
            个人设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-10">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-border group shadow-md cursor-pointer"
                onClick={() => setShowAvatarModal(true)}
                title="点击查看大图"
              >
                {localAvatar ? (
                  <img
                    src={localAvatar}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" /> 上传图片
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <p className="text-[10px] text-muted-foreground text-center">
                  支持 JPG, PNG (Max 2MB)
                </p>
              </div>
            </div>

            {/* Details Section */}
            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  用户名 / 昵称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入您的昵称"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> 推荐头像
                </label>
                <div className="flex gap-4 flex-wrap">
                  {defaultAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLocalAvatar(url)}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                        localAvatar === url
                          ? 'border-green-500 ring-2 ring-green-500/30'
                          : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img src={url} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving || !username.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? '保存中...' : '保存资料'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Viewer Modal */}
      {showAvatarModal && localAvatar && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative max-w-lg w-full aspect-square">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={localAvatar}
              alt="Full Avatar"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
