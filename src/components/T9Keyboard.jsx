// src/components/T9Keyboard.jsx
import { useState, useRef } from "react";

const grupos = [
  { num: "1", letras: ["1", "a", "b", "c"] },
  { num: "2", letras: ["2", "d", "e", "f"] },
  { num: "3", letras: ["3", "g", "h", "i"] },
  { num: "4", letras: ["4", "j", "k", "l"] },
  { num: "5", letras: ["5", "m", "n", "o"] },
  { num: "6", letras: ["6", "p", "q", "r", "s"] },
  { num: "7", letras: ["7", "t", "u", "v"] },
  { num: "8", letras: ["8", "w", "x", "y", "z"] },
  { num: "9", letras: ["9", ".", "_", "-"] },
];

const simbolos = ["!", "?", "@", "#", "$", "%", "&", "*", ".", ",", "-", "_"];
const dominios = ["@gmail.com", "@hotmail.com", "@outlook.com"];

function DwellKey({ onActivate, children, style, dwellColor = "#1D9E75" }) {
  const barRef = useRef(null);
  const timerRef = useRef(null);

  const start = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "width 1.2s linear";
    barRef.current.style.width = "100%";
    timerRef.current = setTimeout(() => {
      onActivate();
      stop();
    }, 1200);
  };

  const stop = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "none";
    barRef.current.style.width = "0%";
    clearTimeout(timerRef.current);
  };

  return (
    <button
      style={{ ...styles.keyBase, ...style }}
      onMouseEnter={start}
      onMouseLeave={stop}
    >
      {children}
      <div
        ref={barRef}
        style={{ ...styles.dwellBar, background: dwellColor }}
      />
    </button>
  );
}

