"use client";

import { useEffect, useState } from "react";
import { LandingPage } from "@/componentes/landing-page";
import { PaginaLogin } from "@/componentes/login";
import { AppShell } from "@/componentes/app-shell";
import { TableroKanban } from "@/componentes/tablero-kanban";
import { TabProyectos } from "@/componentes/tab-proyectos";
import { TabUsuarios } from "@/componentes/tab-usuarios";
import { TabDashboard } from "@/componentes/tab-dashboard";
import { TabBacklog } from "@/componentes/tab-backlog";
import { obtenerSesion, cerrarSesion } from "@/lib/auth";
import { type Sesion } from "@/tipos/tareas";

export default function PaginaInicio() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [hidratado, setHidratado] = useState(false);
  const [tabActiva, setTabActiva] = useState("kanban");

  useEffect(() => {
    async function cargarSesion() {
      const s = await obtenerSesion();
      setSesion(s);
      setHidratado(true);
    }
    cargarSesion();
  }, []);

  function manejarLogin(nuevaSesion: Sesion) {
    setSesion(nuevaSesion);
  }

  async function manejarCerrarSesion() {
    await cerrarSesion();
    setSesion(null);
  }

  if (!hidratado) return null;

  if (!sesion) {
    return <LandingPage alEntrar={manejarLogin} />;
  }

  return (
    <AppShell
      sesion={sesion}
      alCerrarSesion={manejarCerrarSesion}
      tabActiva={tabActiva}
      alCambiarTab={setTabActiva}
    >
      {tabActiva === "kanban" && <TableroKanban />}
      {tabActiva === "backlog" && <TabBacklog />}
      {tabActiva === "proyectos" && <TabProyectos />}
      {tabActiva === "usuarios" && <TabUsuarios />}
      {tabActiva === "dashboard" && <TabDashboard />}
    </AppShell>
  );
}
