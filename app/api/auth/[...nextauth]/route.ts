import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  // optional: callbacks if you want to inspect the JWT/user
  // callbacks: {
  //   async jwt({ token, account, profile }) { return token },
  //   async session({ session, token }) { return session },
  // },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
