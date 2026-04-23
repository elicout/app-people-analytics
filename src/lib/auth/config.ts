import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { TEAM_LEADERS, MOCK_PASSWORDS } from "@/data/mock";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;
        if (MOCK_PASSWORDS[email] !== password) return null;

        const tl = TEAM_LEADERS.find((l) => l.email === email);
        if (!tl) return null;

        return {
          id: tl.id,
          name: tl.name,
          email: tl.email,
          teamId: tl.teamId,
          teamName: tl.teamName,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.teamId = (user as { teamId: string }).teamId;
        token.teamName = (user as { teamName: string }).teamName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.teamId = token.teamId as string;
      session.user.teamName = token.teamName as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
