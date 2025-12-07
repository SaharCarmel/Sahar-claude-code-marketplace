export interface Plan {
  id: string;
  name: string;
  file_path: string;
  title: string | null;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface PlanVersion {
  id: string;
  plan_id: string;
  version: number;
  content: string;
  content_hash: string;
  title: string | null;
  snapshot_at: string;
}

export interface Comment {
  id: string;
  plan_id: string;
  version_id: string;
  anchor_text: string;
  anchor_prefix: string;
  anchor_suffix: string;
  anchor_path: string | null;
  start_offset: number | null;
  end_offset: number | null;
  content: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  plan_id: string;
  question_text: string;
  options: QuestionOption[] | null;  // Multiple choice options
  context: string | null;
  line_number: number | null;
  section_path: string | null;
  answer: string | null;
  answered_at: string | null;
  status: 'PENDING' | 'ANSWERED';
  created_at: string;
}

export interface SelectionData {
  text: string;
  prefix: string;
  suffix: string;
  startOffset: number;
  endOffset: number;
}

export interface CreateCommentData {
  planId: string;
  versionId: string;
  anchorText: string;
  anchorPrefix?: string;
  anchorSuffix?: string;
  anchorPath?: string;
  startOffset?: number;
  endOffset?: number;
  content: string;
}
