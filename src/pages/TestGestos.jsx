import { useState, useCallback } from "react";
import { useGestureDetection } from "../hooks/useGestureDetection";

function TestGestos() {
  const [ultimo, setUltimo] = useState(null);
  const [historial, setHistorial] = useState([]);

  const handleGesture = useCallback((gesto) => {
    setUltimo(gesto);
    setHistorial((prev) => [
      { gesto, hora: new Date().toLocaleTimeString() },
      ...prev.slice(0, 19),
    ]);
  }, []);

  useGestureDetection({ onGesture: handleGesture, enabled: true });

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Test de gestos</h2>

      <div style={styles.display}>
        {ultimo ? (
          <span style={styles.gesto}>{ultimo}</span>
        ) : (
          <span style={styles.esperando}>esperando gesto…</span>
        )}
      </div>

      <div style={styles.historial}>
        {historial.map((h, i) => (
          <div key={i} style={styles.fila}>
            <span style={styles.hora}>{h.hora}</span>
            <span style={styles.nombre}>{h.gesto}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "2rem",
    maxWidth: "480px",
    margin: "0 auto",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
  },
  display: {
    height: "120px",
    border: "2px solid #ccc",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1.5rem",
    background: "#fafafa",
  },
  gesto: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#1D9E75",
    letterSpacing: "0.05em",
  },
  esperando: {
    fontSize: "1rem",
    color: "#999",
  },
  historial: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  fila: {
    display: "flex",
    gap: "1rem",
    padding: "0.4rem 0.75rem",
    background: "#f5f5f5",
    borderRadius: "6px",
  },
  hora: {
    fontSize: "0.8rem",
    color: "#999",
    minWidth: "80px",
  },
  nombre: {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#222",
  },
};

export default TestGestos;
