/**
 * Cloudflare Worker for Authentication
 * 
 * This handles:
 * - User signup
 * - User signin
 * - Session verification (cookie-based)
 * - User signout
 * 
 * Requires:
 * - Cloudflare D1 database
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Log full request details for debugging
  console.log('[AUTH] ========================================');
  console.log('[AUTH] FUNCTION CALLED!');
  console.log('[AUTH] Full URL:', request.url);
  console.log('[AUTH] Pathname:', url.pathname);
  console.log('[AUTH] Method:', request.method);
  console.log('[AUTH] ========================================');
  
  // In Cloudflare Pages, functions/api/auth.js handles /api/auth/* routes
  // The pathname in the context should be the full pathname
  let path = url.pathname;
  
  // Remove /api/auth prefix if present
  if (path.startsWith('/api/auth')) {
    path = path.replace('/api/auth', '');
  }
  
  // Handle empty path (if request is to /api/auth)
  if (path === '' || path === '/') {
    path = '/';
  } else {
    // Remove trailing slash (except for root)
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
  }

  // Log database binding status
  console.log('[AUTH] Extracted path:', path);
  console.log('[AUTH] DB binding exists:', !!env.DB);
  
  if (!env.DB) {
    console.error('[AUTH] ERROR: env.DB is not defined! D1 binding may not be configured.');
  }

  // CORS headers (allow credentials for cookies)
  const corsHeaders = {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add a test endpoint to verify function is working
  if (path === '/test' || path === '/') {
    return new Response(
      JSON.stringify({ 
        message: 'Auth function is working!',
        pathname: url.pathname,
        extractedPath: path,
        method: request.method,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Sign up
    if (path === '/signup' && request.method === 'POST') {
      const { email, password, name } = await request.json();
      console.log('[AUTH] Signup attempt for:', email);

      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user exists
      console.log('[AUTH] Checking if user exists in database...');
      let existing;
      try {
        existing = await env.DB.prepare(
          'SELECT id FROM users WHERE email = ?'
        ).bind(email).first();
        console.log('[AUTH] User exists check result:', existing ? 'User found' : 'User not found');
      } catch (dbError) {
        console.error('[AUTH] Database error checking user:', dbError.message);
        return new Response(
          JSON.stringify({ error: 'Database error: ' + dbError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existing) {
        console.log('[AUTH] User already exists, returning error');
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash password (simple bcrypt-like, in production use proper bcrypt)
      console.log('[AUTH] Hashing password...');
      const hashedPassword = await hashPassword(password);

      // Create user
      console.log('[AUTH] Inserting user into database...');
      let result;
      try {
        result = await env.DB.prepare(
          'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)'
        ).bind(email, hashedPassword, name, new Date().toISOString()).run();
        console.log('[AUTH] User inserted successfully! User ID:', result.meta.last_row_id);
      } catch (dbError) {
        console.error('[AUTH] Database error inserting user:', dbError.message);
        return new Response(
          JSON.stringify({ error: 'Database error: ' + dbError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = result.meta.last_row_id;
      console.log('[AUTH] Generated user ID:', userId);

      // Create session
      console.log('[AUTH] Creating session...');
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      
      await env.DB.prepare(
        'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
      ).bind(sessionId, userId, expiresAt, new Date().toISOString()).run();
      
      console.log('[AUTH] Signup successful for:', email);

      // Set session cookie
      const headers = new Headers(corsHeaders);
      headers.set('Content-Type', 'application/json');
      headers.set('Set-Cookie', `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

      return new Response(
        JSON.stringify({
          user: { id: userId, email, name },
        }),
        { headers }
      );
    }

    // Sign in
    if (path === '/signin' && request.method === 'POST') {
      const { email, password } = await request.json();
      console.log('[AUTH] Signin attempt for:', email);

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find user
      console.log('[AUTH] Looking up user in database...');
      let user;
      try {
        user = await env.DB.prepare(
          'SELECT id, email, password_hash, name FROM users WHERE email = ?'
        ).bind(email).first();
        console.log('[AUTH] User lookup result:', user ? 'User found (ID: ' + user.id + ')' : 'User not found');
      } catch (dbError) {
        console.error('[AUTH] Database error looking up user:', dbError.message);
        return new Response(
          JSON.stringify({ error: 'Database error: ' + dbError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password
      console.log('[AUTH] Verifying password...');
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        console.log('[AUTH] Password verification failed');
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create session
      console.log('[AUTH] Password verified, creating session...');
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      
      await env.DB.prepare(
        'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
      ).bind(sessionId, user.id, expiresAt, new Date().toISOString()).run();
      
      console.log('[AUTH] Signin successful for:', email);

      // Set session cookie
      const headers = new Headers(corsHeaders);
      headers.set('Content-Type', 'application/json');
      headers.set('Set-Cookie', `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

      return new Response(
        JSON.stringify({
          user: { id: user.id, email: user.email, name: user.name },
        }),
        { headers }
      );
    }

    // Verify session
    if (path === '/verify' && (request.method === 'GET' || request.method === 'POST')) {
      const cookieHeader = request.headers.get('Cookie');
      const sessionId = cookieHeader?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];

      if (!sessionId) {
        return new Response(
          JSON.stringify({ valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const session = await env.DB.prepare(
          'SELECT s.user_id, s.expires_at, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > ?'
        ).bind(sessionId, new Date().toISOString()).first();

        if (session) {
          return new Response(
            JSON.stringify({ 
              valid: true, 
              user: { userId: session.user_id, email: session.email, name: session.name } 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('[AUTH] Session verification error:', error);
        return new Response(
          JSON.stringify({ valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Sign out (delete session)
    if (path === '/signout' || path === '/signout/') {
      if (request.method === 'POST' || request.method === 'GET') {
        const cookieHeader = request.headers.get('Cookie');
        const sessionId = cookieHeader?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];
        
        if (sessionId) {
          await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
        }
        
        const headers = new Headers(corsHeaders);
        headers.set('Content-Type', 'application/json');
        headers.set('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log what we're returning - this should help us debug
    console.log('[AUTH] ========================================');
    console.log('[AUTH] No handler found!');
    console.log('[AUTH] Path:', path);
    console.log('[AUTH] Method:', request.method);
    console.log('[AUTH] Full pathname:', url.pathname);
    console.log('[AUTH] Available routes: /signup (POST), /signin (POST), /verify (POST), /signout (GET/POST)');
    console.log('[AUTH] ========================================');
    
    // Return detailed error to help debug
    return new Response(
      JSON.stringify({ 
        error: 'Not found', 
        path: path, 
        method: request.method,
        pathname: url.pathname,
        availableRoutes: ['/signup (POST)', '/signin (POST)', '/verify (POST)', '/signout (GET/POST)'],
        debug: {
          extractedPath: path,
          fullPathname: url.pathname,
          requestMethod: request.method
        }
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AUTH] Unhandled error:', error);
    console.error('[AUTH] Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Simple password hashing (use proper bcrypt in production)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

