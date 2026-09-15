import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/connexion" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        motDePasse: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const motDePasse = credentials?.motDePasse;
        if (typeof email !== "string" || typeof motDePasse !== "string") return null;

        const utilisateur = await prisma.user.findUnique({ where: { email } });
        if (!utilisateur || !utilisateur.actif) return null;

        const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash);
        if (!motDePasseValide) return null;

        return {
          id: utilisateur.id,
          name: utilisateur.nom,
          email: utilisateur.email,
          role: utilisateur.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
