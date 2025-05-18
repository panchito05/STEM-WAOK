import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WebSocketStatus from "../WebSocketStatus";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      
      {/* Componente de estado de WebSocket */}
      <WebSocketStatus />
    </div>
  );
}
