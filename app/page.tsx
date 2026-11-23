import React from 'react';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';
import { HomeWorkspace } from '@/components/HomeWorkspace';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSessionUser();
  const db = getDb();
  const books = await db.listBooksWithChapters(session?.sub ?? null);

  return <HomeWorkspace initialBooks={books} />;
}
