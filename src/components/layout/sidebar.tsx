'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BrandLogo } from '@/components/shared/brand-logo';
import { ChevronLeft, ChevronRight, Activity, FileText, Settings, UploadCloud, LayoutDashboard } from 'lucide-react';

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
}

export function Sidebar({ navigation, pathname, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-20 h-screen border-r bg-card transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <Link href="/workbench" className="flex items-center" aria-label="Inicio">
            <BrandLogo variant="horizontal" priority className="h-10" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary text-primary-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.name : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="font-medium truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            v1.0.0 - Conciliación Bancaria
          </div>
        )}
      </div>
    </aside>
  );
}