import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/vendedor/GestionMenu.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.1.132:5000";

function GestionMenu() {
  const [productos, setProductos] = useState([]);
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);

  const [editando, setEditando] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const localRes = await api.get("/locales/mi-local");
        setLocal(localRes.data);
        const productosRes = await api.get(`/productos/local/${localRes.data._id}`);
        setProductos(productosRes.data);
      } catch {
        setError("Error al cargar información");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const handleImagen = (e) => {
    const file = e.target.files[0];
    setImagen(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setError(""); setMensaje("");
    if (!nombre.trim() || !precio || !stock) {
      setError("Nombre, precio y stock son obligatorios");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("descripcion", descripcion);
      formData.append("precio", Number(precio));
      formData.append("stock", Number(stock));
      formData.append("localId", local._id);
      if (imagen) formData.append("imagen", imagen);
      const res = await api.post("/productos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProductos((prev) => [...prev, res.data.producto]);
      setMensaje("Producto agregado correctamente");
      setNombre(""); setDescripcion(""); setPrecio(""); setStock("");
      setImagen(null); setPreview(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al crear producto");
    }
  };

  const iniciarEdicion = (producto) => {
    setEditando(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion || "");
    setPrecio(producto.precio);
    setStock(producto.stock);
    setPreview(producto.imagen ? `${BASE_URL}${producto.imagen}` : null);
    setMenuAbierto(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setError(""); setMensaje("");
    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("descripcion", descripcion);
      formData.append("precio", Number(precio));
      formData.append("stock", Number(stock));
      if (imagen) formData.append("imagen", imagen);
      const res = await api.put(`/productos/${editando._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProductos((prev) => prev.map((p) => (p._id === editando._id ? res.data.producto : p)));
      setMensaje("Producto actualizado correctamente");
      setEditando(null);
      setNombre(""); setDescripcion(""); setPrecio(""); setStock("");
      setImagen(null); setPreview(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al editar producto");
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
    try {
      await api.delete(`/productos/${id}`);
      setProductos((prev) => prev.filter((p) => p._id !== id));
      setMenuAbierto(null);
    } catch { alert("Error al eliminar producto"); }
  };

  const toggleActivo = async (id) => {
    try {
      const res = await api.put(`/productos/${id}/toggle`);
      setProductos((prev) => prev.map((p) => (p._id === id ? res.data.producto : p)));
      setMenuAbierto(null);
    } catch { alert("Error al cambiar estado del producto"); }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setNombre(""); setDescripcion(""); setPrecio(""); setStock("");
    setImagen(null); setPreview(null);
  };

  if (cargando) return (
    <div className="gm-wrap">
      <div className="gm-orbe gm-orbe-1" /><div className="gm-orbe gm-orbe-2" />
      <p className="gm-loading">Cargando...</p>
    </div>
  );

  return (
    <div className="gm-wrap">
      <div className="gm-orbe gm-orbe-1" />
      <div className="gm-orbe gm-orbe-2" />

      <div className="gm-container">
        <h2 className="gm-page-title">
          <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Gestión de Menú
        </h2>

        {/* Formulario */}
        <div className="gm-card">
          <div className="gm-card-top-border" />
          <h3 className="gm-card-title">
            {editando ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Editar Producto
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <circle cx="12" cy="12" r="10" stroke="#FF5C0A" strokeWidth="2"/>
                  <path d="M12 8v8M8 12h8" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Agregar Producto
              </>
            )}
          </h3>

          {error && (
            <div className="gm-error">
              <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}
          {mensaje && (
            <div className="gm-success">
              <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {mensaje}
            </div>
          )}

          <form onSubmit={editando ? handleEditar : handleCrearProducto} className="gm-form">
            <div className="gm-field">
              <label className="gm-label">NOMBRE</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="gm-input" placeholder="Ej: Taco de pastor"/>
            </div>
            <div className="gm-field">
              <label className="gm-label">DESCRIPCIÓN</label>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="gm-input" placeholder="Opcional"/>
            </div>
            <div className="gm-row">
              <div className="gm-field">
                <label className="gm-label">PRECIO ($)</label>
                <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} className="gm-input" placeholder="0.00" min="0"/>
              </div>
              <div className="gm-field">
                <label className="gm-label">STOCK</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="gm-input" placeholder="0" min="0"/>
              </div>
            </div>
            <div className="gm-field">
              <label className="gm-label">IMAGEN</label>
              <label className="gm-file-label">
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Seleccionar imagen
                <input type="file" accept="image/*" onChange={handleImagen} className="gm-file-input"/>
              </label>
              {preview && <img src={preview} className="gm-preview"/>}
            </div>
            <div className="gm-btn-row">
              <button type="submit" className="gm-btn-primary">
                <span className="gm-btn-shimmer"/>
                {editando ? "Guardar cambios" : "Agregar Producto"}
              </button>
              {editando && (
                <button type="button" onClick={cancelarEdicion} className="gm-btn-secondary">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de productos */}
        <h3 className="gm-section-title">Mis Productos ({productos.length})</h3>

        {productos.length === 0 ? (
          <div className="gm-empty">
            <svg viewBox="0 0 24 24" fill="none" width="36" height="36">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>No tienes productos aún. ¡Agrega el primero!</p>
          </div>
        ) : (
          <div className="gm-productos-list">
            {productos.map((producto) => (
              <div key={producto._id} className={`gm-producto-card ${!producto.activo ? "gm-producto-inactivo" : ""}`}>
                <div className="gm-card-top-border"/>
                {producto.imagen ? (
                  <img src={`${BASE_URL}${producto.imagen}`} alt={producto.nombre} className="gm-producto-img"/>
                ) : (
                  <div className="gm-producto-img-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div className="gm-producto-info">
                  <div className="gm-producto-nombre-row">
                    <p className="gm-producto-nombre">{producto.nombre}</p>
                    {!producto.activo && <span className="gm-badge-inactivo">Desactivado</span>}
                  </div>
                  {producto.descripcion && <p className="gm-producto-desc">{producto.descripcion}</p>}
                  <p className="gm-producto-precio">${producto.precio}</p>
                  <p className="gm-producto-stock">Stock: {producto.stock}</p>
                </div>
                <div className="gm-menu-wrap">
                  <button onClick={() => setMenuAbierto(menuAbierto === producto._id ? null : producto._id)} className="gm-menu-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                  {menuAbierto === producto._id && (
                    <div className="gm-dropdown">
                      <button onClick={() => iniciarEdicion(producto)} className="gm-dropdown-item">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Editar
                      </button>
                      <button onClick={() => toggleActivo(producto._id)} className="gm-dropdown-item gm-dropdown-warning">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M10 15l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {producto.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button onClick={() => eliminar(producto._id)} className="gm-dropdown-item gm-dropdown-danger">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                          <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionMenu;