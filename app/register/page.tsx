import React, { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-[440px] mx-auto py-24 px-6" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
