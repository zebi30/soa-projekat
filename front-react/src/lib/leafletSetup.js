// Leaflet's default marker icons reference image files by relative URL, which
// breaks under a bundler. Re-point them at the bundled assets so markers show.
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: shadow,
});

// A small numbered circular marker used to order key points on a tour.
// `done` renders it in the "completed" colour for tour execution.
export function numberIcon(n, done = false) {
  return L.divIcon({
    className: "kp-marker" + (done ? " done" : ""),
    html: `<span>${n}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
