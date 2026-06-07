// src/pages/Dashboard.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listarDocumentos, subirDocumento, eliminarDocumento } from "../api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const [libros, setLibros] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [libroAbierto, setLibroAbierto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const inputRef = useRef();
  const navigate = useNavigate();
  const { token, cerrarSesion } = useAuth();

  // Cargar documentos al entrar
  useEffect(() => {
    if (!token) return;
    listarDocumentos()
      .then((data) => setLibros(data))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [token]);

  const agregarArchivos = async (files) => {
    const validos = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".epub"),
    );

    for (const f of validos) {
      const tipo = f.name.endsWith(".epub") ? "epub" : "pdf";
      const urlLocal = URL.createObjectURL(f);

      if (token) {
        try {
          const nuevo = await subirDocumento(f.name, tipo, urlLocal);
          setLibros((prev) => [...prev, { ...nuevo, url: urlLocal }]);
        } catch (e) {
          setError(`Error al subir ${f.name}: ${e.message}`);
        }
      } else {
        // modo invitado — solo local
        setLibros((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            nombre: f.name,
            tipo,
            url: urlLocal,
          },
        ]);
      }
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    agregarArchivos(e.dataTransfer.files);
  };

  const handleEliminar = async (e, id) => {
    e.stopPropagation();
    try {
      await eliminarDocumento(id);
      setLibros((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  if (libroAbierto) {
    return (
      <div style={styles.lector}>
        <button style={styles.btnVolver} onClick={() => setLibroAbierto(null)}>
          ← Volver a la biblioteca
        </button>
        <iframe
          src={libroAbierto.url}
          style={styles.iframe}
          title={libroAbierto.nombre}
        />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <div style={styles.logoPlaceholder}>Logo</div>
          <span style={styles.navNombre} onClick={() => navigate("/")}>
            Mímica
          </span>
        </div>
        {token && (
          <button
            style={styles.btnCerrarSesion}
            onClick={() => {
              cerrarSesion();
              navigate("/login");
            }}
          >
            Cerrar sesión
          </button>
        )}
      </nav>

      {/* Contenido */}
      <div style={styles.contenido}>
        <h2 style={styles.titulo}>Biblioteca</h2>

        {error && <p style={styles.error}>{error}</p>}
        {cargando && <p style={styles.hint}>Cargando biblioteca...</p>}

        {/* Grid */}
        <div
          style={{
            ...styles.grid,
            borderColor: dragging ? "#111" : "transparent",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {libros.map((libro) => (
            <div
              key={libro.id}
              style={styles.tarjeta}
              onClick={() => setLibroAbierto(libro)}
            >
              <span style={styles.tipoTag}>
                {(libro.tipo || "pdf").toUpperCase()}
              </span>
              <span style={styles.nombreLibro}>{libro.nombre}</span>
              <button
                style={styles.btnEliminar}
                onClick={(e) => handleEliminar(e, libro.id)}
              >
                ✕
              </button>
            </div>
          ))}

          {/* Botón agregar */}
          <button
            style={styles.btnAgregar}
            onClick={() => inputRef.current.click()}
          >
            <span style={styles.mas}>+</span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.epub"
            multiple
            style={{ display: "none" }}
            onChange={(e) => agregarArchivos(e.target.files)}
          />
        </div>

        {!cargando && libros.length === 0 && (
          <p style={styles.hint}>
            También puedes arrastrar archivos PDF o EPUB aquí
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1.5rem",
    borderBottom: "1px solid #eee",
  },
  navLogo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoPlaceholder: {
    width: "32px",
    height: "32px",
    background: "#f0f0f0",
    border: "1px dashed #aaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.5rem",
    color: "#999",
    borderRadius: "2px",
  },
  navNombre: {
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnCerrarSesion: {
    padding: "0.4rem 0.9rem",
    background: "none",
    border: "1px solid #ccc",
    borderRadius: "2px",
    fontSize: "0.8rem",
    cursor: "pointer",
    color: "#555",
  },
  contenido: {
    padding: "2rem",
    flex: 1,
  },
  titulo: {
    fontSize: "1.3rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
  },
  error: {
    fontSize: "0.8rem",
    color: "#c00",
    marginBottom: "1rem",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    minHeight: "120px",
    border: "2px dashed transparent",
    borderRadius: "8px",
    padding: "0.5rem",
    transition: "border-color 0.2s",
  },
  tarjeta: {
    width: "100px",
    height: "130px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.5rem",
    background: "#fafafa",
    cursor: "pointer",
    position: "relative",
  },
  tipoTag: {
    fontSize: "0.6rem",
    fontWeight: "bold",
    color: "#666",
    background: "#eee",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  nombreLibro: {
    fontSize: "0.65rem",
    color: "#333",
    textAlign: "center",
    wordBreak: "break-word",
  },
  btnEliminar: {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "none",
    border: "none",
    fontSize: "0.65rem",
    color: "#aaa",
    cursor: "pointer",
    padding: "0",
    lineHeight: 1,
  },
  btnAgregar: {
    width: "100px",
    height: "130px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mas: {
    fontSize: "2rem",
    color: "#333",
    lineHeight: 1,
  },
  hint: {
    marginTop: "1rem",
    fontSize: "0.75rem",
    color: "#aaa",
  },
  lector: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
  },
  btnVolver: {
    padding: "0.6rem 1.2rem",
    background: "#111",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    alignSelf: "flex-start",
    margin: "0.75rem",
  },
  iframe: {
    flex: 1,
    border: "none",
    width: "100%",
  },
};

export default Dashboard;
