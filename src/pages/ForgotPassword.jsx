import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [enviado, setEnviado] = useState(false);
  const [correo, setCorreo] = useState("");
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {/* Logo */}
      <div style={styles.logoPlaceholder}>
        <span style={styles.imgText}>Logo aquí</span>
      </div>

      <h1 style={styles.title}>Mímica</h1>

      {!enviado ? (
        /* Estado 1 — Formulario */
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Recuperar contraseña</h2>
          <p style={styles.cardDesc}>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contraseña.
          </p>

          <label style={styles.label}>Correo electrónico</label>
          <input
            style={styles.input}
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <button style={styles.btnSubmit} onClick={() => setEnviado(true)}>
            Enviar enlace
          </button>
        </div>
      ) : (
        /* Estado 2 — Confirmación */
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Revisa tu correo</h2>
          <p style={styles.cardDesc}>
            Te enviamos un enlace a <strong>{correo}</strong> para restablecer
            tu contraseña.
          </p>
          <button
            style={styles.btnSubmit}
            onClick={() => {
              setEnviado(false);
              setCorreo("");
            }}
          >
            Enviar de nuevo
          </button>
        </div>
      )}

      {/* Volver */}
      <button style={styles.btnVolver} onClick={() => navigate("/login")}>
        Volver a iniciar sesión
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
  card: {
    width: "340px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#111",
  },
  cardDesc: {
    fontSize: "0.82rem",
    color: "#555",
    lineHeight: "1.6",
    marginBottom: "0.25rem",
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
    marginBottom: "0.25rem",
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
  btnVolver: {
    background: "none",
    border: "none",
    fontSize: "0.82rem",
    color: "#333",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default ForgotPassword;
