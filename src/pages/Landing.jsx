import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useGestureDetection } from "../hooks/useGestureDetection";

function DwellButton({ style, hint, onClick, children, gesteFocused = false }) {
  const barRef = useRef(null);
  const timerRef = useRef(null);

  const startDwell = () => {
    if (!barRef.current) return;
    clearTimeout(timerRef.current);
    barRef.current.style.transition = "width 7s linear";
    barRef.current.style.width = "100%";
    timerRef.current = setTimeout(() => onClick(), 7000);
  };

  const cancelDwell = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "none";
    barRef.current.style.width = "0%";
    clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (gesteFocused) {
      startDwell();
    } else {
      cancelDwell();
    }
  }, [gesteFocused]);

  return (
    <button
      style={style}
      onClick={onClick}
      onMouseEnter={startDwell}
      onMouseLeave={cancelDwell}
    >
      <div style={styles.btnLabel}>
        <span>{children}</span>
        <span style={styles.btnHint}>{hint}</span>
      </div>
      <span>→</span>
      <div ref={barRef} style={styles.dwellBar} />
    </button>
  );
}

function Landing() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const BUTTON_COUNT = 2;

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token]);

  const handleGesture = useCallback((gesture) => {
    setFocusedIndex((prev) => {
      const current = prev ?? 0; // empieza en 0 solo cuando llega el primer gesto
      if (gesture === "HEAD_DOWN")
        return Math.min(current + 1, BUTTON_COUNT - 1);
      if (gesture === "HEAD_UP") return Math.max(current - 1, 0);
      return current;
    });
  }, []);

  useGestureDetection({ onGesture: handleGesture, enabled: true });

  return (
    <div style={styles.page}>
      <div style={styles.main}>
        {/* Columna izquierda */}
        <div style={styles.left}>
          <h1 style={styles.title}>Mímica</h1>
          <p style={styles.subtitle}>Bienvenido</p>
          <p style={styles.body}>
            Lectura más sencilla. Mímica te permite navegar por tus documentos
            con gestos faciales simples. Carga tus archivos, continúa tu lectura
            y controla cada página.
          </p>

          {/* Dropzone aquí, después del body */}
          <p style={styles.uploadLabel}>Comienza a leer</p>
          <label style={styles.dropZone}>
            <input
              type="file"
              accept=".pdf,.epub"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) console.log("Archivo:", file.name);
              }}
            />
            <span style={styles.dropIcon}>📄</span>
            <span style={styles.dropText}>Arrastra un PDF o EPUB aquí</span>
            <span style={styles.dropSubtext}>o haz clic para seleccionar</span>
          </label>
        </div>

        {/* Columna derecha */}
        <div style={styles.right}>
          <DwellButton
            style={styles.btnPrimary}
            hint="Continúa donde lo dejaste"
            onClick={() => navigate("/login")}
            gesteFocused={focusedIndex === 0}
          >
            Iniciar sesión
          </DwellButton>

          <DwellButton
            style={styles.btnOutline}
            hint="Es gratis"
            onClick={() =>
              navigate("/login", { state: { modo: "registrarse" } })
            }
            gesteFocused={focusedIndex === 1}
          >
            Crear cuenta
          </DwellButton>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    overflow: "hidden",
    padding: "1.5rem",
  },
  main: {
    display: "flex",
    gap: "2rem",
    height: "100%",
  },
  left: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    textAlign: "center",
    overflowY: "auto",
    justifyContent: "center",
  },
  right: {
    width: "50%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    flexShrink: 0,
  },
  imgPlaceholder: {
    width: "100%",
    height: "45vh",
    background: "#e8e8e8",
    border: "1px dashed #aaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    flexShrink: 0,
  },
  imgText: {
    fontSize: "0.75rem",
    color: "#999",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#444",
  },
  body: {
    fontSize: "1.125rem",
    lineHeight: "1.65",
    color: "#222",
    maxWidth: "440px",
  },
  btnPrimary: {
    width: "50%",
    height: "160px",
    padding: "1.25rem 1.5rem",
    background: "#111",
    color: "#fff",
    border: "none",
    fontSize: "1.125rem",
    fontWeight: "500",
    cursor: "pointer",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  btnOutline: {
    width: "50%",
    height: "160px",
    padding: "1.25rem 1.5rem",
    background: "#fff",
    color: "#111",
    border: "1px solid #ccc",
    fontSize: "1.125rem",
    fontWeight: "500",
    cursor: "pointer",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  btnLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
  },
  btnHint: {
    fontSize: "11px",
    fontWeight: "400",
    opacity: 0.55,
  },
  dwellBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "3px",
    width: "0%",
    background: "#1D9E75",
    borderRadius: "0 0 10px 10px",
  },
  uploadLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#111",
    marginTop: "0.5rem",
  },
  dropZone: {
    width: "100%",
    maxWidth: "440px",
    height: "160px",
    border: "2px dashed #ccc",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    cursor: "pointer",
    background: "#fafafa",
    transition: "border-color 0.2s",
  },
  dropIcon: {
    fontSize: "2rem",
  },
  dropText: {
    fontSize: "0.95rem",
    color: "#444",
    fontWeight: "500",
  },
  dropSubtext: {
    fontSize: "0.75rem",
    color: "#999",
  },
};

export default Landing;
