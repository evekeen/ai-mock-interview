export type User = {
  id: string;
  clerk_id: string;
  personality_type?: string;
  created_at?: string;
};

export enum UploadType {
  Resume = 'resume',
  JobDescription = 'jd',
}

export type Upload = {
  id: string;
  user_id: string;
  type: UploadType;
  url: string;
  parsed_json?: Record<string, unknown>;
  created_at?: string;
};

export type Story = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  bullet_points?: string[];
  score?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

export type PracticeRun = {
  id: string;
  user_id: string;
  story_id: string;
  audio_url?: string;
  wpm?: number;
  filler_rate?: number;
  sentiment?: number;
  created_at?: string;
}; 