import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "gestor básico de tareas",
  description: "Demo Kanban ligera y visual para equipos de alto rendimiento",
  referrer: "no-referrer"
};

type PropiedadesLayout = Readonly<{
  children: ReactNode;
}>;

export default function LayoutRaiz({ children }: PropiedadesLayout) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
