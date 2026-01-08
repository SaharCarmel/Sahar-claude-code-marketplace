import { NextRequest, NextResponse } from 'next/server';
import { addEvidence, saveImage } from '@/lib/data-store';
import { generateId } from '@/lib/utils';
import type { Evidence } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const contentType = request.headers.get('content-type') || '';

    let evidence: Evidence;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload (screenshots)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const label = formData.get('label') as string;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Save the file
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${generateId('img')}_${file.name}`;
      await saveImage(id, filename, buffer);

      // Return browser-accessible URL instead of filesystem path
      const imageUrl = `/api/images/${id}/${filename}`;

      evidence = {
        id: generateId('ev'),
        type: 'image',
        content: imageUrl,
        label: label || file.name,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Handle JSON evidence (text observations)
      const body = await request.json();

      evidence = {
        id: generateId('ev'),
        type: body.type || 'text',
        content: body.content,
        label: body.label,
        timestamp: new Date().toISOString(),
      };
    }

    const savedEvidence = await addEvidence(id, testId, evidence);

    return NextResponse.json(savedEvidence, { status: 201 });
  } catch (error) {
    console.error('Failed to add evidence:', error);
    return NextResponse.json(
      { error: 'Failed to add evidence' },
      { status: 500 }
    );
  }
}
