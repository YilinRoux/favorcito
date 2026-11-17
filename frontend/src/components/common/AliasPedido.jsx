import "../../styles/common/AliasPedido.css";

/** Alias hablado del pedido (ej. "Ana12"): lo dicen el cliente, el local y el repartidor. */
function AliasPedido({ alias, grande = false }) {
  if (!alias) return null;
  return <span className={`alias-pedido${grande ? " alias-pedido--grande" : ""}`}>{alias}</span>;
}

export default AliasPedido;
