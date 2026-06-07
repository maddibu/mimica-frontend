// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login as apiLogin, register as apiRegister } from "../api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const location = useLocation();
  const [modo, setModo] = useState(location.state?.modo || "ingresar");
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    console.log("1. inicio handleSubmit", { email, contrasena });
    setError("");
    if (modo === "ingresar" && (!email || !contrasena)) {
      console.log("2. campos vacíos");
      setError("Por favor completa todos los campos.");
      return;
    }
    console.log("3. pasó validación");
    setCargando(true);
    try {
      console.log("4. antes del fetch");
      const data =
        modo === "ingresar"
          ? await apiLogin(email, contrasena)
          : await apiRegister(nombre, email, contrasena);
      console.log("5. respuesta:", data);
      guardarSesion(data.token, data.usuario);
      navigate("/dashboard");
    } catch (e) {
      console.log("6. error:", e.message);
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };
  console.log("render Login", typeof handleSubmit);

  return (
    <div style={styles.page}>
      <div style={styles.logoPlaceholder}>
        <span style={styles.imgText}>Logo</span>
      </div>

      <h1 style={styles.title}>Mímica</h1>
      <p style={{ color: "red" }}>VERSION NUEVA</p>

      <div style={styles.tabs}>
        <button
          style={modo === "ingresar" ? styles.tabActivo : styles.tabInactivo}
          onClick={() => {
            setModo("ingresar");
            setError("");
          }}
        >
          Ingresar
        </button>
        <button
          style={modo === "registrarse" ? styles.tabActivo : styles.tabInactivo}
          onClick={() => {
            setModo("registrarse");
            setError("");
          }}
        >
          Registrarse
        </button>
      </div>

      <div style={styles.form}>
        {modo === "registrarse" && (
          <>
            <label style={styles.label}>Nombre</label>
            <input
              style={styles.input}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </>
        )}

        <label style={styles.label}>Correo electrónico</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label style={styles.label}>Contraseña</label>
        <input
          style={styles.input}
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.btnSubmit, opacity: cargando ? 0.6 : 1 }}
          onClick={() => {
            console.log("click!");
            handleSubmit();
          }}
          disabled={cargando}
        >
          {cargando
            ? "Cargando..."
            : modo === "ingresar"
              ? "Entrar"
              : "Registrar"}
        </button>

        {modo === "ingresar" && (
          <a onClick={() => navigate("/forgot-password")} style={styles.link}>
            Olvidé la contraseña
          </a>
        )}
      </div>

      <button
        style={styles.btnSinCuenta}
        onClick={() => navigate("/dashboard")}
      >
        Continuar sin cuenta
      </button>
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
    boxSizing: "border-box",
  },
  error: {
    fontSize: "0.8rem",
    color: "#c00",
    margin: "0",
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
    textDecoration: "underline",
    cursor: "pointer",
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
