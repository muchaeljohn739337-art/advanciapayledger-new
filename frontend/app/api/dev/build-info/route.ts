import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get build information from environment or package.json
    const buildInfo = {
      version: process.env.npm_package_version || '1.0.0',
      commit: process.env.GIT_COMMIT || 'abc123f',
      branch: process.env.GIT_BRANCH || 'main',
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version || '20.x',
    };

    return NextResponse.json(buildInfo);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch build information' },
      { status: 500 }
    );
  }
}
