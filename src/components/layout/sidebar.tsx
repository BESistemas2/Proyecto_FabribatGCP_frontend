'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BrandLogo } from '@/components/shared/brand-logo';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  navigation: NavItem[];
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  /** Pantallas pequeñas: el menú se abre encima del contenido */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ navigation, pathname, collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  // En móvil el menú siempre se muestra completo (no colapsado)
  const compacto = collapsed && !mobileOpen;
  return (
    <>
    {mobileOpen && (
      <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onMobileClose} aria-hidden="true" />
    )}
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-dvh flex-col border-r bg-card transition-all duration-300',
        'w-64 -translate-x-full md:z-20 md:translate-x-0',
        mobileOpen && 'translate-x-0 shadow-xl',
        compacto && 'md:w-16'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!compacto && (
          <Link href="/workbench" className="flex items-center" aria-label="Inicio" onClick={onMobileClose}>
            <BrandLogo variant="horizontal" priority className="h-10" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('hidden h-8 w-8 md:inline-flex', compacto && 'mx-auto')}
          aria-label={compacto ? 'Expandir menú' : 'Colapsar menú'}
        >
          {compacto ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onMobileClose} className="h-8 w-8 md:hidden" aria-label="Cerrar menú">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="Navegación principal">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive &&
                  'bg-primary/[0.07] font-semibold text-primary hover:bg-primary/10 hover:text-primary before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-brand-yellow',
                compacto && 'justify-center'
              )}
              onClick={onMobileClose}
              title={compacto ? item.name : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {!compacto && <span className="font-medium truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        {!compacto && (
          <div className="text-xs text-muted-foreground text-center">
            v1.0.0 - Conciliación Bancaria
          </div>
        )}
      </div>
    </aside>
    </>
  );
}