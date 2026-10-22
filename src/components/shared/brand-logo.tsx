import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Logos de Baterías Ecuador (originales en src/assets/images, versiones web en public/brand).
 * - horizontal: barras superiores (sidebar, header móvil)
 * - vertical:   pantalla de inicio de sesión
 * - isotipo:    solo el símbolo (sidebar colapsado)
 */
const LOGOS = {
  horizontal: { src: "/brand/logo-horizontal.png", width: 497, height: 160 },
  vertical: { src: "/brand/logo-vertical.png", width: 300, height: 400 },
  isotipo: { src: "/brand/isotipo.png", width: 96, height: 96 },
} as const;

interface BrandLogoProps {
  variant?: keyof typeof LOGOS;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ variant = "horizontal", className, priority }: BrandLogoProps) {
  const logo = LOGOS[variant];
  return (
    <Image
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt="Baterías Ecuador"
      priority={priority}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
