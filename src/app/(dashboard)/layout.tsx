"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileText, LayoutDashboard, Loader2, Settings, UploadCloud, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/lib/hooks/use-auth";

const NAVEGACION = [
  { name: "Workbench", href: "/workbench", icon: LayoutDashboard },
  { name: "Cargas ETL", href: "/cargas", icon: UploadCloud },
  { name: "Actas", href: "/actas", icon: FileText },
  { name: "Cuentas", href: "/cuentas", icon: Settings },
  { name: "Admin", href: "/admin/usuarios", icon: User, soloAdmin: true },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, esAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Respaldo del middleware: si la sesión se pierde estando en la app, volver al login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const navigation = NAVEGACION.filter((n) => !n.soloAdmin || esAdmin);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        navigation={navigation}
        pathname={pathname}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className={cn("flex-1 flex flex-col overflow-hidden", collapsed ? "ml-16" : "ml-64")}>
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
