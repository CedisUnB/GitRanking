import { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

interface GitHubProfile {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        const gh = profile as unknown as GitHubProfile;
        try {
          await prisma.user.upsert({
            where: { githubId: String(gh.id) },
            update: {
              name: user.name ?? null,
              email: user.email ?? null,
              avatarUrl: user.image ?? null,
              username: gh.login,
            },
            create: {
              githubId: String(gh.id),
              username: gh.login,
              name: user.name ?? null,
              email: user.email ?? null,
              avatarUrl: user.image ?? null,
            },
          });
        } catch (err) {
          console.error("[auth] Failed to upsert user in DB:", err);
          // Still allow sign-in even if DB write fails
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const gh = profile as unknown as GitHubProfile;
        token.accessToken = account.access_token;
        token.username = gh.login;
        token.githubId = String(gh.id);
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.sub!;
        session.user.username = token.username as string;
        session.user.githubId = token.githubId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};
