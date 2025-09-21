import "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string; // Add the 'id' property here
    } & import("next-auth/core/types").User;
  }

  interface User {
    id: string; // Add the 'id' property here
  }
}