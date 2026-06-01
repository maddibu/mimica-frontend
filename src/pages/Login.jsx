import { useState } from "react";
import { useLocation } from "react-router-dom";

function Login() {
  const [modo, setModo] = useState("ingresar");

  return (
    <div style={styles.page}>
      {/* Logo */}
      <div style={styles.logoPlaceholder}>
        <span style={styles.imgText}>Logo aquí</span>
      </div>

      <h1 style={styles.title}>Mímica</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={modo === "ingresar" ? styles.tabActivo : styles.tabInactivo}
          onClick={() => setModo("ingresar")}
        >
          Ingresar
        </button>
        <button
          style={modo === "registrarse" ? styles.tabActivo : styles.tabInactivo}
          onClick={() => setModo("registrarse")}
        >
          Registrarse
        </button>
      </div>

      {/* Formulario */}
      <div style={styles.form}>
        <label style={styles.label}>Correo electrónico</label>
        <input style={styles.input} type="email" />

        <label style={styles.label}>Contraseña</label>
        <input style={styles.input} type="password" />

        <button style={styles.btnSubmit}>
          {modo === "ingresar" ? "Entrar" : "Registrar"}
        </button>

        {modo === "ingresar" && (
          <a href="#" style={styles.link}>
            Olvidé la contraseña
          </a>
        )}
      </div>

      <button style={styles.btnSinCuenta}>Continuar sin cuenta</button>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    background: "#fff",
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
  },
  imgText: {
    fontSize: "0.75rem",
    color: "#999",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
  },
  tabs: {
    display: "flex",
    width: "340px",
    justifyContent: "space-between",
  },
  tabActivo: {
    flex: 1,
    padding: "0.5rem",
    background: "#111",
    color: "#fff",
    border: "1px solid #111",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  tabInactivo: {
    flex: 1,
    padding: "0.5rem",
    background: "#fff",
    color: "#111",
    border: "1px solid #111",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  form: {
    width: "340px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.85rem",
    color: "#222",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "2px",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  btnSubmit: {
    width: "100%",
    padding: "0.7rem",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "2px",
    fontSize: "0.9rem",
    cursor: "pointer",
    marginTop: "0.25rem",
  },
  link: {
    fontSize: "0.8rem",
    color: "#333",
    textAlign: "left",
    marginTop: "0.25rem",
  },
  btnSinCuenta: {
    padding: "0.6rem 1.5rem",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
};

export default Login;
