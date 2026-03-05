import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, rol }) {
  const { usuario } = useContext(AuthContext);

  if (!usuario) return <Navigate to="/login" />;

  if (rol && usuario.rol !== rol) {
    return <Navigate to="/" />;
  }

  return children;
}