/**
 * Cloudflare Pages Middleware
 * Sets correct MIME types for JavaScript files
 */
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Get the response
  const response = await next();

  // Only modify responses for JavaScript and CSS files
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
    // Clone headers to avoid modifying the original
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/javascript; charset=utf-8');
    headers.set('X-Content-Type-Options', 'nosniff');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  }

  if (pathname.endsWith('.css')) {
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
