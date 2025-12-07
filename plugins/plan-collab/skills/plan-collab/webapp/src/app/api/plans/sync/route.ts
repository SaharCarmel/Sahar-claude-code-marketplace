import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import {
  getPlan,
  createPlan,
  getLatestVersion,
  createVersion,
  updatePlanVersion,
  hashContent
} from '@/lib/db';

// POST /api/plans/sync - Sync plan content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planPath, content, contentHash: providedHash } = body;

    if (!planPath || !content) {
      return NextResponse.json(
        { error: 'planPath and content are required' },
        { status: 400 }
      );
    }

    // Resolve path
    let absolutePath = planPath;
    if (planPath.startsWith('~')) {
      absolutePath = planPath.replace('~', process.env.HOME || '');
    }
    absolutePath = path.resolve(absolutePath);

    const contentHash = providedHash || hashContent(content);
    const name = path.basename(absolutePath, '.md');
    const title = extractTitle(content);

    // Check if plan exists
    let plan = getPlan(absolutePath) as { id: string; current_version: number } | undefined;
    let version = 1;

    if (!plan) {
      // Create new plan
      plan = createPlan(absolutePath, name, title || undefined) as { id: string; current_version: number };
      createVersion(plan.id, 1, content, contentHash, title || undefined);
    } else {
      // Check if content changed
      const latestVersion = getLatestVersion(plan.id) as { content_hash: string } | undefined;

      if (latestVersion?.content_hash !== contentHash) {
        // Create new version
        version = plan.current_version + 1;
        createVersion(plan.id, version, content, contentHash, title || undefined);
        updatePlanVersion(plan.id, version);
      } else {
        version = plan.current_version;
      }
    }

    return NextResponse.json({
      status: 'synced',
      planPath: absolutePath,
      version,
      contentHash: contentHash.slice(0, 12)
    });
  } catch (error) {
    console.error('Error syncing plan:', error);
    return NextResponse.json(
      { error: 'Failed to sync plan' },
      { status: 500 }
    );
  }
}

function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
