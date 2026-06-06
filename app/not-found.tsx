import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground">
        El recurso que buscás no existe o fue eliminado.
      </p>
      <Button asChild>
        <Link href="/dashboard">Ir al inicio</Link>
      </Button>
    </div>
  );
}
