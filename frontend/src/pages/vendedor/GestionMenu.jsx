import { useEffect, useState } from "react";
import api from "../../services/api";

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
    setError("");
    setMensaje("");

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
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setStock("");
      setImagen(null);
      setPreview(null);
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
    setPreview(producto.imagen ? `http://localhost:5000${producto.imagen}` : null);
    setMenuAbierto(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

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

      setProductos((prev) =>
        prev.map((p) => (p._id === editando._id ? res.data.producto : p))
      );
      setMensaje("Producto actualizado correctamente");
      setEditando(null);
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setStock("");
      setImagen(null);
      setPreview(null);
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
    } catch {
      alert("Error al eliminar producto");
    }
  };

  const toggleActivo = async (id) => {
    try {
      const res = await api.put(`/productos/${id}/toggle`);
      setProductos((prev) =>
        prev.map((p) => (p._id === id ? res.data.producto : p))
      );
      setMenuAbierto(null);
    } catch {
      alert("Error al cambiar estado del producto");
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setImagen(null);
    setPreview(null);
  };

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Menú</h2>

      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-700 mb-4">
          {editando ? "✏️ Editar Producto" : "Agregar Producto"}
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {mensaje}
          </div>
        )}

        <form onSubmit={editando ? handleEditar : handleCrearProducto} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Ej: Taco de pastor"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Opcional"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-1">Precio ($)</label>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-1">Stock</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImagen}
              className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:outline-none"
            />
            {preview && (
              <img src={preview} className="w-24 h-24 object-cover rounded-lg mt-2 border" />
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              {editando ? "Guardar cambios" : "Agregar Producto"}
            </button>
            {editando && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <h3 className="text-lg font-bold text-gray-700 mb-4">Mis Productos ({productos.length})</h3>

      {productos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          No tienes productos aún. ¡Agrega el primero!
        </div>
      ) : (
        <div className="space-y-3">
          {productos.map((producto) => (
            <div
              key={producto._id}
              className={`bg-white rounded-2xl shadow p-5 flex gap-4 items-center relative ${!producto.activo ? "opacity-50" : ""}`}
            >
              {producto.imagen ? (
                <img
                  src={`http://localhost:5000${producto.imagen}`}
                  alt={producto.nombre}
                  className="w-20 h-20 object-cover rounded-xl border"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-2xl">
                  🍽️
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{producto.nombre}</p>
                  {!producto.activo && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      Desactivado
                    </span>
                  )}
                </div>
                {producto.descripcion && (
                  <p className="text-gray-500 text-sm mt-1">{producto.descripcion}</p>
                )}
                <p className="text-blue-600 font-bold mt-1">${producto.precio}</p>
                <p className="text-gray-400 text-sm">Stock: {producto.stock}</p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuAbierto(menuAbierto === producto._id ? null : producto._id)}
                  className="text-gray-400 hover:text-gray-700 text-xl font-bold px-2"
                >
                  ⋯
                </button>
                {menuAbierto === producto._id && (
                  <div className="absolute right-0 top-8 bg-white border rounded-xl shadow-lg z-10 w-36">
                    <button
                      onClick={() => iniciarEdicion(producto)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm rounded-t-xl"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(producto._id)}
                      className="w-full text-left px-4 py-3 hover:bg-yellow-50 text-yellow-600 text-sm"
                    >
                      {producto.activo ? "⏸️ Desactivar" : "▶️ Activar"}
                    </button>
                    <button
                      onClick={() => eliminar(producto._id)}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm rounded-b-xl"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GestionMenu;