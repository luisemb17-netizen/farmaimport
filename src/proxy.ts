import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 renombró `middleware` a `proxy`.
 * Se ejecuta en runtime Node.js y refresca la sesión de Supabase en cada
 * petición. La función de ayuda vive en src/lib/supabase/middleware.ts.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Protege todo excepto estáticos, imágenes y el favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
