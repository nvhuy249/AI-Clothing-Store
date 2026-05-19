import { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole } from "./app/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles?: UserRole[];
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: UserRole[];
    isAdmin?: boolean;
  }
}
