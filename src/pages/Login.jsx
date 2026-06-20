// src/pages/Login.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login as apiLogin, register as apiRegister } from "../api";
import { useAuth } from "../context/AuthContext";
import { useGestureDetection } from "../hooks/useGestureDetection";
import T9Keyboard from "../components/T9Keyboard";

// ── Mapa de gestos para esta página ──────────────────────────────────────────
const LOGIN_GESTURES = {
  HEAD_DOWN: "DOWN",
  HEAD_UP: "UP",
  HEAD_RIGHT: "RIGHT",
  HEAD_LEFT: "LEFT",
  SMILE: "CONFIRM",
};

// ── Grafo de navegación ──────────────────────────────────────────────────────
function buildGraph(modo, savedCount = 0) {
  if (modo === "ingresar") {
    const graph = {
      "tab-ingresar": {
        right: "tab-registrarse",
        down: "email",
        up: null,
        left: null,
      },
      "tab-registrarse": {
        left: "tab-ingresar",
        down: "email",
        up: null,
        right: null,
      },
      email: { down: "pass", up: "tab-ingresar", left: null, right: null },
      pass: { down: "btn-submit", up: "email", left: null, right: null },
      "btn-submit": {
        down: "link-forgot",
        up: "pass",
        left: null,
        right: null,
      },
      "link-forgot": {
        down: savedCount > 0 ? "saved-0" : "btn-guest",
        up: "btn-submit",
        left: null,
        right: null,
      },
      "btn-guest": {
        up: savedCount > 0 ? `saved-${savedCount - 1}` : "link-forgot",
        down: null,
        left: null,
        right: null,
      },
    };

    for (let i = 0; i < savedCount; i++) {
      graph[`saved-${i}`] = {
        left: i > 0 ? `saved-${i - 1}` : null,
        right: i < savedCount - 1 ? `saved-${i + 1}` : null,
        up: "link-forgot",
        down: "btn-guest",
      };
    }

    return graph;
  }
  return {
    "tab-ingresar": {
      right: "tab-registrarse",
      down: "nombre",
      up: null,
      left: null,
    },
    "tab-registrarse": {
      left: "tab-ingresar",
      down: "nombre",
      up: null,
      right: null,
    },
    nombre: { down: "email", up: "tab-registrarse", left: null, right: null },
    email: { down: "pass", up: "nombre", left: null, right: null },
    pass: { down: "btn-submit", up: "email", left: null, right: null },
    "btn-submit": { down: "btn-guest", up: "pass", left: null, right: null },
    "btn-guest": { up: "btn-submit", down: null, left: null, right: null },
  };
}

// Nodos que al recibir CONFIRM disparan una acción concreta
const CAMPOS_TEXTO = new Set(["nombre", "email", "pass"]);

// ── DwellButton ──────────────────────────────────────────────────────────────
function DwellButton({ style, hint, onClick, children, focused }) {
  const barRef = useRef(null);
  const timerRef = useRef(null);

  const startDwell = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "width 7s linear";
    barRef.current.style.width = "100%";
    timerRef.current = setTimeout(() => onClick(), 7000);
  };
  const stopDwell = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "none";
    barRef.current.style.width = "0%";
    clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (focused) startDwell();
    else stopDwell();
  }, [focused]);

  return (
    <button
      style={{
        ...style,
        borderColor: focused ? "#1D9E75" : style.borderColor || "transparent",
      }}
      onClick={onClick}
      onMouseEnter={startDwell}
      onMouseLeave={stopDwell}
    >
      {focused && <div style={styles.focusBarTop} />}
      <div style={styles.btnLabel}>
        <span>{children}</span>
        {hint && <span style={styles.btnHint}>{hint}</span>}
      </div>
      <span>→</span>
      <div ref={barRef} style={styles.dwellBar} />
    </button>
  );
}

// ── SavedUserCard (inicio de sesión rápido) ──────────────────────────────────
function SavedUserCard({ usuario, index, focused, onSelect, onRemove }) {
  const barRef = useRef(null);
  const timerRef = useRef(null);

  const start = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "width 7s linear";
    barRef.current.style.width = "100%";
    timerRef.current = setTimeout(() => onSelect(), 7000);
  };

  const stop = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "none";
    barRef.current.style.width = "0%";
    clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (focused) start();
    else stop();
    return () => clearTimeout(timerRef.current);
  }, [focused]);

  return (
    <div
      style={{
        ...styles.savedCard,
        outline: focused ? "2px solid #1D9E75" : "none",
        outlineOffset: focused ? "1px" : "0",
      }}
    >
      <div style={styles.savedAvatar}>{index + 1}</div>
      <span style={styles.savedName}>
        {usuario.nombre?.split(" ")[0] || "Usuario"}
      </span>
      <button
        style={styles.savedRemove}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(usuario.id_usuario);
        }}
      >
        ×
      </button>
      <div ref={barRef} style={styles.savedDwell} />
    </div>
  );
}

