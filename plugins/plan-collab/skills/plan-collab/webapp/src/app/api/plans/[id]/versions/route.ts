import { NextRequest, NextResponse } from 'next/server';
import { getAllVersions, getLatestVersion } from '@/lib/db';

// GET /api/plans/[id]/versions - Get versions for a plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const latest = searchParams.get('latest') === 'true';

    if (latest) {
      const version = getLatestVersion(id);
      if (!version) {
        return NextResponse.json(
          { error: 'No versions found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ version });
    }

    const versions = getAllVersions(id);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
