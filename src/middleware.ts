import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Routes protégées
  const protectedRoutes = ['/super-admin', '/admin', '/dashboard'];
  const currentPath = request.nextUrl.pathname;

  // Vérifier si la route est protégée
  const isProtectedRoute = protectedRoutes.some(route => 
    currentPath.startsWith(route)
  );

  if (isProtectedRoute) {
    // Ici on pourrait ajouter une vérification du token si nécessaire
    // Pour l'instant, on laisse passer et la vérification se fait côté client
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
