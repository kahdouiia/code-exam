import React from 'react';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';
import { BookDetailView } from '@/components/BookDetailView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export default async function BookDetailPage({ params }: PageProps) {
  const { bookId } = await params;
  const session = await getSessionUser();
  const db = getDb();
  const book = await db.getBookWithChapters(bookId, session?.sub ?? null);

  if (!book) {
    notFound();
  }

  return <BookDetailView book={book} />;
}
