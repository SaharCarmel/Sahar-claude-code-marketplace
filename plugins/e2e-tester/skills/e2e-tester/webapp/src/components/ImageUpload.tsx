'use client';

import { useState, useCallback } from 'react';
import { Upload, Image, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUpload: (file: File) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-64 rounded-lg mx-auto"
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Drop image here or click to upload</p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </label>
        </div>
      )}

      {selectedFile && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground truncate">
            {selectedFile.name}
          </span>
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Upload
          </button>
        </div>
      )}
    </div>
  );
}
