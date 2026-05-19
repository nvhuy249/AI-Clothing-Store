import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import postgres from "postgres";
import crypto from "crypto";
import { getRolesForEmail, grantRoleByCustomerId } from "./roles";
import { ensureUsersTableName } from "./users";
import { postgresOptions } from "./db";

// Reuse a single Postgres client; Next.js app router runs in a serverless style.
const sql = postgres(process.env.POSTGRES_URL!, postgresOptions);

const secret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await ensureUsersTableName();
        const users = await sql<{
          customer_id: string;
          name: string;
          email: string;
          password: string;
        }[]>`
          SELECT customer_id, name, email, password
          FROM users
          WHERE email = ${credentials.email}
          LIMIT 1
        `;
        const user = users[0];
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.customer_id, name: user.name, email: user.email };
      },
    }),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure the user exists in our users table.
      if (!account || account.provider === "credentials") return true;
      const email = user.email;
      if (!email) return false;
      await ensureUsersTableName();
      const existing = await sql<{ customer_id: string }[]>`
        SELECT customer_id FROM users WHERE email = ${email} LIMIT 1
      `;
      if (existing.length > 0) {
        await grantRoleByCustomerId(existing[0].customer_id, "customer");
        return true;
      }
      const name = user.name || profile?.name || email.split("@")[0];
      const placeholderPassword = await bcrypt.hash(
        crypto.randomBytes(16).toString("hex"),
        10
      );
      const inserted = await sql<{ customer_id: string }[]>`
        INSERT INTO users (name, email, password)
        VALUES (${name}, ${email}, ${placeholderPassword})
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING customer_id
      `;
      if (inserted[0]?.customer_id) {
        await grantRoleByCustomerId(inserted[0].customer_id, "customer");
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      const roles = await getRolesForEmail(token.email);
      token.roles = roles;
      token.isAdmin = roles.includes("admin");
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.roles = Array.isArray(token.roles) ? token.roles : [];
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  secret,
};

// Helper exports for App Router usage
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
