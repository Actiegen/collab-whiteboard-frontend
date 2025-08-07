import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Simple configuration for dev/testing - suppress TypeScript errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authOptions: any = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

// @ts-expect-error - Suppress NextAuth v4 typing issues for dev deployment
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
