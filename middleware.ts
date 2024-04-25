// export { auth as middleware } from "@/auth"

// export const config = {
//     matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
//   }


import { auth } from "@/auth"
import { NextResponse } from "next/server"
 
export default auth((request) => {
    const isLoggedIn = !!request?.auth
    const protectedPaths = ["/new-story"]
    const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    if(isProtected && !isLoggedIn){
      return NextResponse.redirect(new URL("/login", request.url) )
    }

    if(isLoggedIn && request.nextUrl.pathname.startsWith("/login") ){
        return NextResponse.redirect(new URL("/", request.url) )
    }

    return 
})
 
// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}