import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { obtenerMapeos, obtenerPerfiles } from "../api";

const FALLBACK_MAP = {
  HEAD_DOWN: "PAGE_NEXT",
  HEAD_UP: "PAGE_PREV",
  HEAD_LEFT: "NAV_LEFT",
  HEAD_RIGHT: "NAV_RIGHT",
  JAW_OPEN: "SELECT",
};

const GestureContext = createContext(null);

export function GestureProvider({ children }) {
  const { token } = useAuth();
  const [gestureMap, setGestureMap] = useState(FALLBACK_MAP);
  const [perfilActivo, setPerfilActivo] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!token) {
      setGestureMap(FALLBACK_MAP);
      setPerfilActivo(null);
      return;
    }

    async function cargarMapeos() {
      setCargando(true);
      try {
        const perfiles = await obtenerPerfiles();
        const perfil = perfiles[0];
        if (!perfil) return;

        setPerfilActivo(perfil);
        const mapeos = await obtenerMapeos(perfil.id);

        // Construye { NOMBRE_GESTO: NOMBRE_ACCION }
        const mapa = {};
        for (const m of mapeos) {
          if (m.activo) {
            mapa[m.gesto.nombre] = m.accion.nombre;
          }
        }

        // Si la BD no tiene mapeos aún, mantiene el fallback
        setGestureMap(Object.keys(mapa).length ? mapa : FALLBACK_MAP);
      } catch (err) {
        console.warn(
          "[Mímica] No se pudieron cargar mapeos, usando fallback:",
          err.message,
        );
        setGestureMap(FALLBACK_MAP);
      } finally {
        setCargando(false);
      }
    }

    cargarMapeos();
  }, [token]);

  return (
    <GestureContext.Provider value={{ gestureMap, perfilActivo, cargando }}>
      {children}
    </GestureContext.Provider>
  );
}

export function useGesture() {
  return useContext(GestureContext);
}
