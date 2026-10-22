"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/hooks/use-auth";
import { useToast } from "@/lib/hooks/use-toast";
import { CORPORATE_DOMAIN } from "@/lib/api/auth";
import { redireccionSegura } from "@/lib/auth/session";
import { GoogleButton } from "@/components/auth/google-button";
import { BrandLogo } from "@/components/shared/brand-logo";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// useSearchParams exige un <Suspense> para poder generar la página en el build
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destino = redireccionSegura(searchParams.get("redirect"));

  const { user, login, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [showDomainError, setShowDomainError] = useState(false);

  const expired = searchParams.get("expired") === "1";

  useEffect(() => {
    if (user && !authLoading) router.replace(destino);
  }, [user, authLoading, destino, router]);

  useEffect(() => {
    if (expired) {
      toast({
        title: "Sesión expirada",
        description: "Por favor, inicie sesión nuevamente.",
        variant: "warning",
      });
    }
  }, [expired, toast]);

  useEffect(() => {
    // El SDK de Google se carga una sola vez aunque se vuelva a montar la página
    if (window.google?.accounts?.id) {
      setGoogleLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true);
    };
    script.onerror = () => {
      setError(
        "No se pudo cargar el SDK de Google. Verifique su conexión a internet.",
      );
    };
    document.head.appendChild(script);

    return () => {
      window.google?.accounts?.id?.disableAutoSelect();
    };
  }, []);

  const handleGoogleCredential = async (credential: string) => {
    if (!credential) return;

    setIsLoading(true);
    setError(null);
    setShowDomainError(false);

    try {
      await login(credential);

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido a Fabribat",
        variant: "success",
      });

      router.replace(destino);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      if (message.includes("dominio") || message.includes("domain")) {
        setShowDomainError(true);
        setError(message);
      } else {
        setError(message);
        toast({
          title: "Error de autenticación",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-background px-4">
      {/* Fondo: neutro cálido con un toque muy suave de los colores corporativos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_100%_-10%,hsl(var(--brand-yellow)/0.10),transparent_60%),radial-gradient(50rem_30rem_at_-10%_110%,hsl(var(--primary)/0.07),transparent_60%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo variant="horizontal" priority className="mx-auto mb-6 h-14" />
          <h1 className="text-2xl font-bold tracking-tight">Fabribat</h1>
          <p className="text-muted-foreground mt-1">
            Conciliación Bancaria & Automatización ETL
          </p>
        </div>

        <Card className="overflow-hidden shadow-xl">
          <div className="h-1 bg-gradient-to-r from-primary via-primary to-brand-yellow" aria-hidden="true" />
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Use su cuenta corporativa @{CORPORATE_DOMAIN}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && !showDomainError && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showDomainError && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-1">
                  <div>Acceso denegado</div>
                  <div className="text-sm">
                    Solo se permiten cuentas del dominio corporativo
                    <strong> @{CORPORATE_DOMAIN}</strong>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <GoogleButton
                googleLoaded={googleLoaded}
                clientId={GOOGLE_CLIENT_ID}
                onCredential={handleGoogleCredential}
              />
            </div>

            <Separator className="my-4" />

            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>
                Dominio autorizado: <strong>@{CORPORATE_DOMAIN}</strong>
              </p>
              <p>Si tiene problemas, contacte al administrador del sistema.</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>Correo corporativo requerido</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Autenticación segura con Google OAuth 2.0</span>
            </div>
          </CardFooter>
        </Card>

        {isLoading || authLoading ? (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-xl border shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">
                {isLoading ? "Autenticando..." : "Cargando sesión..."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}