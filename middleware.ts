import { withAuth } from "next-auth/middleware";

// Protege todo salvo login, la API de auth, las rutas de render (las consume
// Puppeteer sin sesión) y los assets estáticos.
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/((?!login|api/auth|render|_next/static|_next/image|favicon.ico).*)",
  ],
};
