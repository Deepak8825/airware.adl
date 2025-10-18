import { NextResponse } from 'next/server';

// Middleware to handle public/protected routes
export function middleware() {
  // For non-public routes, client-side check will handle redirect
  // This middleware just ensures proper routing
  
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static files and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
