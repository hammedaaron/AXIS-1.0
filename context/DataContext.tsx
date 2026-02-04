
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Jobber, SystemEvent, Severity, Role, Rank, Project, ChatMessage, Proof, Contribution, Broadcast, InAppNotification, ChatChannel } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  jobbers: Jobber[];
  events: SystemEvent[];
  projects: Project[];
  messages: ChatMessage[];
  broadcasts: Broadcast[];
  channels: ChatChannel[];
  notifications: InAppNotification[];
  isLoading: boolean;
  isLive: boolean;
  addEvent: (type: SystemEvent['type'], message: string, severity: Severity, targetId?: string) => Promise<void>;
  updateJobber: (id: string, updates: Partial<Jobber>) => Promise<void>;
  scoreProof: (jobberId: string, proofId: string, score: number) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_at'>) => Promise<void>;
  submitProof: (jobberId: string, proofData: any) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string | null, channelId: string | null, text: string) => Promise<void>;
  markMessageAsRead: (senderId: string, receiverId: string) => Promise<void>;
  addBroadcast: (message: string, priority?: 'normal' | 'urgent', authorId?: string) => Promise<void>;
  deleteBroadcast: (id: string) => Promise<void>;
  createChannel: (name: string, description: string, memberIds: string[]) => Promise<void>;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  refreshJobberData: (id: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [jobbers, setJobbers] = useState<Jobber[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Safety timer to prevent stuck loading screen
      const safetyTimer = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      const live = !supabase.supabaseUrl.includes('placeholder-project-id');
      setIsLive(live);
      
      if (live) {
        try {
          await fetchLiveData();
        } catch (err) {
          console.error("[AXIS] Sync Error during init:", err);
        } finally {
          setIsLoading(false);
          clearTimeout(safetyTimer);
        }
      } else {
        // Fallback for local/demo mode
        setChannels([
          { id: 'chan-general', name: 'CORE_OPS', description: 'Central operational hub', is_private: false, type: 'public', member_ids: [] }
        ]);
        setBroadcasts([
          { id: '1', message: 'Welcome to AXIS Operations Platform. Neural Uplink Stable.', priority: 'normal', created_at: new Date().toISOString(), author_id: 'system' }
        ]);
        setIsLoading(false);
        clearTimeout(safetyTimer);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLive) return;

    const channel = supabase.channel('axis-sync-node')
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (p) => {
        const m = p.new;
        if (!m) return;
        // Fix: Changed 'receiver_id' to 'receiverId' to match the ChatMessage interface property name.
        const formatted: ChatMessage = { 
          id: m.id, 
          senderId: m.sender_id, 
          receiverId: m.receiver_id, 
          channelId: m.channel_id,
          text: m.text, 
          is_read: m.is_read, 
          timestamp: m.created_at 
        };
        setMessages(prev => {
          if (prev.some(existing => existing.id === formatted.id)) return prev;
          return [...prev, formatted];
        });
      })
      .on('postgres_changes', { event: '*', table: 'channels' }, () => {
        fetchChannels();
      })
      .on('postgres_changes', { event: '*', table: 'broadcasts' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          setBroadcasts(prev => [payload.new as Broadcast, ...prev]);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setBroadcasts(prev => prev.filter(b => b.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setBroadcasts(prev => prev.map(b => b.id === payload.new.id ? payload.new as Broadcast : b));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive]);

  const fetchChannels = async () => {
    try {
      const { data } = await supabase.from('channels').select('*');
      if (data) {
        setChannels(data.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          is_private: c.is_private,
          type: c.type,
          member_ids: c.member_ids || []
        })));
      }
    } catch (err) {
      console.error("[AXIS] Fetch Channels Error:", err);
    }
  };

  const fetchLiveData = async () => {
    try {
      const [profilesRes, projectsRes, eventsRes, messagesRes, broadcastsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('broadcasts').select('*').order('created_at', { ascending: false })
      ]);

      await fetchChannels();

      if (profilesRes?.data) setJobbers(profilesRes.data.map((p: any) => ({ ...p, dynamicData: p.dynamic_data || {}, proofs: [], contributions: [] })));
      if (projectsRes?.data) setProjects(projectsRes.data);
      if (eventsRes?.data) setEvents(eventsRes.data);
      if (messagesRes?.data) {
        setMessages(messagesRes.data.map((m: any) => ({ 
          id: m.id, senderId: m.sender_id, receiverId: m.receiver_id, channelId: m.channel_id, text: m.text, is_read: m.is_read, timestamp: m.created_at 
        })));
      }
      if (broadcastsRes?.data) setBroadcasts(broadcastsRes.data);
    } catch (err) {
      console.error("[AXIS] fetchLiveData Error:", err);
    }
  };

  const createChannel = async (name: string, description: string, memberIds: string[]) => {
    const { data, error } = await supabase.from('channels').insert({
      name,
      description,
      member_ids: memberIds,
      type: 'private',
      is_private: true,
      created_by: user?.id
    }).select().single();
    
    if (data) {
      await fetchChannels();
    }
  };

  const refreshAllData = async () => {
    setIsLoading(true);
    await fetchLiveData();
    setIsLoading(false);
  };

  const sendMessage = async (senderId: string, receiverId: string | null, channelId: string | null, text: string) => {
    await supabase.from('messages').insert({ 
      sender_id: senderId, 
      receiver_id: receiverId, 
      channel_id: channelId,
      text, 
      is_read: false 
    });
  };

  const markMessageAsRead = async (s: string, r: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('sender_id', s).eq('receiver_id', r);
  };

  const updateJobber = async (id: string, updates: any) => {
    const dbUpdates = { ...updates };
    if (updates.dynamicData) { dbUpdates.dynamic_data = updates.dynamicData; delete dbUpdates.dynamicData; }
    await supabase.from('profiles').update(dbUpdates).eq('id', id);
    setJobbers(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const addEvent = async (t: any, m: any, s: any, tid: any) => {
    await supabase.from('events').insert({ type: t, message: m, severity: s, related_jobber_id: tid });
  };

  const scoreProof = async (jid: string, pid: string, score: number) => {
    await supabase.from('proofs').update({ admin_score: score, status: 'scored' }).eq('id', pid);
    await refreshJobberData(jid);
  };

  const refreshJobberData = async (id: string) => {
    const { data } = await supabase.from('profiles').select('*, proofs(*)').eq('id', id).single();
    if (data) {
      setJobbers(prev => prev.map(j => j.id === id ? { ...data, dynamicData: data.dynamic_data || {}, proofs: data.proofs || [] } : j));
    }
  };

  const submitProof = async (jobberId: string, proofData: any) => {
    await supabase.from('proofs').insert({ ...proofData, jobber_id: jobberId });
    await refreshJobberData(jobberId);
  };

  const addProject = async (p: any) => {
    await supabase.from('projects').insert(p);
    await refreshAllData();
  };

  const addBroadcast = async (message: string, priority: 'normal' | 'urgent' = 'normal', authorId?: string) => {
    const { data, error } = await supabase.from('broadcasts').insert({ message, priority, author_id: authorId }).select().single();
    if (!isLive && !error) {
       setBroadcasts(prev => [{ id: Math.random().toString(), message, priority, author_id: authorId || 'system', created_at: new Date().toISOString() }, ...prev]);
    }
  };

  const deleteBroadcast = async (id: string) => {
    await supabase.from('broadcasts').delete().eq('id', id);
    if (!isLive) setBroadcasts(prev => prev.filter(b => b.id !== id));
  };

  const markAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  const clearNotifications = () => setNotifications([]);

  return (
    <DataContext.Provider value={{ 
      jobbers, events, projects, messages, broadcasts, channels, notifications, isLoading, isLive, 
      addEvent, updateJobber, scoreProof, submitProof, addProject, sendMessage, 
      markMessageAsRead, addBroadcast, deleteBroadcast, createChannel, markAllNotificationsRead, 
      clearNotifications, refreshJobberData, refreshAllData 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData context not found. Ensure DataProvider wraps your component.");
  return context;
};
