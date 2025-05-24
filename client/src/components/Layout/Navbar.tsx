import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useMobile } from "@/hooks/use-mobile";
import { Bell, Menu, X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChildProfileSelector from "@/components/ChildProfileSelector";
import RewardsAlbum from "@/components/rewards/RewardsAlbum";
import { useRewardsStore } from "@/lib/rewards-system";

export default function Navbar() {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { newRewardsCount } = useRewardsStore();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/progress", label: "Progress and History" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        {/* Fila superior: Logo y botones de navegación siempre visibles */}
        <div className="flex justify-between items-center h-12 sm:h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <span className="text-white font-bold text-lg sm:text-2xl cursor-pointer flex items-center">
                <span className="text-yellow-300 mr-1">M</span>
                <span className="text-green-300 mr-1">a</span>
                <span className="text-purple-300 mr-1">t</span>
                <span className="text-red-300 mr-1">h</span>
                <span className="mr-1">W+A+O+K</span>
                <span className="ml-1 text-amber-200 text-base sm:text-xl">🔢</span>
              </span>
            </Link>
          </div>
          
          {/* Navegación principal siempre visible */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium transition-all rounded ${
                  location === link.href
                    ? "bg-white bg-opacity-20 text-white font-semibold"
                    : "text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white"
                }`}
              >
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">
                  {link.label === "Home" ? "Home" : 
                   link.label === "Progress and History" ? "Progress" : 
                   "Settings"}
                </span>
              </Link>
            ))}
          </div>
          
          {/* Menú hamburguesa para funciones adicionales */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="text-blue-100 hover:text-white p-1 sm:p-2"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </div>
        </div>
        
        {!isMobile && (
          <div className="hidden lg:flex justify-end items-center pb-4">
            {isAuthenticated && (
              <div className="mr-4">
                <ChildProfileSelector />
              </div>
            )}

            {isAuthenticated && (
              <div className="mr-3">
                <RewardsAlbum />
              </div>
            )}
            
            <Button variant="ghost" size="icon" className="text-blue-100 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>

            {isAuthenticated ? (
              <div className="ml-3 relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="px-1">
                      <Avatar className="h-8 w-8 bg-amber-400 text-indigo-800 ring-2 ring-white">
                        <AvatarFallback>{user ? getInitials(user.username) : "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Your Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/logout">Sign out</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="ml-3 flex space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-blue-600">
                    Login
                  </Button>
                </Link>
                <Link href="/google-login">
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      <path d="M1 1h22v22H1z" fill="none"/>
                    </svg>
                    Google
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-yellow-400 text-blue-800 hover:bg-yellow-300 shadow-sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Menú móvil para funciones adicionales */}
      {isMobile && mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1 bg-blue-600">
            {isAuthenticated ? (
              <div className="pt-4 pb-3 border-t border-blue-500">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10 bg-amber-400 text-indigo-800">
                      <AvatarFallback>{user ? getInitials(user.username) : "U"}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user?.username || "User"}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 mb-4 px-4">
                  <ChildProfileSelector />
                </div>
                
                <div className="mt-3 mb-2 px-4 flex justify-center">
                  <RewardsAlbum />
                </div>
                
                <div className="mt-1 space-y-1">
                  <Link 
                    href="/profile"
                    className="block px-4 py-2 text-base font-medium text-blue-100 hover:text-white hover:bg-blue-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left block px-4 py-2 text-base font-medium text-blue-100 hover:text-white hover:bg-blue-500"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-blue-500">
                <div className="flex flex-col space-y-2 px-4">
                  <Link 
                    href="/login"
                    className="block px-4 py-2 text-base font-medium text-blue-100 hover:text-white hover:bg-blue-500 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/google-login"
                    className="block px-4 py-2 text-base font-medium text-blue-100 hover:text-white hover:bg-blue-500 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login with Google
                  </Link>
                  <Link 
                    href="/register"
                    className="block px-4 py-2 text-base font-medium text-white bg-yellow-500 hover:bg-yellow-400 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
