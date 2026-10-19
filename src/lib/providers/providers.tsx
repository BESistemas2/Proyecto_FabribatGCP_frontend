'use client';

import { ReactNode } from 'react';
import { QueryProvider } from '@/lib/providers/query-provider';
import { ToastProvider } from '@/lib/providers/toast-provider';
import { AuthProvider } from '@/lib/hooks/use-auth';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider />
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}