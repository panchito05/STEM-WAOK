import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    // Cerrar sesión automáticamente al cargar la página
    if (isAuthenticated) {
      const performLogout = async () => {
        try {
          await logout();
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
        }
      };
      
      performLogout();
    }
  }, [isAuthenticated, logout]);

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card className="border-2">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Cerrando sesión</CardTitle>
          <CardDescription className="text-center">
            {isAuthenticated 
              ? "Procesando el cierre de sesión..." 
              : "Has cerrado sesión correctamente"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-4">
          {isAuthenticated ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <>
              <p className="text-sm text-center text-gray-600 mb-4">
                Tu sesión ha finalizado. Has cerrado sesión en todas las cuentas vinculadas.
              </p>
              <Link href="/login">
                <Button className="w-full">
                  Iniciar sesión nuevamente
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full mt-2">
                  Volver al inicio
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}