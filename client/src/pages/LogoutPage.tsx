import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";
import { Helmet } from "react-helmet";
import { Loader2, LogOut, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";

export default function LogoutPage() {
  const { logout, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [logoutComplete, setLogoutComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslations();

  useEffect(() => {
    const performLogout = async () => {
      try {
        if (isAuthenticated) {
          await logout();
        }
        // Set a small delay to show the success message
        setTimeout(() => {
          setLogoutComplete(true);
          setIsLoggingOut(false);
        }, 1000);
      } catch (err) {
        console.error("Error during logout:", err);
        setError("An error occurred during logout. Please try again.");
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [logout, isAuthenticated]);

  if (!isAuthenticated && !isLoggingOut && !logoutComplete) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <Helmet>
        <title>Sign Out - Math W+A+O+K</title>
        <meta name="description" content="Sign out of your Math W+A+O+K account" />
      </Helmet>

      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLoggingOut ? t('auth.signingOut') : t('auth.signedOut')}
            </CardTitle>
            <CardDescription>
              {isLoggingOut 
                ? t('auth.processingSignOut') 
                : error 
                  ? t('auth.signOutError') 
                  : t('auth.signOutSuccess')
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex justify-center py-6">
            {isLoggingOut ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">{t('auth.waitingLogout')}</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                  <LogOut className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-center max-w-xs">
                  {t('auth.successfullySignedOut')}
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
            {!isLoggingOut && (
              <>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Home className="mr-2 h-4 w-4" />
                    {t('common.backToHome')}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('auth.signInAgain')}
                  </Button>
                </Link>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}