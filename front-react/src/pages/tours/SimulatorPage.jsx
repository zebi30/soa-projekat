import { useEffect, useState, useCallback } from "react";
import { Marker, Popup } from "react-leaflet";
import { api } from "../../api/client";
import MapView from "../../components/map/MapView";

// Position simulator: shows the tourist's current position (if set) and lets
// them click the map to record a new current location. Tour execution reads
// this position.
export default function SimulatorPage() {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await api("GET", "/api/positions/me");
    if (res.ok && res.data?.position) {
      setPosition(res.data.position);
      setStatus("");
    } else if (res.status === 404) {
      setPosition(null);
      setStatus("No position set yet. Click the map to set your current location.");
    } else {
      setError((res.data && res.data.message) || `Failed to load position (HTTP ${res.status}).`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setOnMap = async (lat, lng) => {
    setError("");
    const res = await api("PUT", "/api/positions/me", { latitude: lat, longitude: lng });
    if (res.ok && res.data?.position) {
      setPosition(res.data.position);
      setStatus(`Position saved: ${res.data.position.latitude.toFixed(5)}, ${res.data.position.longitude.toFixed(5)}`);
    } else {
      setError((res.data && res.data.message) || `Failed to save position (HTTP ${res.status}).`);
    }
  };

  const center = position ? [position.latitude, position.longitude] : [44.7866, 20.4489];
  const fitPoints = position ? [[position.latitude, position.longitude]] : null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Position simulator</h1>
          <p className="hint">Click anywhere on the map to set your current location.</p>
        </div>
        <button onClick={load} className="btn-ghost">Reload</button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {status && <div className="alert success">{status}</div>}

      <div className="card">
        <MapView height={460} center={center} zoom={13} onMapClick={setOnMap} fitPoints={fitPoints}>
          {position && (
            <Marker position={[position.latitude, position.longitude]}>
              <Popup>
                You are here<br />
                {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
              </Popup>
            </Marker>
          )}
        </MapView>
        {position && (
          <p className="kp-coords" style={{ marginTop: 10 }}>
            Current: {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
