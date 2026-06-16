import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aventura en Altura — Mantenimiento",
  description: "Sistema de gestión de mantenimiento — Ptatanka SRL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
