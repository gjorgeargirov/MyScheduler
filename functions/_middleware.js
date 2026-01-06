/**
 * Cloudflare Pages Middleware
 * Sets correct MIME types for JavaScript files
 */
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Log middleware execution
  console.log('[MIDDLEWARE] Processing request:', request.method, pathname);

  // Skip middleware for API routes - let functions handle them
  if (pathname.startsWith('/api/')) {
    console.log('[MIDDLEWARE] Skipping middleware for API route:', pathname);
    return next();
  }

  // Get the response
  const response = await next();

  // Check current Content-Type
  const currentContentType = response.headers.get('Content-Type');
  console.log('[MIDDLEWARE] Current Content-Type:', currentContentType);

  // Only modify responses for JavaScript and CSS files
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
    console.log('[MIDDLEWARE] Setting JavaScript MIME type for:', pathname);
    // Clone headers to avoid modifying the original
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/javascript; charset=utf-8');
    headers.set('X-Content-Type-Options', 'nosniff');
    
    console.log('[MIDDLEWARE] New Content-Type:', headers.get('Content-Type'));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  }

  if (pathname.endsWith('.css')) {
    console.log('[MIDDLEWARE] Setting CSS MIME type for:', pathname);
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/css; charset=utf-8');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  }

  // Return original response for all other files
  return response;
}
