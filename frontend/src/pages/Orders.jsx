import React, { useContext, useEffect, useState, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import { useNavigate } from 'react-router-dom';
import {
  Package, ChevronDown,
  RefreshCw, Clock, CheckCircle2, Truck, XCircle,
  ShoppingBag, ArrowRight, ShoppingCart
} from 'lucide-react';

/* ─── Status config ─────────────────────────────────────────────────── */
function resolveStatus(status = '', t) {
  const s = String(status || '').toLowerCase();
  if (s.includes('annul') || s.includes('cancel'))
    return { label: t.statusCancelled, pill: 'bg-red-100 text-red-700 border-red-200',     step: -1, icon: XCircle,     color: '#ef4444' };
  if (s.includes('livr') || s.includes('deliver'))
    return { label: t.statusDelivered, pill: 'bg-emerald-100 text-emerald-700 border-emerald-200', step: 3, icon: CheckCircle2, color: '#10b981' };
  if (s.includes('expédi') || s.includes('ship'))
    return { label: t.statusShipped,   pill: 'bg-violet-100 text-violet-700 border-violet-200', step: 2, icon: Truck,       color: '#8b5cf6' };
  if (s.includes('emballage') || s.includes('pack') || s.includes('prep'))
    return { label: t.statusPacking,   pill: 'bg-blue-100 text-blue-700 border-blue-200',   step: 1, icon: Package,     color: '#3b82f6' };
  return   { label: t.statusPending,   pill: 'bg-amber-100 text-amber-700 border-amber-200',step: 0, icon: Clock,       color: '#f59e0b' };
}

/* ─── Progress Bar ──────────────────────────────────────────────────── */
function ProgressBar({ step, t }) {
  const stepLabels = [t.statusPending, t.statusPacking, t.statusShipped, t.statusDelivered];
  if (step === -1) return (
    <div className="flex items-center gap-1.5 mt-3 text-xs text-red-500 font-semibold">
      <XCircle className="w-3.5 h-3.5" /> {t.statusCancelled}
    </div>
  );
  return (
    <div className="mt-3 flex items-center gap-0">
      {stepLabels.map((label, i) => {
        const done = i <= step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                done ? 'bg-primary border-primary' : 'bg-white border-gray-200'
              }`}>
                {i < step  && <span className="text-white text-[8px] font-black">✓</span>}
                {i === step && <span className="w-2 h-2 rounded-full bg-white block" />}
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap leading-none ${done ? 'text-primary' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div className={`flex-1 h-0.5 mb-3.5 transition-all duration-700 ${i < step ? 'bg-primary/60' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Order Card ────────────────────────────────────────────────────── */
function OrderCard({ order, t, lang, isOpen, onToggle }) {
  const st = resolveStatus(order.status, t);
  const StatusIcon = st.icon;
  const dateLocale = lang === 'fr' ? 'fr-FR' : 'en-US';
  const date = order.date
    ? new Date(order.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
      <button
        type="button"
        className="w-full flex items-start justify-between px-4 pt-4 pb-2 text-left select-none cursor-pointer outline-none focus:outline-none focus:ring-0 active:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{ backgroundColor: `${st.color}15`, borderColor: `${st.color}25` }}
          >
            <StatusIcon className="w-4 h-4" style={{ color: st.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 font-mono font-medium">
              #{order._id?.slice(-8).toUpperCase() || 'ORDER'}
            </p>
            <p className="text-sm font-bold text-primary mt-0.5">
              {order.items?.length || 0} {t.items?.toLowerCase() || 'items'} · <span className="text-tertiary font-extrabold">{order.amount} DT</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3 mt-0.5">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${st.pill}`}>
            {st.label}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </div>
      </button>

      <div className="px-4 pb-3">
        <ProgressBar step={st.step} t={t} />
      </div>

      {isOpen && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/30 animate-[fadeDown_0.2s_ease-out]">
          <div className="flex justify-between items-center text-xs text-gray-500 font-medium flex-wrap gap-2">
            <span>📅 {date}</span>
            <span>{order.paymentMethod === 'cod' ? t.cashOnDelivery : order.paymentMethod} · {order.payment ? `✅ ${t.paidBadge}` : `⏳ ${t.pendingBadge}`}</span>
          </div>

          {/* Advance information for client */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
            <div className="flex justify-between items-center font-bold">
              <span className="text-amber-800">
                {order.advancePaid ? "✅ Avance validée par l'administrateur" : "⏳ En attente du versement de l'avance"}
              </span>
              <span className="text-amber-900 font-black">
                {order.advanceAmount || 0} DT
              </span>
            </div>
            {order.advancePaid && (
              <p className="text-[11px] text-gray-600 mt-1 font-medium">
                Reste à payer à la livraison : <span className="font-bold text-primary">{order.remainingAmount !== undefined ? order.remainingAmount : Math.max(0, (order.amount || 0) - (order.advanceAmount || 0))} DT</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-2.5 flex items-center gap-3 shadow-2xs">
                {(item.image?.[0] || item.image) && (
                  <img
                    src={Array.isArray(item.image) ? item.image[0] : item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-primary truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.sizeLabel} {item.size}{item.color && ` · ${item.color}`} · {t.quantity} {item.quantity} · <span className="font-semibold text-tertiary">{item.price} DT</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {order.address && (
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-2xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">📍 {t.shippingAddress}</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {[order.address.firstName, order.address.lastName, order.address.street, order.address.city, order.address.country].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

export default function Orders() {
  const { token, backendUrl } = useContext(ShopContext);
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [orders, setOrders]         = useState([]);
  const [loadingOrders, setLO]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLast]      = useState(new Date());
  const [openOrderIds, setOpenOrderIds] = useState({});

  useEffect(() => { if (!token) navigate('/login'); }, [token, navigate]);

  const toggleOrder = (id) => {
    setOpenOrderIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!token) return;
    silent ? setRefreshing(true) : setLO(true);
    try {
      const res  = await fetch(`${backendUrl}/api/order/user-orders`, {
        method: 'POST',
        headers: { token, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const sorted = [...data.orders].sort((a, b) => b.date - a.date);
        setOrders(sorted);
        setLast(new Date());
        
        // Auto-open the first/most recent order by default
        if (sorted.length > 0) {
          const firstKey = String(sorted[0]._id || `order-0-${sorted[0].date || ''}`);
          setOpenOrderIds(prev => ({ [firstKey]: true, ...prev }));
        }
      }
    } catch (e) { console.warn("Error fetching orders:", e); }
    finally { setLO(false); setRefreshing(false); }
  }, [token, backendUrl]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    const timer = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const secAgo = Math.floor((new Date() - lastRefresh) / 1000);
  const refreshLabel = secAgo < 60 ? `${secAgo}s` : `${Math.floor(secAgo / 60)}min`;

  if (!token) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-primaryLight py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-black text-primary flex items-center justify-center sm:justify-start gap-3">
              <ShoppingBag className="w-8 h-8 text-tertiary" />
              {t.ordersTitle || "My Orders"}
            </h1>
            <p className="text-sm text-gray-500 mt-2">{t.ordersDesc || "Track, view and manage your recent purchases."}</p>
          </div>
          
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors bg-white border border-gray-200 px-5 py-2.5 rounded-full hover:border-gray-300 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshLabel}</span>
          </button>
        </div>

        {/* Loading */}
        {loadingOrders ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>

        /* Empty state */
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 py-20 px-8 text-center shadow-md max-w-2xl mx-auto">
            <div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
            <p className="text-2xl font-black text-primary mb-2">{t.noOrdersTitle || "No Orders Yet"}</p>
            <p className="text-base text-gray-400 mb-8 max-w-md mx-auto">{t.noOrdersDesc || "You haven't placed any orders yet. Discover our latest collections and find your next pair!"}</p>
            <button
              onClick={() => navigate('/collection')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white text-base font-bold rounded-full hover:bg-tertiary transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              {t.discoverCollection || "Discover Collection"} <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        /* Orders list */
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map((order, idx) => {
              const uniqueKey = String(order._id || `order-${idx}-${order.date || ''}`);
              return (
                <OrderCard
                  key={uniqueKey}
                  order={order}
                  t={t}
                  lang={lang}
                  isOpen={!!openOrderIds[uniqueKey]}
                  onToggle={() => toggleOrder(uniqueKey)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
