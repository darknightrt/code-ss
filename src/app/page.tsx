'use client';

import { Dashboard } from '@/components/dashboard';
import { PlanList } from '@/components/plan/plan-list';
import { KnowledgeGraph } from '@/components/dashboard/knowledge-graph';

export default function HomePage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <Dashboard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[500px]">
          <PlanList hideControls />
        </div>
        <div className="h-[500px]">
          <KnowledgeGraph />
        </div>
      </div>
    </div>
  );
}
