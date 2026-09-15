import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Étend les types NextAuth pour transporter le rôle et l'id utilisateur dans la session/JWT.
// Note : dans cette version de next-auth (v5 beta), Session/User/JWT vivent réellement dans
// @auth/core (next-auth se contente de les ré-exporter) — c'est donc là qu'il faut augmenter
// les types pour que la fusion de déclarations s'applique.
declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
