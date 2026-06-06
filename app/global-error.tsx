"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Algo salió mal</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          Tuvimos un problema inesperado. Reintentá.
        </p>
        <button
          onClick={() => reset()}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: 6, border: "1px solid #ccc", cursor: "pointer" }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
