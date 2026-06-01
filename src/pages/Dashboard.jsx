import { useState, useRef } from "react";

function Dashboard() {
  const [libros, setLibros] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const agregarArchivos = (files) => {
    const validos = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".epub"),
    );
    const nuevos = validos.map((f) => ({
      id: Date.now() + Math.random(),
      nombre: f.name,
      tipo: f.name.endsWith(".epub") ? "epub" : "pdf",
    }));
    setLibros((prev) => [...prev, ...nuevos]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    agregarArchivos(e.dataTransfer.files);
  };

  return (
    <div style={styles.page}>
      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <div style={styles.logoPlaceholder}>Logo</div>
          <span style={styles.navNombre}>Mímica</span>
        </div>
      </nav>

      {/* Contenido */}
      <div style={styles.contenido}>
        <h2 style={styles.titulo}>Biblioteca</h2>

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
          {/* Tarjetas de libros */}
          {libros.map((libro) => (
            <div key={libro.id} style={styles.tarjeta}>
              <span style={styles.tipoTag}>{libro.tipo.toUpperCase()}</span>
              <span style={styles.nombreLibro}>{libro.nombre}</span>
            </div>
          ))}

          {/* Botón agregar */}
          <button
            style={styles.btnAgregar}
            onClick={() => inputRef.current.click()}
          >
            <span style={styles.mas}>+</span>
          </button>

          {/* Input oculto */}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.epub"
            multiple
            style={{ display: "none" }}
            onChange={(e) => agregarArchivos(e.target.files)}
          />
        </div>

        {/* Hint drag and drop */}
        {libros.length === 0 && (
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
};

export default Dashboard;