// ── Login ────────────────────────────────────────────────────────────────────
function Login() {
  const location = useLocation();
  const [modo, setModo] = useState(location.state?.modo || "ingresar");
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  const [valores, setValores] = useState({ nombre: "", email: "", pass: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [focusedEl, setFocusedEl] = useState("tab-ingresar");
  const [activeField, setActiveField] = useState(null);

  const MAX_SAVED = 3;
  const getSavedUsers = () => {
    try {
      return JSON.parse(localStorage.getItem("mimica_saved_users") || "[]");
    } catch {
      return [];
    }
  };
  const saveUser = (usuario) => {
    const saved = getSavedUsers();
    const exists = saved.findIndex((u) => u.id_usuario === usuario.id_usuario);
    if (exists !== -1) saved.splice(exists, 1);
    saved.unshift(usuario);
    if (saved.length > MAX_SAVED) saved.length = MAX_SAVED;
    localStorage.setItem("mimica_saved_users", JSON.stringify(saved));
  };
  const removeSavedUser = (id) => {
    const saved = getSavedUsers().filter((u) => u.id_usuario !== id);
    localStorage.setItem("mimica_saved_users", JSON.stringify(saved));
    setSavedUsers(saved);
  };
  const [savedUsers, setSavedUsers] = useState(getSavedUsers);

  const handleModoChange = (nuevoModo) => {
    setModo(nuevoModo);
    setError("");
    setActiveField(null);
    setFocusedEl(nuevoModo === "ingresar" ? "tab-ingresar" : "tab-registrarse");
  };

  const handleSubmit = async () => {
    setError("");
    if (modo === "ingresar" && (!valores.email || !valores.pass)) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setCargando(true);
    try {
      const data =
        modo === "ingresar"
          ? await apiLogin(valores.email, valores.pass)
          : await apiRegister(valores.nombre, valores.email, valores.pass);
      guardarSesion(data.token, data.usuario);
      saveUser(data.usuario);
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const handleT9Key = (k) => {
    if (!activeField) return;
    setValores((prev) => ({ ...prev, [activeField]: prev[activeField] + k }));
  };

  const handleT9Backspace = () => {
    if (!activeField) return;
    setValores((prev) => ({
      ...prev,
      [activeField]: prev[activeField].slice(0, -1),
    }));
  };

  const handleT9Confirm = () => setActiveField(null);

  // Activa la acción correspondiente al nodo enfocado
  const activarNodo = useCallback(
    (nodo) => {
      if (CAMPOS_TEXTO.has(nodo)) {
        setActiveField(nodo);
        return;
      }
      if (nodo.startsWith("saved-")) {
        const index = parseInt(nodo.replace("saved-", ""), 10);
        const usuario = savedUsers[index];
        if (usuario) {
          setError("Ingresa tu contraseña para continuar.");
          setValores((prev) => ({
            ...prev,
            email: usuario.correo || usuario.email || "",
          }));
          setFocusedEl("pass");
        }
        return;
      }
      if (nodo === "tab-ingresar") return handleModoChange("ingresar");
      if (nodo === "tab-registrarse") return handleModoChange("registrarse");
      if (nodo === "btn-submit") return handleSubmit();
      if (nodo === "link-forgot") return navigate("/forgot-password");
      if (nodo === "btn-guest") return navigate("/dashboard");
    },
    [modo, valores, navigate, savedUsers],
  );

  const [gestoTeclado, setGestoTeclado] = useState(null);

  const handleGesture = useCallback(
    (accion) => {
      if (activeField) {
        if (accion === "BROW_UP") {
          setActiveField(null);
          return;
        }
        // Reenvía el gesto al teclado con timestamp único
        setGestoTeclado({ tipo: accion, ts: Date.now() });
        return;
      }

      const graph = buildGraph(modo, savedUsers.length);
      const node = graph[focusedEl];
      if (!node) return;

      if (accion === "CONFIRM") {
        activarNodo(focusedEl);
        return;
      }

      const dirMap = { UP: "up", DOWN: "down", LEFT: "left", RIGHT: "right" };
      const nextEl = node[dirMap[accion]];
      if (nextEl) setFocusedEl(nextEl);
    },
    [focusedEl, modo, activeField, activarNodo, savedUsers],
  );

  useGestureDetection({
    onGesture: handleGesture,
    gestureMap: LOGIN_GESTURES,
    enabled: true,
  });

  const fieldFocused = (id) => focusedEl === id;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mímica</h1>

      <div style={styles.tabs}>
        {["ingresar", "registrarse"].map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(modo === tab ? styles.tabActivo : styles.tabInactivo),
              borderColor:
                focusedEl === `tab-${tab}`
                  ? "#1D9E75"
                  : modo === tab
                    ? "transparent"
                    : "#ccc",
              borderWidth: focusedEl === `tab-${tab}` ? "1.5px" : "0.5px",
            }}
            onClick={() => handleModoChange(tab)}
            onMouseEnter={() => setFocusedEl(`tab-${tab}`)}
            onMouseLeave={() => {}}
          >
            {focusedEl === `tab-${tab}` && <div style={styles.focusBarTop} />}
            {tab === "ingresar" ? "Ingresar" : "Registrarse"}
          </button>
        ))}
      </div>

      <div style={styles.form}>
        {modo === "registrarse" && (
          <div style={styles.field}>
            {fieldFocused("nombre") && <div style={styles.focusBarTop} />}
            <label
              style={{
                ...styles.label,
                color: fieldFocused("nombre") ? "#111" : "#888",
              }}
            >
              Nombre
            </label>
            <input
              style={{
                ...styles.input,
                borderColor: fieldFocused("nombre") ? "#1D9E75" : "#ccc",
                borderTopWidth: fieldFocused("nombre") ? "3px" : "1.5px",
              }}
              type="text"
              value={valores.nombre}
              readOnly
              onClick={() => {
                setFocusedEl("nombre");
                setActiveField("nombre");
              }}
              onFocus={() => setFocusedEl("nombre")}
              onBlur={() => {}}
            />
          </div>
        )}

        <div style={styles.field}>
          {fieldFocused("email") && <div style={styles.focusBarTop} />}
          <label
            style={{
              ...styles.label,
              color: fieldFocused("email") ? "#111" : "#888",
            }}
          >
            Correo electrónico
          </label>
          <input
            style={{
              ...styles.input,
              borderColor: fieldFocused("email") ? "#1D9E75" : "#ccc",
              borderTopWidth: fieldFocused("email") ? "3px" : "1.5px",
            }}
            type="email"
            value={valores.email}
            readOnly
            onClick={() => {
              setFocusedEl("email");
              setActiveField("email");
            }}
            onFocus={() => setFocusedEl("email")}
            onBlur={() => {}}
          />
        </div>

        <div style={styles.field}>
          {fieldFocused("pass") && <div style={styles.focusBarTop} />}
          <label
            style={{
              ...styles.label,
              color: fieldFocused("pass") ? "#111" : "#888",
            }}
          >
            Contraseña
          </label>
          <input
            style={{
              ...styles.input,
              borderColor: fieldFocused("pass") ? "#1D9E75" : "#ccc",
              borderTopWidth: fieldFocused("pass") ? "3px" : "1.5px",
            }}
            type="password"
            value={valores.pass}
            readOnly
            onClick={() => {
              setFocusedEl("pass");
              setActiveField("pass");
            }}
            onFocus={() => setFocusedEl("pass")}
            onBlur={() => {}}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <DwellButton
          style={{ ...styles.btnSubmit, opacity: cargando ? 0.6 : 1 }}
          hint="Mantén la mirada 2 s o sonríe para confirmar"
          focused={fieldFocused("btn-submit")}
          onClick={handleSubmit}
        >
          {cargando
            ? "Cargando..."
            : modo === "ingresar"
              ? "Entrar"
              : "Registrar"}
        </DwellButton>

        {modo === "ingresar" && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/forgot-password");
            }}
            style={{
              ...styles.link,
              outline: fieldFocused("link-forgot")
                ? "2px solid #1D9E75"
                : "none",
              borderRadius: "4px",
              padding: "2px 4px",
            }}
          >
            {fieldFocused("link-forgot") && (
              <span style={{ color: "#1D9E75", marginRight: 4 }}>&#9658;</span>
            )}
            Olvidé la contraseña
          </a>
        )}
      </div>

      {activeField && (
        <T9Keyboard
          onKey={handleT9Key}
          onBackspace={handleT9Backspace}
          onConfirm={handleT9Confirm}
          gesto={gestoTeclado}
        />
      )}

      {savedUsers.length > 0 && (
        <div style={styles.savedSection}>
          <span style={styles.savedLabel}>Acceso rápido</span>
          <div style={styles.savedRow}>
            {savedUsers.map((u, i) => (
              <SavedUserCard
                key={u.id_usuario}
                usuario={u}
                index={i}
                focused={fieldFocused(`saved-${i}`)}
                onSelect={() => {
                  setError("Ingresa tu contraseña para continuar.");
                  setValores((prev) => ({
                    ...prev,
                    email: u.correo || u.email || "",
                  }));
                  setFocusedEl("pass");
                }}
                onRemove={removeSavedUser}
              />
            ))}
          </div>
        </div>
      )}

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>o</span>
        <div style={styles.dividerLine} />
      </div>

      <DwellButton
        style={styles.btnGhost}
        hint="Sin registro"
        focused={fieldFocused("btn-guest")}
        onClick={() => navigate("/dashboard")}
      >
        Continuar sin cuenta
      </DwellButton>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.25rem",
    background: "#fff",
    padding: "2rem 1rem",
    boxSizing: "border-box",
  },
  title: { fontSize: "1.75rem", fontWeight: "500", margin: 0 },
  tabs: { display: "flex", width: "380px", gap: "10px" },
  tab: {
    flex: 1,
    padding: "1rem",
    fontSize: "16px",
    fontWeight: "500",
    borderRadius: "10px",
    cursor: "pointer",
    border: "0.5px solid #ccc",
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  tabActivo: { background: "#111", color: "#fff" },
  tabInactivo: { background: "#f3f3f3", color: "#111" },
  form: {
    width: "380px",
    border: "0.5px solid #e0e0e0",
    borderRadius: "12px",
    padding: "1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    background: "#fff",
    boxSizing: "border-box",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
    position: "relative",
  },
  focusBarTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "#1D9E75",
    borderRadius: "8px 8px 0 0",
    zIndex: 1,
  },
  label: {
    fontSize: "11px",
    fontWeight: "500",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "8px 12px 0",
    transition: "color 0.2s",
  },
  input: {
    padding: "1.75rem 1rem 0.75rem",
    fontSize: "16px",
    border: "1.5px solid #ccc",
    borderRadius: "8px",
    background: "#f9f9f9",
    color: "#111",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    outline: "none",
    cursor: "pointer",
  },
  error: { fontSize: "0.8rem", color: "#c00", margin: 0 },
  btnSubmit: {
    width: "100%",
    padding: "1.25rem 1.5rem",
    background: "#111",
    color: "#fff",
    border: "2px solid transparent",
    fontSize: "18px",
    fontWeight: "500",
    cursor: "pointer",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  btnGhost: {
    width: "380px",
    padding: "1.1rem 1.5rem",
    background: "#f3f3f3",
    color: "#111",
    border: "1.5px solid #e0e0e0",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  btnLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
  },
  btnHint: { fontSize: "11px", fontWeight: "400", opacity: 0.5 },
  dwellBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "3px",
    width: "0%",
    background: "#1D9E75",
    borderRadius: "0 0 10px 10px",
  },
  link: {
    fontSize: "13px",
    color: "#666",
    textAlign: "center",
    textDecoration: "underline",
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "380px",
  },
  dividerLine: { flex: 1, height: "0.5px", background: "#e0e0e0" },
  dividerText: { fontSize: "12px", color: "#999" },
  savedSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    width: "380px",
  },
  savedLabel: {
    fontSize: "11px",
    color: "#999",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },
  savedRow: {
    display: "flex",
    gap: "12px",
    width: "100%",
  },
  savedCard: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "1.25rem 0.5rem 1rem",
    border: "0.5px solid #e0e0e0",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  savedAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "500",
  },
  savedName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#111",
    textAlign: "center",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  savedRemove: {
    position: "absolute",
    top: "6px",
    right: "8px",
    background: "none",
    border: "none",
    fontSize: "16px",
    color: "#bbb",
    cursor: "pointer",
    lineHeight: 1,
    padding: 0,
  },
  savedDwell: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "3px",
    width: "0%",
    background: "#1D9E75",
    borderRadius: "0 0 12px 12px",
  },
};

export default Login;
