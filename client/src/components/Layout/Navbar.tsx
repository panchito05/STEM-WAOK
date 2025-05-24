import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo (lado izquierdo) */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <span className="text-white font-bold text-2xl cursor-pointer flex items-center">
                <span className="text-yellow-300">M</span>
                <span className="text-green-300">a</span>
                <span className="text-purple-300">t</span>
                <span className="text-red-300">h</span>
                <span className="text-white">W+A+O+K</span>
                <span className="ml-2 text-amber-200 text-xl">🔢</span>
              </span>
            </Link>
          </div>
          
          {/* Navegación principal (centro) */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-all rounded ${
                  location === link.href
                    ? "bg-white bg-opacity-20 text-white font-semibold border-b-2 border-yellow-400"
                    : "text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Botones de autenticación (lado derecho) */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Notificaciones */}
                <Button variant="ghost" size="sm" className="text-blue-100 hover:text-white p-2">
                  <Bell className="h-4 w-4" />
                </Button>
                
                {/* Avatar del usuario */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 bg-amber-400 text-indigo-800">
                        <AvatarFallback>{user ? getInitials(user.username) : "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem>
                      <Link href="/profile" className="w-full">Your Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-blue-100 hover:text-white text-sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-100 hover:text-white text-sm">
                  <Link href="/google-login">Google</Link>
                </Button>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-medium text-sm">
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}