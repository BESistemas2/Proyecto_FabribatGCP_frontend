'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Settings,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { BrandLogo } from '@/components/shared/brand-logo';

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Header({ collapsed, onToggle }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="md:hidden"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          {/* En escritorio el logo ya está en el sidebar */}
          <Link href="/workbench" className="flex items-center md:hidden" aria-label="Inicio">
            <BrandLogo variant="horizontal" className="h-8" />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium">Conciliación Bancaria</p>
            <p className="text-xs text-muted-foreground">Fabribat</p>
          </div>

          {isAuthenticated && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-accent transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/cuentas" className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cuentas" className="flex items-center gap-2 w-full">
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cargas" className="flex items-center gap-2 w-full">
                    <Shield className="h-4 w-4" />
                    <span>Estado RPA</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{logoutLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}