// src/components/T9Keyboard.jsx
import { useState, useRef, useEffect } from "react";

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
const CONFIRM_COOLDOWN = 400;
const DWELL_TIME = 7000;

function DwellKey({
  onActivate,
  children,
  style,
  dwellColor = "#1D9E75",
  focused = false,
}) {
  const barRef = useRef(null);
  const timerRef = useRef(null);

  const start = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = `width ${DWELL_TIME}ms linear`;
    barRef.current.style.width = "100%";
    timerRef.current = setTimeout(() => {
      onActivate();
      stop();
    }, DWELL_TIME);
  };

  const stop = () => {
    if (!barRef.current) return;
    barRef.current.style.transition = "none";
    barRef.current.style.width = "0%";
    clearTimeout(timerRef.current);
  };

  // Solo el foco por gestos controla el dwell — sin onMouseEnter/Leave
  useEffect(() => {
    if (focused) start();
    else stop();
    return () => clearTimeout(timerRef.current);
  }, [focused]);

  return (
    <button
      style={{
        ...styles.keyBase,
        ...style,
        outline: focused ? "2px solid #1D9E75" : "none",
        outlineOffset: focused ? "1px" : "0",
      }}
    >
      {children}
      <div
        ref={barRef}
        style={{ ...styles.dwellBar, background: dwellColor }}
      />
    </button>
  );
}

// Recorta la columna al rango válido de la fila destino
function clamp(grid, fila, col) {
  const filaSegura = Math.max(0, Math.min(fila, grid.length - 1));
  const colMax = grid[filaSegura].length - 1;
  const colSegura = Math.max(0, Math.min(col, colMax));
  return { fila: filaSegura, col: colSegura };
}

