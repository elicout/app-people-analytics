import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    teamId: string;
    teamName: string;
    role: "tl" | "director";
  }
  interface Session {
    user: {
      teamId: string;
      teamName: string;
      role: "tl" | "director";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    teamId: string;
    teamName: string;
    role: "tl" | "director";
  }
}
