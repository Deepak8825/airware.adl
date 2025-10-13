import { NextResponse } from 'next/server';

// Middleware kept as a neutral no-op so removed auth routes don't get redirected to.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  // no matcher: middleware is a no-op for all routes
  matcher: []
};