function T9Keyboard({ onKey, onBackspace, onConfirm }) {
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [mostrarSimbolos, setMostrarSimbolos] = useState(false);
  const [capsMode, setCapsMode] = useState("off");

  const applyCase = (letra) => {
    if (capsMode === "off") return letra;
    return letra.toUpperCase();
  };

  const handleLetra = (letra) => {
    onKey(applyCase(letra));
    setGrupoActivo(null);
    setMostrarSimbolos(false);
    if (capsMode === "once") setCapsMode("off");
  };

  const handleCaps = () => {
    setCapsMode((prev) => {
      if (prev === "off") return "once";
      if (prev === "once") return "lock";
      return "off";
    });
  };

  const capsLabel = capsMode === "off" ? "⇧" : capsMode === "once" ? "⇧¹" : "⇪";
  const capsStyle = {
    ...styles.letraKey,
    background:
      capsMode === "lock" ? "#111" : capsMode === "once" ? "#444" : "#ebebeb",
    color: capsMode !== "off" ? "#fff" : "#111",
    fontSize: "18px",
  };

  // Vista: símbolos
  if (mostrarSimbolos) {
    return (
      <div style={styles.board}>
        <p style={styles.subTitle}>Elige un símbolo</p>
        <div style={styles.letrasGrid}>
          {simbolos.map((s) => (
            <DwellKey
              key={s}
              onActivate={() => handleLetra(s)}
              style={styles.letraKey}
            >
              {s}
            </DwellKey>
          ))}
          <DwellKey
            onActivate={() => setMostrarSimbolos(false)}
            style={{ ...styles.letraKey, ...styles.cancelInGrid }}
            dwellColor="#E24B4A"
          >
            ←
          </DwellKey>
        </div>
      </div>
    );
  }

  // Vista: letras del grupo
  if (grupoActivo) {
    return (
      <div style={styles.board}>
        <p style={styles.subTitle}>
          Elige del grupo {grupoActivo.num}
          {capsMode !== "off" && (
            <span style={{ marginLeft: 8, fontSize: "11px", color: "#1D9E75" }}>
              {capsMode === "once" ? "· próxima en mayúscula" : "· BLOQ MAYÚS"}
            </span>
          )}
        </p>
        <div style={styles.letrasGrid}>
          {grupoActivo.letras.map((l) => (
            <DwellKey
              key={l}
              onActivate={() => handleLetra(l)}
              style={{
                ...styles.letraKey,
                ...(l === grupoActivo.num ? styles.letraNumKey : {}),
              }}
            >
              {l === grupoActivo.num ? l : applyCase(l)}
            </DwellKey>
          ))}
          <DwellKey
            onActivate={handleCaps}
            style={capsStyle}
            dwellColor={capsMode !== "off" ? "#fff" : "#1D9E75"}
          >
            {capsLabel}
          </DwellKey>
          <DwellKey
            onActivate={() => setGrupoActivo(null)}
            style={{ ...styles.letraKey, ...styles.cancelInGrid }}
            dwellColor="#E24B4A"
          >
            ←
          </DwellKey>
        </div>
      </div>
    );
  }

  // Vista: teclado principal
  return (
    <div style={styles.board}>
      <div style={styles.grid}>
        {grupos.map((g) => (
          <DwellKey
            key={g.num}
            onActivate={() => setGrupoActivo(g)}
            style={styles.grupoKey}
          >
            <span style={styles.grupoNum}>{g.num}</span>
            <span style={styles.grupoLetras}>
              {capsMode !== "off"
                ? g.letras.slice(1).join("").toUpperCase()
                : g.letras.slice(1).join("")}
            </span>
          </DwellKey>
        ))}

        <DwellKey
          onActivate={onBackspace}
          style={styles.accionKey}
          dwellColor="#E24B4A"
        >
          ⌫
        </DwellKey>
        <DwellKey
          onActivate={() => onKey("@")}
          style={{ ...styles.accionKey, fontSize: "18px" }}
        >
          @
        </DwellKey>
        <DwellKey
          onActivate={() => onKey(".com")}
          style={{ ...styles.accionKey, fontSize: "12px" }}
        >
          .com
        </DwellKey>
        <DwellKey
          onActivate={() => setMostrarSimbolos(true)}
          style={{
            ...styles.accionKey,
            fontSize: "12px",
            gridColumn: "span 3",
          }}
        >
          !?# símbolos
        </DwellKey>
      </div>

      <div style={styles.dominiosGrid}>
        {dominios.map((d) => (
          <DwellKey
            key={d}
            onActivate={() => onKey(d)}
            style={styles.dominioKey}
          >
            {d}
          </DwellKey>
        ))}
      </div>

      <DwellKey onActivate={onConfirm} style={styles.confirmKey}>
        Confirmar →
      </DwellKey>
    </div>
  );
}

const styles = {
  board: {
    width: "100%",
    background: "#f3f3f3",
    border: "0.5px solid #e0e0e0",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  keyBase: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "10px",
    border: "0.5px solid #ccc",
    background: "#fff",
    color: "#111",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  grupoKey: {
    height: "52px",
    flexDirection: "column",
    gap: "2px",
  },
  grupoNum: {
    fontSize: "17px",
    fontWeight: "500",
    lineHeight: 1,
  },
  grupoLetras: {
    fontSize: "10px",
    color: "#888",
  },
  accionKey: {
    height: "44px",
    background: "#ebebeb",
    fontSize: "15px",
    fontWeight: "500",
  },
  dominiosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  dominioKey: {
    height: "36px",
    fontSize: "10px",
    fontWeight: "500",
    background: "#ebebeb",
  },
  confirmKey: {
    width: "100%",
    height: "44px",
    background: "#111",
    color: "#fff",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "10px",
  },
  letrasGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  letraKey: {
    height: "60px",
    fontSize: "22px",
    fontWeight: "500",
  },
  letraNumKey: {
    background: "#f3f3f3",
    color: "#888",
    fontSize: "18px",
  },
  cancelInGrid: {
    background: "#ebebeb",
    color: "#E24B4A",
    fontSize: "18px",
    border: "0.5px solid #E24B4A",
  },
  subTitle: {
    fontSize: "13px",
    color: "#666",
    textAlign: "center",
    margin: 0,
  },
  dwellBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "3px",
    width: "0%",
    borderRadius: "0 0 10px 10px",
    pointerEvents: "none",
  },
};

export default T9Keyboard;
