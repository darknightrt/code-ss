'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Trophy, Flame, Target, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStats, useAchievements, useFocusTrends } from '@/hooks/useGrowth';
import { useStore } from '@/lib/store';

export function Dashboard() {
  const { theme } = useStore();
  const { data: userStats = null, isLoading: statsLoading } = useUserStats();
  const { data: achievements = [], isLoading: achievementsLoading } = useAchievements();
  const { data: focusTrends = [], isLoading: trendsLoading } = useFocusTrends();

  const chartColor = theme === 'matrix' ? '#00ff41' : '#8884d8';
  const chartFill = theme === 'matrix' ? 'url(#colorFocusMatrix)' : 'url(#colorFocus)';

  if (statsLoading || achievementsLoading || trendsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">无法加载用户统计数据</p>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>无法加载用户数据</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Level Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="font-medium opacity-90">等级 Level</span>
        </div>
        <div className="text-3xl font-bold mb-1">Lv.{userStats.level}</div>
        <div className="text-xs opacity-70">XP: {userStats.xp} / 5000</div>
        <div className="mt-2 h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/80" style={{ width: `${(userStats.xp / 5000) * 100}%` }} />
        </div>
      </div>

      {/* Streak Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
              <Flame className="w-5 h-5" />
            </div>
            <span className="font-medium text-muted-foreground">连胜 Streak</span>
          </div>
          <div className="text-3xl font-bold">
            {userStats.streak_days} <span className="text-sm font-normal text-muted-foreground">天</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">保持打卡，不要断！</div>
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <span className="font-medium text-muted-foreground">任务完成</span>
          </div>
          <div className="text-3xl font-bold">{userStats.completed_tasks}</div>
          <div className="text-xs text-muted-foreground mt-1">本周已完成计划</div>
        </CardContent>
      </Card>

      {/* Focus Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-medium text-muted-foreground">专注时长</span>
          </div>
          <div className="text-3xl font-bold">{userStats.hours_focused}h</div>
          <div className="text-xs text-muted-foreground mt-1">深度学习时间</div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">专注趋势分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusTrends}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFocusMatrix" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff41" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="focus"
                  stroke={chartColor}
                  fillOpacity={1}
                  fill={chartFill}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">成就徽章</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div
                key={a.achievement_id}
                className="flex flex-col items-center p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30"
              >
                <div className="text-2xl mb-1">{a.achievement_icon}</div>
                <span className="text-xs font-medium text-center">{a.achievement_name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
