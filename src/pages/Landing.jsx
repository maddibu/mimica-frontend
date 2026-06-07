import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function Landing() {
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token]);

  return (
    <div style={styles.page}>
      <div style={styles.main}>
        {/* Columna izquierda */}
        <div style={styles.left}>
          <div style={styles.imgPlaceholder}>
            <span style={styles.imgText}>Imagen</span>
          </div>

          <h1 style={styles.title}>Mímica</h1>
          <p style={styles.subtitle}>Bienvenido a Mímica</p>

          <p style={styles.body}>
            Leer debería sentirse natural, Mímica te permite recorrer tus
            documentos utilizando movimientos faciales sencillos, ofreciendo una
            forma diferente de interactuar con tus libros y archivos digitales.
          </p>

          <p style={styles.body}>
            Carga tus documentos, abre tus lecturas favoritas y navega por cada
            página de manera fluida. Ya sea para estudiar, trabajar o disfrutar
            de una buena lectura, Mímica está diseñado para que la experiencia
            sea cómoda, simple y centrada en el contenido.
          </p>

          <p style={styles.body}>
            Tu próxima lectura está a un gesto de distancia.
          </p>
        </div>

        {/* Columna derecha */}
        <div style={styles.right}>
          <div style={styles.logoPlaceholder}>
            <span style={styles.imgText}>Logo</span>
          </div>

          <button
            style={styles.btnPrimary}
            onClick={() => navigate("/dashboard")}
          >
            Comenzar a leer
          </button>
          <button style={styles.btnPrimary} onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
          <button
            style={styles.btnOutline}
            onClick={() =>
              navigate("/login", { state: { modo: "registrarse" } })
            }
          >
            Registrarte
          </button>
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
  logoPlaceholder: {
    width: "200px",
    height: "160px",
    background: "#f0f0f0",
    border: "1px dashed #aaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    marginBottom: "1rem",
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
    width: "180px",
    padding: "0.7rem 1rem",
    background: "#111",
    color: "#fff",
    border: "none",
    fontSize: "0.9rem",
    cursor: "pointer",
    borderRadius: "2px",
  },
  btnOutline: {
    width: "180px",
    padding: "0.7rem 1rem",
    background: "#fff",
    color: "#111",
    border: "1px solid #111",
    fontSize: "0.9rem",
    cursor: "pointer",
    borderRadius: "2px",
  },
};

export default Landing;
