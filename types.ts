
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  JOBBER = 'JOBBER'
}

export enum Rank {
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  BRONZE = 'BRONZE',
  IRON = 'IRON'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface Attribute {
  key: string;
  label: string;
  data_type: 'text' | 'url' | 'number' | 'richtext' | 'select' | string;
  options: string[] | null;
  is_public: boolean;
  display_order?: number;
}

export interface ProfileSection {
  id: string;
  section_name: string;
  display_order: number;
  contained_attribute_keys: string[];
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by?: string;
  type: 'public' | 'private' | 'dm';
  member_ids?: string[]; // Tracking who is in the group
}

export interface Contribution {
  id: string;
  jobber_id: string;
  project_id?: string;
  contribution_type: 'post' | 'thread' | 'video' | string;
  impact_score: number;
  occurred_at: string;
  message?: string;
}

export interface Proof {
  id: string;
  jobber_id: string;
  type: string;
  title: string;
  url: string;
  company?: string;
  description?: string;
  admin_score: number;
  status: 'pending' | 'approved' | 'scored' | 'flagged';
  created_at: string;
  niche?: string;
}

export interface Project {
  id: string;
  title: string;
  link: string;
  price: string;
  niche: string;
  description: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  channelId?: string;
  text: string;
  timestamp: string;
  is_read: boolean;
  read_at?: string;
}

export interface Broadcast {
  id: string;
  message: string;
  created_at: string;
  author_id: string;
  priority: 'normal' | 'urgent';
}

export interface InAppNotification {
  id: string;
  message: string;
  type: 'campaign' | 'message' | 'system';
  timestamp: string;
  is_read: boolean;
  metadata?: any;
}

export interface Jobber {
  id: string;
  handle: string;
  avatar_url: string;
  name: string;
  role: Role;
  status: 'active' | 'probation' | 'suspended';
  atis_score: number;
  rank: Rank;
  trust_modifier: number;
  justification: string;
  followers: number;
  created_at: string;
  lastUsernameChange?: string;
  dynamicData?: Record<string, any>;
  contributions: Contribution[];
  proofs: Proof[];
}

export interface SystemEvent {
  id: string;
  type: 'submission' | 'alert' | 'grade_change';
  message: string;
  related_jobber_id?: string;
  severity: Severity;
  is_read: boolean;
  created_at: string;
}
