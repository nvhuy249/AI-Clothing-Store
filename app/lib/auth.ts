import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import postgres from "postgres";
import crypto from "crypto";

// Reuse a single Postgres client; Next.js app router runs in a serverless style.
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

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
        const users = await sql<{
          customer_id: string;
          name: string;
          email: string;
          password: string;
        }[]>`
          SELECT customer_id, name, email, password
          FROM customers
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
      // For OAuth providers, ensure the user exists in our customers table.
      if (!account || account.provider === "credentials") return true;
      const email = user.email;
      if (!email) return false;
      const existing = await sql<{ customer_id: string }[]>`
        SELECT customer_id FROM customers WHERE email = ${email} LIMIT 1
      `;
      if (existing.length > 0) return true;
      const name = user.name || profile?.name || email.split("@")[0];
      const placeholderPassword = await bcrypt.hash(
        crypto.randomBytes(16).toString("hex"),
        10
      );
      await sql`
        INSERT INTO customers (name, email, password)
        VALUES (${name}, ${email}, ${placeholderPassword})
        ON CONFLICT (email) DO NOTHING
      `;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret,
};

// Helper exports for App Router usage
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