function T9Keyboard({ onKey, onBackspace, onConfirm, gesto }) {
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [mostrarSimbolos, setMostrarSimbolos] = useState(false);
  const [capsMode, setCapsMode] = useState("off");
  const [foco, setFoco] = useState({ fila: 0, col: 0 });
  const ultimaConfirmacionRef = useRef(0);

  const applyCase = (letra) => {
    if (capsMode === "off") return letra;
    return letra.toUpperCase();
  };

  const handleLetra = (letra) => {
    onKey(applyCase(letra));
    setGrupoActivo(null);
    setMostrarSimbolos(false);
    setFoco({ fila: 0, col: 0 });
    if (capsMode === "once") setCapsMode("off");
  };

  const handleCaps = () => {
    setCapsMode((prev) => {
      if (prev === "off") return "once";
      if (prev === "once") return "lock";
      return "off";
    });
  };

  const abrirGrupo = (g) => {
    setGrupoActivo(g);
    setFoco({ fila: 0, col: 0 });
  };

  const abrirSimbolos = () => {
    setMostrarSimbolos(true);
    setFoco({ fila: 0, col: 0 });
  };

  const cerrarVista = () => {
    setGrupoActivo(null);
    setMostrarSimbolos(false);
    setFoco({ fila: 0, col: 0 });
  };

  // ── Construcción de grillas por vista ───────────────────────────────────
  function buildGridSimbolos() {
    const filas = [];
    for (let i = 0; i < simbolos.length; i += 4) {
      filas.push(
        simbolos.slice(i, i + 4).map((s) => ({
          render: s,
          onActivate: () => handleLetra(s),
          style: styles.letraKey,
        })),
      );
    }
    filas.push([
      {
        render: "←",
        onActivate: cerrarVista,
        style: { ...styles.letraKey, ...styles.cancelInGrid },
        dwellColor: "#E24B4A",
      },
    ]);
    return filas;
  }

  function buildGridGrupo(g) {
    const filaLetras = g.letras.map((l) => ({
      render: l === g.num ? l : applyCase(l),
      onActivate: () => handleLetra(l),
      style: {
        ...styles.letraKey,
        ...(l === g.num ? styles.letraNumKey : {}),
      },
    }));

    const capsLabel =
      capsMode === "off" ? "⇧" : capsMode === "once" ? "⇧¹" : "⇪";
    const capsStyle = {
      ...styles.letraKey,
      background:
        capsMode === "lock" ? "#111" : capsMode === "once" ? "#444" : "#ebebeb",
      color: capsMode !== "off" ? "#fff" : "#111",
      fontSize: "18px",
    };

    const filaAcciones = [
      {
        render: capsLabel,
        onActivate: handleCaps,
        style: capsStyle,
        dwellColor: capsMode !== "off" ? "#fff" : "#1D9E75",
      },
      {
        render: "↩",
        onActivate: cerrarVista,
        style: { ...styles.letraKey, ...styles.cancelInGrid },
        dwellColor: "#E24B4A",
      },
    ];

    return [filaLetras, filaAcciones];
  }

  function buildGridPrincipal() {
    const filasGrupos = [];
    for (let i = 0; i < grupos.length; i += 3) {
      filasGrupos.push(
        grupos.slice(i, i + 3).map((g) => ({
          render: (
            <>
              <span style={styles.grupoNum}>{g.num}</span>
              <span style={styles.grupoLetras}>
                {capsMode !== "off"
                  ? g.letras.slice(1).join("").toUpperCase()
                  : g.letras.slice(1).join("")}
              </span>
            </>
          ),
          onActivate: () => abrirGrupo(g),
          style: styles.grupoKey,
        })),
      );
    }

    const filaAcciones = [
      {
        render: "⌫",
        onActivate: onBackspace,
        style: styles.accionKey,
        dwellColor: "#E24B4A",
      },
      {
        render: "@",
        onActivate: () => onKey("@"),
        style: { ...styles.accionKey, fontSize: "18px" },
      },
      {
        render: ".com",
        onActivate: () => onKey(".com"),
        style: { ...styles.accionKey, fontSize: "12px" },
      },
    ];

    const filaSimbolos = [
      {
        render: "!?# símbolos",
        onActivate: abrirSimbolos,
        style: { ...styles.accionKey, fontSize: "12px", gridColumn: "span 3" },
      },
    ];

    const filaDominios = dominios.map((d) => ({
      render: d,
      onActivate: () => onKey(d),
      style: styles.dominioKey,
    }));

    const filaConfirmar = [
      {
        render: "Confirmar →",
        onActivate: onConfirm,
        style: styles.confirmKey,
      },
    ];

    return [
      ...filasGrupos,
      filaAcciones,
      filaSimbolos,
      filaDominios,
      filaConfirmar,
    ];
  }

  const grid = mostrarSimbolos
    ? buildGridSimbolos()
    : grupoActivo
      ? buildGridGrupo(grupoActivo)
      : buildGridPrincipal();

  // ── Navegación por gestos ───────────────────────────────────────────────
  useEffect(() => {
    if (!gesto) return;
    const tipo = gesto.tipo ?? gesto;

    if (tipo === "UP") setFoco((f) => clamp(grid, f.fila - 1, f.col));
    if (tipo === "DOWN") setFoco((f) => clamp(grid, f.fila + 1, f.col));
    if (tipo === "LEFT") setFoco((f) => clamp(grid, f.fila, f.col - 1));
    if (tipo === "RIGHT") setFoco((f) => clamp(grid, f.fila, f.col + 1));

    if (tipo === "CONFIRM") {
      const ahora = Date.now();
      if (ahora - ultimaConfirmacionRef.current < CONFIRM_COOLDOWN) return;
      ultimaConfirmacionRef.current = ahora;

      const celda = grid[foco.fila]?.[foco.col];
      celda?.onActivate?.();
    }
  }, [gesto]);

  // Si cambia el grid (nueva vista), recorta el foco a un rango válido
  useEffect(() => {
    setFoco((f) => clamp(grid, f.fila, f.col));
  }, [grupoActivo, mostrarSimbolos]);

  const subTitulo = mostrarSimbolos
    ? "Elige un símbolo"
    : grupoActivo
      ? `Elige del grupo ${grupoActivo.num}${
          capsMode !== "off"
            ? capsMode === "once"
              ? " · próxima en mayúscula"
              : " · BLOQ MAYÚS"
            : ""
        }`
      : null;

  return (
    <div style={styles.board}>
      {subTitulo && <p style={styles.subTitle}>{subTitulo}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            mostrarSimbolos || grupoActivo
              ? "repeat(4, 1fr)"
              : "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        {grid.map((fila, fi) =>
          fila.map((celda, ci) => (
            <DwellKey
              key={`${fi}-${ci}`}
              onActivate={celda.onActivate}
              style={celda.style}
              dwellColor={celda.dwellColor}
              focused={foco.fila === fi && foco.col === ci}
            >
              {celda.render}
            </DwellKey>
          )),
        )}
      </div>
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
  keyBase: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "10px",
    border: "0.5px solid #ccc",
    background: "#fff",
    color: "#111",
    cursor: "default",
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
    color: "#555",
    fontSize: "18px",
    border: "0.5px solid #ccc",
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
