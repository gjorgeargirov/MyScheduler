/**
 * Cloudflare Worker for Authentication
 * 
 * This handles:
 * - User signup
 * - User signin
 * - Token verification
 * - User signout
 * 
 * Requires:
 * - Cloudflare D1 database
 * - JWT_SECRET environment variable
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  // Handle both /api/auth/... and /api/auth/.../ paths
  let path = url.pathname.replace('/api/auth', '');
  // Remove trailing slash
  if (path.endsWith('/') && path.length > 1) {
    path = path.slice(0, -1);
  }
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Log database binding status
  console.log('[AUTH] Request:', request.method, path);
  console.log('[AUTH] DB binding exists:', !!env.DB);
  console.log('[AUTH] JWT_SECRET exists:', !!env.JWT_SECRET);
  
  if (!env.DB) {
    console.error('[AUTH] ERROR: env.DB is not defined! D1 binding may not be configured.');
  }
  if (!env.JWT_SECRET) {
    console.error('[AUTH] ERROR: env.JWT_SECRET is not defined! Check Functions environment variables.');
  }

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

      // Generate JWT token
      console.log('[AUTH] Generating JWT token...');
      const token = await generateToken(userId, email, env.JWT_SECRET);
      console.log('[AUTH] Signup successful for:', email);

      return new Response(
        JSON.stringify({
          token,
          user: { id: userId, email, name },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      // Generate JWT token
      console.log('[AUTH] Password verified, generating token...');
      const token = await generateToken(user.id, user.email, env.JWT_SECRET);
      console.log('[AUTH] Signin successful for:', email);

      return new Response(
        JSON.stringify({
          token,
          user: { id: user.id, email: user.email, name: user.name },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    if (path === '/verify' && request.method === 'POST') {
      const { token } = await request.json();

      if (!token) {
        return new Response(
          JSON.stringify({ valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const payload = await verifyToken(token, env.JWT_SECRET);
        return new Response(
          JSON.stringify({ valid: true, user: payload }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch {
        return new Response(
          JSON.stringify({ valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Sign out (just returns success, client clears token)
    if (path === '/signout' || path === '/signout/') {
      if (request.method === 'POST' || request.method === 'GET') {
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found', path: path, method: request.method }),
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

// Simple JWT implementation (use proper library in production)
async function generateToken(userId, email, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const base64Url = (str) => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));

  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  const signatureArray = Array.from(new Uint8Array(signature));
  const encodedSignature = base64Url(String.fromCharCode(...signatureArray));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  const signatureArray = Array.from(new Uint8Array(signature));
  const expectedSignature = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  if (encodedSignature !== expectedSignature) throw new Error('Invalid signature');

  const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
  
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}
