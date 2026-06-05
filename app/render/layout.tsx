// Layout para las páginas que consume Puppeteer. Fondo blanco, sin chrome.
// (El root layout sigue aplicando, pero acá forzamos un contenedor limpio.)
export default function RenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-white">{children}</div>;
}
