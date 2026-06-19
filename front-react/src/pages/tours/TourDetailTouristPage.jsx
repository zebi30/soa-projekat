import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Marker, Polyline, Popup } from "react-leaflet";
import { api } from "../../api/client";
import MapView from "../../components/map/MapView";
import { numberIcon } from "../../lib/leafletSetup";
import Badge from "../../components/Badge";
import StarRating from "../../components/StarRating";
import { Field, TextArea } from "../../components/Field";
import { formatDate } from "../../lib/format";

export default function TourDetailTouristPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null); // published preview (firstKeyPoint only)
  const [fullTour, setFullTour] = useState(null); // revealed after purchase (all keypoints)
  const [purchased, setPurchased] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [images, setImages] = useState([""]);
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formError, setFormError] = useState("");

  const loadTour = useCallback(async () => {
    setError("");
    const res = await api("GET", "/api/tours/published");
    if (res.ok) {
      const found = (res.data?.tours || []).find((t) => String(t.id) === String(id));
      if (found) setTour(found);
      else setError("This tour is not available.");
    } else {
      setError((res.data && res.data.message) || `Failed to load tour (HTTP ${res.status}).`);
    }
  }, [id]);

  const loadPurchaseState = useCallback(async () => {
    const res = await api("GET", "/api/purchases");
    const owns = res.ok && (res.data?.purchases || []).some((p) => String(p.tourId) === String(id));
    setPurchased(owns);
    if (owns) {
      // Purchased tours reveal all key points.
      const full = await api("GET", `/api/purchases/${id}/tour`);
      if (full.ok && full.data?.tour) setFullTour(full.data.tour);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    const res = await api("GET", `/api/tours/${id}/reviews`);
    if (res.ok) setReviews(Array.isArray(res.data?.reviews) ? res.data.reviews : []);
  }, [id]);

  useEffect(() => {
    loadTour();
    loadPurchaseState();
    loadReviews();
  }, [loadTour, loadPurchaseState, loadReviews]);

  const addToCart = async () => {
    setActionMsg("");
    setError("");
    const res = await api("POST", "/api/cart/items", { tourId: id });
    if (res.ok) setActionMsg("Added to cart.");
    else setError((res.data && res.data.message) || `Could not add to cart (HTTP ${res.status}).`);
  };

  const startTour = async () => {
    setActionMsg("");
    setError("");
    // Front-end first asks the Position simulator where the tourist is.
    const pos = await api("GET", "/api/positions/me");
    if (!pos.ok || !pos.data?.position) {
      setError("Set your current location in the Simulator before starting a tour.");
      return;
    }
    const { latitude, longitude } = pos.data.position;
    const res = await api("POST", `/api/tours/${id}/execution`, { latitude, longitude });
    if (res.ok) navigate("/execution");
    else setError((res.data && res.data.message) || `Could not start tour (HTTP ${res.status}).`);
  };

  const setImage = (i, v) => setImages((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  const addImage = () => setImages((arr) => [...arr, ""]);
  const removeImage = (i) => setImages((arr) => arr.filter((_, idx) => idx !== i));

  const submitReview = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormMsg("");
    if (rating < 1) return setFormError("Please choose a rating.");
    if (!comment.trim() || !visitedAt) return setFormError("Comment and visit date are required.");
    setBusy(true);
    const res = await api("POST", `/api/tours/${id}/reviews`, {
      rating,
      comment: comment.trim(),
      visitedAt,
      images: images.map((s) => s.trim()).filter(Boolean),
    });
    setBusy(false);
    if (res.ok) {
      setRating(0); setComment(""); setVisitedAt(""); setImages([""]);
      setFormMsg("Review submitted.");
      loadReviews();
    } else {
      setFormError((res.data && res.data.message) || `Failed to submit review (HTTP ${res.status}).`);
    }
  };

  if (error && !tour) {
    return (
      <div className="page">
        <div className="alert error">{error}</div>
        <Link to="/tours/tourist" className="btn-ghost">← Back to tours</Link>
      </div>
    );
  }
  if (!tour) return <div className="page"><p className="hint">Loading…</p></div>;

  const keyPoints = purchased && fullTour ? fullTour.keyPoints || [] : tour.firstKeyPoint ? [tour.firstKeyPoint] : [];
  const points = keyPoints.map((k) => [k.latitude, k.longitude]);

  return (
    <div className="page">
      <Link to="/tours/tourist" className="btn-ghost back">← Explore tours</Link>

      <div className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <div>
            <h1>{tour.name}</h1>
            <div className="tour-meta">
              <Badge tone="info">{tour.difficulty}</Badge>
              <span>{tour.lengthKm || 0} km</span>
              <span>· €{tour.price ?? 0}</span>
              {purchased && <Badge tone="success">purchased</Badge>}
            </div>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            {purchased ? (
              <button onClick={startTour}>Start tour</button>
            ) : (
              <button onClick={addToCart}>Add to cart</button>
            )}
          </div>
        </div>
        {tour.tags?.length > 0 && (
          <div className="tag-row">{tour.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
        )}
        {actionMsg && <div className="alert success" style={{ marginTop: 10 }}>{actionMsg}</div>}
        {error && <div className="alert error" style={{ marginTop: 10 }}>{error}</div>}
        <p style={{ marginTop: 12 }}>{tour.description}</p>

        <h3>{purchased ? "Route" : "Starting point"}</h3>
        {keyPoints.length > 0 ? (
          <>
            <MapView height={320} center={points[0]} zoom={14} fitPoints={points}>
              {points.length >= 2 && <Polyline positions={points} pathOptions={{ color: "#38bdf8" }} />}
              {keyPoints.map((k, i) => (
                <Marker key={k.id || i} position={[k.latitude, k.longitude]} icon={numberIcon(i + 1)}>
                  <Popup>{i + 1}. {k.name}</Popup>
                </Marker>
              ))}
            </MapView>
            {!purchased && <p className="hint">Buy the tour to reveal the remaining key points.</p>}
          </>
        ) : (
          <p className="hint">No key points available.</p>
        )}
      </div>

      {/* Reviews */}
      <div className="card">
        <h3>Reviews ({reviews.length})</h3>
        {reviews.length === 0 && <p className="hint">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="review">
            <div className="review-head">
              <div>
                <StarRating value={r.rating} readOnly />
                <span className="strong" style={{ marginLeft: 8 }}>{r.touristEmail}</span>
              </div>
              <span className="muted small">visited {formatDate(r.visitedAt)} · reviewed {formatDate(r.createdAt)}</span>
            </div>
            <p style={{ margin: "8px 0 0" }}>{r.comment}</p>
            {r.images?.length > 0 && (
              <div className="review-images">{r.images.map((src, i) => <img key={i} src={src} alt="" />)}</div>
            )}
          </div>
        ))}
      </div>

      {/* Leave a review */}
      <form className="card" onSubmit={submitReview}>
        <h3>Leave a review</h3>
        {formError && <div className="alert error">{formError}</div>}
        {formMsg && <div className="alert success">{formMsg}</div>}
        <div className="field">
          <span>Rating</span>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <TextArea label="Comment" value={comment} onChange={setComment} />
        <Field label="Visited on" type="date" value={visitedAt} onChange={setVisitedAt} lang="en" />
        <div className="field">
          <span>Images (optional URLs)</span>
          {images.map((img, i) => (
            <div className="image-row" key={i}>
              <input value={img} onChange={(e) => setImage(i, e.target.value)} placeholder="https://…" />
              {images.length > 1 && <button type="button" className="btn-ghost small" onClick={() => removeImage(i)}>Remove</button>}
            </div>
          ))}
          <button type="button" className="btn-ghost small" onClick={addImage}>+ Add image</button>
        </div>
        <button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit review"}</button>
      </form>
    </div>
  );
}
