import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function matchPattern(pattern: string, text: string): {
  matches: boolean;
  matchedText?: string;
} {
  try {
    const regex = new RegExp(pattern);
    const match = text.match(regex);
    if (match) {
      return { matches: true, matchedText: match[0] };
    }
    return { matches: false };
  } catch {
    return { matches: false };
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'text-red-600 bg-red-50';
    case 'high':
      return 'text-orange-600 bg-orange-50';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'passed':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'skipped':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'pending':
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'ui': 'UI',
    'api': 'API',
    'integration': 'Integration',
    'edge-case': 'Edge Case',
    'data-verification': 'Data Verification',
  };
  return labels[category] || category;
}

export function getStepTypeIcon(type: string): string {
  switch (type) {
    case 'action':
      return '👆';
    case 'observe':
      return '👀';
    case 'screenshot':
      return '📷';
    default:
      return '•';
  }
}
