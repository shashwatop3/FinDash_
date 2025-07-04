import { NextResponse } from 'next/server';
import { db } from '@/src/db/drizzle';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      clerkPublishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...',
    };

    // Test database connection
    let dbStatus = 'unknown';
    try {
      await db.execute('SELECT 1 as test');
      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = `error: ${dbError instanceof Error ? dbError.message : 'unknown db error'}`;
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
