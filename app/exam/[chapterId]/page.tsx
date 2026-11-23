import React from 'react';
import { ExamRunner } from '@/components/ExamRunner';

interface PageProps {
  params: Promise<{ chapterId: string }>;
}

export default async function ExamPage({ params }: PageProps) {
  const { chapterId } = await params;
  return <ExamRunner chapterId={chapterId} />;
}
