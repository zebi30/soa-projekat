import { MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import { useEffect } from "react";
import "../../lib/leafletSetup";

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Re-centers / fits the map when the set of points changes.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 14));
    } else {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Reusable OpenStreetMap view. `onMapClick(lat, lng)` makes the map clickable;
// `fitPoints` auto-frames a set of [lat, lng] pairs.
export default function MapView({
  center = [44.7866, 20.4489],
  zoom = 13,
  height = 380,
  onMapClick,
  fitPoints,
  children,
}) {
  return (
    <div className="map-wrap" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {fitPoints && fitPoints.length > 0 && <FitBounds points={fitPoints} />}
        {children}
      </MapContainer>
    </div>
  );
}
