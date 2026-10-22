import { NextResponse } from 'next/server';
import { getOAuth2Client, DRIVE_OAUTH_SCOPES } from '@/lib/google';

export const dynamic = 'force-dynamic';

// GET /api/auth/google — Initiates OAuth flow with Google for Drive access
export async function GET() {
  try {
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Requests long-lived refresh_token
      prompt: 'consent',     // Forces Google to return a refresh_token every time
      scope: DRIVE_OAUTH_SCOPES,
    });

    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: (err as Error).message || 'Failed to initiate Google OAuth',
        hint: 'Ensure GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are set in .env.local',
      },
      { status: 500 }
    );
  }
}
