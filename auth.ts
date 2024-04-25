import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import db from "./db/drizzle";
import { NextResponse } from "next/server";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session) {
        session.user.id = token.sub as string;
      }
      return session;
    },

    // authorized({request, auth}){
    //   const isLoggedIn = !!auth?.user
    //   const protectedPaths = ["/new-story"]
    //   const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
    //   if(isProtected && !isLoggedIn){
    //     return NextResponse.redirect(new URL("/", request.url) )
    //   }
    //   return 

    // }
  },
});
