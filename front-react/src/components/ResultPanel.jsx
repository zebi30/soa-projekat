// Renders the result of the last API call (status + JSON body), color-coded.
export default function ResultPanel({ result }) {
  if (!result) return null;
  const cls = "output " + (result.ok ? "ok" : "err");
  const body =
    typeof result.data === "string"
      ? result.data
      : JSON.stringify(result.data, null, 2);
  return (
    <pre className={cls}>
      {`HTTP ${result.status}\n`}
      {body}
    </pre>
  );
}
