import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import {
  getAllPlans,
  getPlan,
  createPlan,
  getLatestVersion,
  createVersion,
  updatePlanVersion,
  hashContent
} from '@/lib/db';

// GET /api/plans - List all plans
export async function GET() {
  try {
    const plans = getAllPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

// POST /api/plans - Create or update plan from file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planPath } = body;

    if (!planPath) {
      return NextResponse.json(
        { error: 'planPath is required' },
        { status: 400 }
      );
    }

    // Resolve path
    let absolutePath = planPath;
    if (planPath.startsWith('~')) {
      absolutePath = planPath.replace('~', process.env.HOME || '');
    }
    absolutePath = path.resolve(absolutePath);

    // Read file content
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { error: `File not found: ${absolutePath}` },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const contentHash = hashContent(content);
    const name = path.basename(absolutePath, '.md');
    const title = extractTitle(content);

    // Check if plan exists
    let plan = getPlan(absolutePath) as { id: string; current_version: number } | undefined;

    if (!plan) {
      // Create new plan
      plan = createPlan(absolutePath, name, title || undefined) as { id: string; current_version: number };
      createVersion(plan.id, 1, content, contentHash, title || undefined);
    } else {
      // Check if content changed
      const latestVersion = getLatestVersion(plan.id) as { content_hash: string } | undefined;

      if (latestVersion?.content_hash !== contentHash) {
        // Create new version
        const newVersionNum = plan.current_version + 1;
        createVersion(plan.id, newVersionNum, content, contentHash, title || undefined);
        updatePlanVersion(plan.id, newVersionNum);
      }
    }

    // Get updated plan
    const updatedPlan = getPlan(absolutePath);

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error('Error creating/updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create/update plan' },
      { status: 500 }
    );
  }
}

function extractTitle(content: string): string | null {
  // Look for first H1
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
