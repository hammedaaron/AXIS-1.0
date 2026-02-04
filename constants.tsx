
import React from 'react';
import { Shield, User, Users, Settings, Activity, FileText, Layout, MessageSquare, UserCircle } from 'lucide-react';
import { Rank, Role, Attribute, ProfileSection } from './types';

export const RANK_COLORS = {
  [Rank.GOLD]: 'text-violet-400 border-violet-400/20 bg-violet-400/5',
  [Rank.SILVER]: 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5',
  [Rank.BRONZE]: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
  [Rank.IRON]: 'text-rose-400 border-rose-400/20 bg-rose-400/5',
};

export const ROLE_ICONS = {
  [Role.SUPER_ADMIN]: <Shield className="w-4 h-4 text-violet-500" />,
  [Role.ADMIN]: <Users className="w-4 h-4 text-blue-500" />,
  [Role.JOBBER]: <User className="w-4 h-4 text-zinc-500" />,
};

export const NAV_ITEMS = [
  { label: 'Overview', path: 'overview', icon: <Activity className="w-5 h-5" />, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  { label: 'Dashboard', path: 'dashboard', icon: <Activity className="w-5 h-5" />, roles: [Role.JOBBER] },
  { label: 'Jobbers', path: 'jobbers', icon: <Users className="w-5 h-5" />, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.JOBBER] },
  { label: 'Proof Queue', path: 'proof-queue', icon: <FileText className="w-5 h-5" />, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  { label: 'Campaigns', path: 'campaigns', icon: <Layout className="w-5 h-5" />, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.JOBBER] },
  { label: 'System Settings', path: 'settings', icon: <Settings className="w-5 h-5" />, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  { label: 'Messages', path: 'messages', icon: <MessageSquare className="w-5 h-5" />, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.JOBBER] },
  { label: 'Member Settings', path: 'member-settings', icon: <UserCircle className="w-5 h-5" />, roles: [Role.JOBBER] },
];

export const INITIAL_ATTRIBUTES: Attribute[] = [
  { key: 'bio', label: 'Biography', data_type: 'richtext', options: null, is_public: true },
  { key: 'twitter', label: 'X (Twitter) Profile', data_type: 'url', options: null, is_public: true },
  { key: 'telegram', label: 'Telegram Handle', data_type: 'text', options: null, is_public: true },
  { key: 'linkedin', label: 'LinkedIn URL', data_type: 'url', options: null, is_public: true },
  { key: 'category', label: 'Primary Category', data_type: 'select', options: ["Video", "Writer", "Mod", "Developer", "Designer"], is_public: true },
];

export const INITIAL_SECTIONS: ProfileSection[] = [
  { id: '1', section_name: 'Identity', display_order: 1, contained_attribute_keys: ["category"] },
  { id: '2', section_name: 'Social Presence', display_order: 2, contained_attribute_keys: ["twitter", "telegram", "linkedin", "bio"] },
];
