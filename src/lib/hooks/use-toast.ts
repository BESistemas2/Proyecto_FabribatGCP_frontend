'use client';

import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    toast: (options: {
      title: string;
      description?: string;
      variant?: 'default' | 'success' | 'destructive' | 'warning';
    }) => {
      const { variant = 'default', ...rest } = options;
      switch (variant) {
        case 'success':
          return sonnerToast.success(rest.title, { description: rest.description });
        case 'destructive':
          return sonnerToast.error(rest.title, { description: rest.description });
        case 'warning':
          return sonnerToast.warning(rest.title, { description: rest.description });
        default:
          return sonnerToast(rest.title, { description: rest.description });
      }
    },
    dismiss: sonnerToast.dismiss,
  };
}