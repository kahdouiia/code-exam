import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: Promise<{ questionId: string }>;
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت الزامی است.' }, { status: 401 });
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی فقط برای مدیر مجاز است.' }, { status: 403 });
    }

    const { questionId } = await context.params;
    const db = getDb();
    const deleted = await db.deleteQuestion(questionId);
    if (!deleted) {
      return NextResponse.json({ error: 'سوال مورد نظر یافت نشد.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete question error:', err);
    return NextResponse.json(
      { error: 'خطا در حذف سوال.' },
      { status: 500 }
    );
  }
}
