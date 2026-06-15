import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { formatDateTime } from "../../lib/format";

export default function PurchasePage() {
  const [cart, setCart] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const [cartRes, purRes] = await Promise.all([
      api("GET", "/api/cart"),
      api("GET", "/api/purchases"),
    ]);
    if (cartRes.ok) setCart(cartRes.data?.cart || { items: [], totalPrice: 0 });
    else setError((cartRes.data && cartRes.data.message) || "Failed to load cart.");
    if (purRes.ok) setPurchases(Array.isArray(purRes.data?.purchases) ? purRes.data.purchases : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeItem = async (tourId) => {
    const res = await api("DELETE", "/api/cart/items/" + tourId);
    if (res.ok) setCart(res.data?.cart || cart);
    else alert((res.data && res.data.message) || "Failed to remove item.");
  };

  const checkout = async () => {
    setMsg("");
    setError("");
    setBusy(true);
    // Drives the purchase checkout SAGA on the server: validates each tour,
    // issues a TourPurchaseToken per item, compensates on failure.
    const res = await api("POST", "/api/cart/checkout");
    setBusy(false);
    if (res.ok) {
      const n = res.data?.purchasedCount ?? res.data?.tokens?.length ?? 0;
      setMsg(`Checkout complete — ${n} tour${n === 1 ? "" : "s"} purchased.`);
      load();
    } else {
      setError((res.data && res.data.message) || `Checkout failed (HTTP ${res.status}).`);
      load(); // saga compensated; refresh to reflect preserved cart
    }
  };

  const items = cart?.items || [];

  return (
    <div className="page">
      <h1>Purchases</h1>

      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <div className="grid-2">
        <div className="card">
          <h3>Shopping cart</h3>
          {items.length === 0 ? (
            <p className="hint">Your cart is empty. Add tours from <Link to="/tours/tourist">Explore tours</Link>.</p>
          ) : (
            <>
              <ul className="kp-list">
                {items.map((it) => (
                  <li key={it.id || it.tourId} className="kp-item">
                    <div className="grow">
                      <div className="strong">{it.tourName}</div>
                      <div className="muted small">€{it.price}</div>
                    </div>
                    <button className="btn-ghost small" onClick={() => removeItem(it.tourId)}>Remove</button>
                  </li>
                ))}
              </ul>
              <div className="cart-total">
                <span>Total</span>
                <span className="strong">€{cart?.totalPrice ?? 0}</span>
              </div>
              <button onClick={checkout} disabled={busy}>{busy ? "Processing…" : "Checkout"}</button>
            </>
          )}
        </div>

        <div className="card">
          <h3>My purchases ({purchases.length})</h3>
          {purchases.length === 0 ? (
            <p className="hint">No purchases yet.</p>
          ) : (
            <ul className="kp-list">
              {purchases.map((p) => (
                <li key={p.id || p.tourId} className="kp-item">
                  <div className="grow">
                    <div className="strong">{p.tourName}</div>
                    <div className="muted small">€{p.price} · purchased {formatDateTime(p.purchasedAt)}</div>
                  </div>
                  <Link to={`/tours/tourist/${p.tourId}`} className="btn-ghost small">View</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
