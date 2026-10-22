import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getOAuth2Client } from '@/lib/google';

export const dynamic = 'force-dynamic';

function saveRefreshTokenToEnv(refreshToken: string) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      if (/GOOGLE_OAUTH_REFRESH_TOKEN=/.test(content)) {
        content = content.replace(
          /GOOGLE_OAUTH_REFRESH_TOKEN=.*(\r?\n|$)/,
          `GOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}$1`
        );
      } else {
        content += `\nGOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}\n`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    }
    // Update active runtime environment in memory
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN = refreshToken;
  } catch (err) {
    console.error('Could not auto-save refresh token to .env.local:', err);
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const editorToken = process.env.EDITOR_TOKEN || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const returnUrl = editorToken ? `${appUrl}/?token=${editorToken}` : appUrl;

  if (error) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Google Drive Authorization Failed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #050810; color: #f0f4ff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; max-width: 500px; text-align: center; }
          h1 { color: #f05d5e; font-size: 1.5rem; margin-bottom: 12px; }
          p { color: #8b96b0; line-height: 1.5; font-size: 0.95rem; }
          a { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #4f8ef7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Authorization Cancelled</h1>
          <p>Google returned an error: <strong>${error}</strong></p>
          <a href="/api/auth/google">Try Again</a>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    );
  }

  if (!code) {
    return new NextResponse(
      'Missing authorization code in query parameters.',
      { status: 400 }
    );
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    const refreshToken = tokens.refresh_token;

    if (refreshToken) {
      saveRefreshTokenToEnv(refreshToken);
    } else {
      console.warn('Google did not return a refresh_token (account may already be authorized).');
    }

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Google Drive Connected</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #050810; color: #f0f4ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 40px; max-width: 540px; text-align: center; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
          .icon { font-size: 3rem; margin-bottom: 16px; }
          h1 { color: #34d399; font-size: 1.6rem; margin: 0 0 12px 0; font-weight: 600; }
          p { color: #8b96b0; line-height: 1.6; font-size: 0.95rem; margin: 0 0 16px 0; }
          .badge { display: inline-block; background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 500; margin-bottom: 24px; }
          .btn { display: inline-block; padding: 12px 28px; background: #4f8ef7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; transition: background 0.2s; }
          .btn:hover { background: #3b7ce2; }
          .note { margin-top: 24px; font-size: 0.8rem; color: #505a70; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Google Drive Connected!</h1>
          <div class="badge">Scope: drive.file enabled</div>
          <p>
            Your Google Account has been authorized successfully. Profile picture uploads are now linked directly to Google Drive.
          </p>
          <a class="btn" href="${returnUrl}">Return to Team Directory</a>
          <div class="note">
            Your OAuth refresh token has been stored securely in <code>.env.local</code> on the backend.
          </div>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
    );
  } catch (err: unknown) {
    console.error('Error exchanging Google OAuth code:', err);
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Token Exchange Failed</title>
        <style>
          body { font-family: sans-serif; background: #050810; color: #f0f4ff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; max-width: 500px; }
          h1 { color: #f05d5e; }
          code { background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; display: block; margin: 12px 0; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Token Exchange Failed</h1>
          <p>Could not exchange code with Google:</p>
          <code>${(err as Error).message || String(err)}</code>
          <p><a href="/api/auth/google" style="color: #4f8ef7;">Try authorizing again</a></p>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 500 }
    );
  }
}
