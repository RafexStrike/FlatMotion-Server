import { Router } from 'express';
import fetch from 'node-fetch';
import { prisma } from '../lib/prisma';

const oauthRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/oauth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initiate Google OAuth
oauthRouter.post('/google', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const nonce = Math.random().toString(36).substring(7);

  // Store state and nonce in session temporarily (you could use Redis here)
  req.session = req.session || {};
  (req.session as any).oauth_state = state;
  (req.session as any).oauth_nonce = nonce;

  const scope = encodeURIComponent('openid email profile');
  const redirectUri = encodeURIComponent(GOOGLE_REDIRECT_URI);
  const clientId = encodeURIComponent(GOOGLE_CLIENT_ID);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

  res.json({ url: googleAuthUrl, state });
});

// Handle Google OAuth callback
oauthRouter.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }

    // Verify state
    const storedState = (req.session as any)?.oauth_state;
    if (state !== storedState) {
      console.error(`[OAuth] State mismatch: ${state} !== ${storedState}`);
      return res.redirect(`${FRONTEND_URL}/login?error=state_mismatch`);
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    const tokenData = (await tokenResponse.json()) as any;

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      return res.redirect(`${FRONTEND_URL}/login?error=user_info_failed`);
    }

    const googleUser = (await userResponse.json()) as any;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          role: 'USER',
        },
      });
    }

    // Create session token
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    // Redirect to dashboard with token
    return res.redirect(`${FRONTEND_URL}/dashboard?token=${sessionToken}&userId=${user.id}`);
  } catch (error) {
    console.error('[OAuth Callback Error]', error);
    res.redirect(`${FRONTEND_URL}/login?error=callback_error`);
  }
});

export default oauthRouter;
