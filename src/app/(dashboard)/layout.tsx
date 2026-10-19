"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Settings,
  User,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const navigation = [
  { name: "Workbench", href: "/workbench", icon: LayoutDashboard },
  { name: "Cargas ETL", href: "/cargas", icon: UploadCloud },
  { name: "Actas", href: "/actas", icon: FileText },
  { name: "Cuentas", href: "/cuentas", icon: Settings },
  { name: "Admin", href: "/admin/usuarios", icon: User },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        navigation={navigation}
        pathname={pathname}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          collapsed ? "ml-16" : "ml-64",
        )}
      >
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
