import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/admin/Estadisticas.css";

function Estadisticas() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resStats, resInsights] = await Promise.all([
          api.get("/admin/estadisticas"),
          api.get("/admin/insights"),
        ]);
        setStats(resStats.data);
        setInsights(resInsights.data);
      } catch {
        console.error("Error al cargar estadísticas");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return (
    <div className="est-wrap">
      <div className="est-orbe est-orbe-1" /><div className="est-orbe est-orbe-2" />
      <p className="est-loading">Cargando...</p>
    </div>
  );

  return (
    <div className="est-wrap">
      <div className="est-orbe est-orbe-1" />
      <div className="est-orbe est-orbe-2" />

      <div className="est-container">

        <div className="est-header">
          <div>
            <h2 className="est-title">Estadísticas</h2>
            <p className="est-subtitle">Métricas generales del sistema</p>
          </div>
          <div className="est-badge">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <line x1="18" y1="20" x2="18" y2="10" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="20" x2="12" y2="4" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="20" x2="6" y2="14" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            En tiempo real
          </div>
        </div>

        <div className="est-grid">
          <div className="est-card">
            <div className="est-card-top-border" />
            <div className="est-card-icon est-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2"/>
              </svg>
            </div>
            <p className="est-card-label">Pedidos hoy</p>
            <p className="est-card-value est-value-blue">{stats?.pedidosHoy ?? "—"}</p>
            <p className="est-card-hint">Pedidos recibidos hoy</p>
          </div>

          <div className="est-card">
            <div className="est-card-top-border est-top-green" />
            <div className="est-card-icon est-icon-green">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="est-card-label">Total generado</p>
            <p className="est-card-value est-value-green">${stats?.totalGenerado ?? "—"}</p>
            <p className="est-card-hint">Ingresos totales del sistema</p>
          </div>

          <div className="est-card est-card-wide">
            <div className="est-card-top-border est-top-purple" />
            <div className="est-card-icon est-icon-purple">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="est-card-label">Local con más ventas</p>
            <p className="est-card-value est-value-purple est-value-local">
              {stats?.localMasVentas ?? "—"}
            </p>
            <p className="est-card-hint">Local líder en pedidos completados</p>
          </div>
        </div>

        {insights && (
          <>
            <div className="est-header" style={{ marginTop: 8 }}>
              <div>
                <h2 className="est-title" style={{ fontSize: 20 }}>Patrones de consumo</h2>
                <p className="est-subtitle">Data Mining sobre pedidos entregados</p>
              </div>
            </div>

            <div className="est-grid">
              <RankingCard
                titulo="Productos más vendidos"
                items={insights.productosMasVendidos.map((p) => ({
                  etiqueta: p.nombre,
                  valor: p.unidadesVendidas,
                }))}
                colorClase="est-top-blue"
                vacio="Aún no hay pedidos entregados"
              />

              <RankingCard
                titulo="Categorías más populares"
                items={insights.categoriasPopulares.map((c) => ({
                  etiqueta: c._id || "Otro",
                  valor: c.unidadesVendidas,
                }))}
                colorClase="est-top-green"
                vacio="Aún no hay pedidos entregados"
              />

              <RankingCard
                titulo="Horarios con más pedidos"
                items={insights.horariosPico.map((h) => ({
                  etiqueta: ETIQUETAS_HORARIO[h._id] || h._id,
                  valor: h.totalPedidos,
                }))}
                colorClase="est-top-purple"
                vacio="Aún no hay pedidos registrados"
              />

              <RankingCard
                titulo="Días con más pedidos"
                items={insights.diasPopulares.map((d) => ({
                  etiqueta: d.dia,
                  valor: d.totalPedidos,
                }))}
                colorClase="est-top-orange"
                vacio="Aún no hay pedidos registrados"
              />
            </div>
          </>
        )}

      </div>
    </div>
  );
}

const ETIQUETAS_HORARIO = { manana: "Mañana", mediodia: "Mediodía", tarde: "Tarde" };

function RankingCard({ titulo, items, colorClase, vacio }) {
  const maxValor = Math.max(1, ...items.map((i) => i.valor));
  return (
    <div className="est-card">
      <div className={`est-card-top-border ${colorClase}`} />
      <p className="est-card-label">{titulo}</p>
      {items.length === 0 ? (
        <p className="est-card-hint">{vacio}</p>
      ) : (
        <div className="est-rank-list">
          {items.map((item, i) => (
            <div key={i} className="est-rank-item">
              <div className="est-rank-top">
                <span className="est-rank-etiqueta">{item.etiqueta}</span>
                <span className="est-rank-valor">{item.valor}</span>
              </div>
              <div className="est-rank-track">
                <div
                  className="est-rank-fill"
                  style={{ width: `${(item.valor / maxValor) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Estadisticas;