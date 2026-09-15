import { auth } from "@/auth";
import { NextResponse } from "next/server";

const CHEMINS_PUBLICS = ["/connexion"];
const PREFIXE_ADMIN = "/admin";

export default auth((requete) => {
  const { pathname } = requete.nextUrl;

  if (pathname.startsWith("/api/auth") || CHEMINS_PUBLICS.includes(pathname)) {
    return NextResponse.next();
  }

  if (!requete.auth) {
    const urlConnexion = new URL("/connexion", requete.nextUrl.origin);
    urlConnexion.searchParams.set("retour", pathname);
    return NextResponse.redirect(urlConnexion);
  }

  if (pathname.startsWith(PREFIXE_ADMIN) && requete.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", requete.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
