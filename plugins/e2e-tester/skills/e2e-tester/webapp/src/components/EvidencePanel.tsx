'use client';

import { useState } from 'react';
import { Image, FileText, X, Eye } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { Evidence, EvidenceType } from '@/lib/types';

interface EvidencePanelProps {
  evidence: Evidence[];
  sessionId: string;
  testId: string;
}

// Simplified evidence panel - just images and text observations
// Claude handles command output, logs, etc. automatically
export function EvidencePanel({ evidence, sessionId, testId }: EvidencePanelProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textLabel, setTextLabel] = useState('');
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);

  const handleSubmitText = async () => {
    if (!textContent.trim()) return;

    try {
      await fetch(`/api/sessions/${sessionId}/tests/${testId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          content: textContent,
          label: textLabel || 'Observation',
        }),
      });

      setShowTextModal(false);
      setTextContent('');
      setTextLabel('');
      window.location.reload();
    } catch (err) {
      console.error('Failed to add evidence:', err);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', file.name);

    try {
      await fetch(`/api/sessions/${sessionId}/tests/${testId}/evidence`, {
        method: 'POST',
        body: formData,
      });

      setShowImageUpload(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to upload image:', err);
    }
  };

  const typeIcons: Record<EvidenceType, typeof Image> = {
    image: Image,
    text: FileText,
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Evidence</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImageUpload(true)}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            title="Add screenshot"
          >
            <Image className="w-3.5 h-3.5" />
            Screenshot
          </button>
          <button
            onClick={() => setShowTextModal(true)}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            title="Add observation"
          >
            <FileText className="w-3.5 h-3.5" />
            Observation
          </button>
        </div>
      </div>

      {/* Evidence List */}
      {evidence.length > 0 ? (
        <div className="space-y-2">
          {evidence.map((ev) => {
            const Icon = typeIcons[ev.type] || FileText;
            return (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-2 bg-muted rounded-md"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">
                  {ev.label || ev.type}
                </span>
                <button
                  onClick={() => setPreviewEvidence(ev)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No evidence added yet. Add screenshots or observations to support your test result.
        </p>
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Upload Screenshot</h3>
              <button onClick={() => setShowImageUpload(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <ImageUpload onUpload={handleImageUpload} />
          </div>
        </div>
      )}

      {/* Text Observation Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Add Observation</h3>
              <button onClick={() => setShowTextModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={textLabel}
              onChange={(e) => setTextLabel(e.target.value)}
              placeholder="Label (e.g., 'Error message seen')"
              className="w-full px-3 py-2 border rounded-md mb-3"
            />

            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Describe what you observed..."
              className="w-full h-32 px-3 py-2 border rounded-md resize-none"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowTextModal(false)}
                className="px-4 py-2 text-sm rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitText}
                disabled={!textContent.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewEvidence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{previewEvidence.label || previewEvidence.type}</h3>
              <button onClick={() => setPreviewEvidence(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewEvidence.type === 'image' ? (
              <img
                src={previewEvidence.content}
                alt={previewEvidence.label || 'Evidence'}
                className="max-w-full rounded"
              />
            ) : (
              <pre className="p-4 bg-muted rounded-md overflow-auto text-sm whitespace-pre-wrap">
                {previewEvidence.content}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
