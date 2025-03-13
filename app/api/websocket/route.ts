import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// This route is just a placeholder. The WebSocket server is created in server.js
// This endpoint can be used for WebSocket status checks and diagnostics
export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      },
      { status: 401 }
    );
  }
  
  return NextResponse.json(
    {
      success: true,
      data: {
        websocketEnabled: true,
        userIdHash: session.user.id ? Buffer.from(session.user.id).toString('base64').slice(0, 8) : null,
        serverTime: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}
