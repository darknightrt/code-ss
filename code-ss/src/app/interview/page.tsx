'use client';

import { InterviewSimulator } from '@/components/interview';
import { useRouter } from 'next/navigation';

export default function InterviewPage() {
  const router = useRouter();

  return <InterviewSimulator onStartChat={() => router.push('/chat')} />;
}
