import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    ...(process.env.RESEND_API_KEY && process.env.EMAIL_FROM
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      const uid = user?.id ?? token.sub;
      if (user?.id) {
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, balance: true },
        });
        token.role = (dbUser?.role ?? "USER") as Role;
        token.balance = dbUser?.balance ?? 0;
      }
      if (trigger === "update" && uid) {
        const dbUser = await prisma.user.findUnique({
          where: { id: uid },
          select: { role: true, balance: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.balance = dbUser.balance;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role) ?? "USER";
        session.user.balance = (token.balance as number) ?? 0;
      }
      return session;
    },
  },
});
