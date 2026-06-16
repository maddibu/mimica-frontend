// src/pages/Login.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login as apiLogin, register as apiRegister } from "../api";
import { useAuth } from "../context/AuthContext";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import T9Keyboard from "../components/T9Keyboard";

// ── Gestos ──────────────────────────────────────────────────────────────────
const HOLD_TIME = 700;
const PITCH_DOWN = 0.03;
const PITCH_UP = -0.03;
const SMILE_THRESHOLD = 0.1;

function getPitchSmile(matrix, blendshapes) {
  if (!matrix?.data) return null;
  const m = matrix.data;
  const pitch = Math.asin(Math.max(-1, Math.min(1, -m[9])));
  const categories = blendshapes?.[0]?.categories ?? [];
  const get = (name) =>
    categories.find((c) => c.categoryName === name)?.score ?? 0;
  const smileLeft = get("mouthSmileLeft");
  const smileRight = get("mouthSmileRight");
  return { pitch, smileLeft, smileRight };
}

function useHeadGesture({ onGesture, enabled = true }) {
  const landmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const gestureStateRef = useRef({
    current: null,
    startTime: null,
    fired: false,
  });

  const handleResults = useCallback(
    (results) => {
      const matrices = results.facialTransformationMatrixes;
      if (!matrices?.length) return;
      const poseData = getPitchSmile(matrices[0], results.faceBlendshapes);
      if (!poseData) return;
      const { pitch, smileLeft, smileRight } = poseData;

      let detected = null;
      if (pitch > PITCH_DOWN) detected = "HEAD_DOWN";
      else if (pitch < PITCH_UP) detected = "HEAD_UP";
      else if (smileRight > SMILE_THRESHOLD) detected = "HEAD_RIGHT";
      else if (smileLeft > SMILE_THRESHOLD) detected = "HEAD_LEFT";

      const state = gestureStateRef.current;
      const now = Date.now();
      if (detected !== state.current) {
        gestureStateRef.current = {
          current: detected,
          startTime: detected ? now : null,
          fired: false,
        };
        return;
      }
      if (detected && !state.fired && now - state.startTime >= HOLD_TIME) {
        gestureStateRef.current.fired = true;
        onGesture?.(detected);
      }
    },
    [onGesture],
  );

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    const video = document.createElement("video");
    video.style.cssText =
      "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;";
    document.body.appendChild(video);

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        outputFacialTransformationMatrixes: true,
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      });
      if (stopped) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      video.srcObject = stream;
      await video.play();

      let lastTime = -1;
      function detect() {
        if (stopped) return;
        if (video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          const results = landmarker.detectForVideo(video, performance.now());
          handleResults(results);
        }
        animFrameRef.current = requestAnimationFrame(detect);
      }
      animFrameRef.current = requestAnimationFrame(detect);
    }

    init().catch((err) => console.error("[Mímica] FaceLandmarker error:", err));

    return () => {
      stopped = true;
      cancelAnimationFrame(animFrameRef.current);
      landmarkerRef.current?.close();
      if (video.srcObject) video.srcObject.getTracks().forEach((t) => t.stop());
      document.body.removeChild(video);
    };
  }, [enabled, handleResults]);
}

// ── Grafo de navegación ──────────────────────────────────────────────────────
function buildGraph(modo) {
  if (modo === "ingresar") {
    return {
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
        down: "btn-guest",
        up: "btn-submit",
        left: null,
        right: null,
      },
      "btn-guest": { up: "link-forgot", down: null, left: null, right: null },
    };
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

// ── DwellButton ──────────────────────────────────────────────────────────────
function DwellButton({ style, hint, onClick, children, focused }) {
  const barRef = useRef(null);
  const timerRef = useRef(null);

  const startDwell = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "width 2s linear";
    barRef.current.style.width = "100%";
    timerRef.current = setTimeout(() => onClick(), 2000);
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

  const handleGesture = useCallback(
    (gesture) => {
      // Si hay teclado abierto, HEAD_DOWN cierra el teclado
      if (activeField) {
        if (gesture === "HEAD_DOWN") setActiveField(null);
        return;
      }
      const graph = buildGraph(modo);
      const node = graph[focusedEl];
      if (!node) return;
      const dirMap = {
        HEAD_DOWN: "down",
        HEAD_UP: "up",
        HEAD_RIGHT: "right",
        HEAD_LEFT: "left",
      };
      const nextEl = node[dirMap[gesture]];
      if (nextEl) setFocusedEl(nextEl);
    },
    [focusedEl, modo, activeField],
  );

  useHeadGesture({ onGesture: handleGesture, enabled: true });

  const fieldFocused = (id) => focusedEl === id;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mímica</h1>

      {/* Tabs */}
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

      {/* Formulario */}
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
          hint="Mantén la mirada 2 s para confirmar"
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
            onClick={() => navigate("/forgot-password")}
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

      {/* Teclado T9 */}
      {activeField && (
        <T9Keyboard
          onKey={handleT9Key}
          onBackspace={handleT9Backspace}
          onConfirm={handleT9Confirm}
        />
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
};

export default Login;
