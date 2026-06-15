// Interactive 1–5 star rating. When `readOnly`, just renders the value.
export default function StarRating({ value = 0, onChange, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  if (readOnly) {
    return <span className="review-stars">{"★".repeat(value)}{"☆".repeat(5 - value)}</span>;
  }
  return (
    <span className="stars">
      {stars.map((n) => (
        <button
          type="button"
          key={n}
          className={"star" + (n <= value ? " on" : "")}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}
