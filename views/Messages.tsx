
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Jobber, Role } from '../types';
import { 
  Send, Plus, MoreVertical, Volume2, X, CheckCheck,
  ChevronLeft, Loader2, Signal, ShieldAlert, RefreshCcw, Users, Check, MessageSquare
} from 'lucide-react';
import { chatClient, getAdminUserChannelId } from '../lib/stream';
import type { Channel } from 'stream-chat';
import { GoogleGenAI, Modality } from "@google/genai";

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface MessagesProps {
  onSelectJobber?: (jobber: any) => void;
  userOverride?: any;
}

const Messages: React.FC<MessagesProps> = ({ onSelectJobber, userOverride }) => {
  const { jobbers = [] } = useData();
  const { user: authUser } = useAuth();
  const user = userOverride || authUser;

  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isHuddleActive, setIsHuddleActive] = useState(false);
  const [huddleStatus, setHuddleStatus] = useState<'idle' | 'connecting' | 'active'>('idle');

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);

  const isAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const huddleSessionRef = useRef<any>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);

  const initStream = async () => {
    if (!user) {
      setConnectionError("No operational identity found.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setConnectionError(null);
    
    try {
      if (chatClient.userID && chatClient.userID !== user.id) {
        await chatClient.disconnectUser();
      }

      if (chatClient.userID !== user.id) {
        const userToken = chatClient.devToken(user.id);
        await chatClient.connectUser(
          { 
            id: user.id, 
            name: user.name, 
            image: jobbers.find(j => j.id === user.id)?.avatar_url || `https://ui-avatars.com/api/?name=${user.name}` 
          },
          userToken
        );
      }

      const filter = isAdmin 
        ? { type: { $in: ['direct_admin', 'group_admin'] } } 
        : { members: { $in: [user.id] } };

      const sort = [{ last_message_at: -1 }];
      const result = await chatClient.queryChannels(filter as any, sort as any, { watch: true, presence: true });
      
      setChannels(result);
      if (result.length > 0 && !activeChannel) setActiveChannel(result[0]);
    } catch (err: any) {
      console.error("Signal Path Error:", err);
      setConnectionError(err.message || "Uplink failure.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initStream();
  }, [user?.id, isAdmin]);

  useEffect(() => {
    const handleNewMessage = (event: any) => {
      if (event.type === 'message.new' || event.type === 'notification.message_new') {
        const filter = isAdmin ? { type: { $in: ['direct_admin', 'group_admin'] } } : { members: { $in: [user?.id || ''] } };
        chatClient.queryChannels(filter as any, [{ last_message_at: -1 }]).then(setChannels);
      }
    };
    chatClient.on(handleNewMessage);
    return () => chatClient.off(handleNewMessage);
  }, [isAdmin, user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannel?.state.messages]);

  const startDirectLink = async (targetJobber: Jobber) => {
    if (!user || !isAdmin) return;
    try {
      await chatClient.upsertUsers([{
        id: targetJobber.id,
        name: targetJobber.name,
        image: targetJobber.avatar_url || `https://ui-avatars.com/api/?name=${targetJobber.name}`
      }]);

      const channelId = getAdminUserChannelId(user.id, targetJobber.id);
      const channel = chatClient.channel('direct_admin', channelId, {
        members: [user.id, targetJobber.id],
        name: `${targetJobber.name} (Direct)`,
      } as any);
      
      await channel.watch();
      setActiveChannel(channel);
      
      const filter = { type: { $in: ['direct_admin', 'group_admin'] } };
      chatClient.queryChannels(filter as any, [{ last_message_at: -1 }]).then(setChannels);
    } catch (err: any) {
      console.error("Direct Link Error:", err);
      alert(`Initialization Failed: ${err.message}`);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin || !groupName.trim() || selectedMembers.length < 1) return;
    
    setIsGroupSubmitting(true);
    try {
      const usersToUpsert = jobbers
        .filter(j => selectedMembers.includes(j.id))
        .map(j => ({
          id: j.id,
          name: j.name,
          image: j.avatar_url || `https://ui-avatars.com/api/?name=${j.name}`
        }));
      
      await chatClient.upsertUsers(usersToUpsert);

      const groupId = `group-${Math.random().toString(36).substring(2, 10)}`;
      const channel = chatClient.channel('group_admin', groupId, {
        members: [user.id, ...selectedMembers],
        name: groupName,
        created_by_id: user.id
      });
      
      await channel.create();
      await channel.watch();
      
      setActiveChannel(channel);
      setIsCreatingGroup(false);
      setGroupName('');
      setSelectedMembers([]);
      
      const filter = { type: { $in: ['direct_admin', 'group_admin'] } };
      chatClient.queryChannels(filter as any, [{ last_message_at: -1 }]).then(setChannels);
    } catch (err: any) {
      console.error("Group Deployment Failure:", err);
      alert(`Failed: ${err.message}`);
    } finally {
      setIsGroupSubmitting(false);
    }
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel) return;
    const text = inputText;
    setInputText('');
    await activeChannel.sendMessage({ text });
  };

  const toggleHuddle = async () => {
    if (isHuddleActive) {
      if (huddleSessionRef.current) huddleSessionRef.current.close();
      setIsHuddleActive(false);
      setHuddleStatus('idle');
      return;
    }
    setIsHuddleActive(true);
    setHuddleStatus('connecting');
    try {
      // Create a new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outCtx;
      let nextStartTime = 0;
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => setHuddleStatus('active'),
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current.destination);
              // Track end of previous chunk to ensure smooth playback
              nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
              source.start(nextStartTime);
              nextStartTime += audioBuffer.duration;
            }
          },
          onclose: () => setIsHuddleActive(false),
          onerror: (e) => console.error(e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Operational voice relay active. Keep status brief."
        }
      });
      huddleSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsHuddleActive(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#09090b]">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Signal Sync...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#09090b] text-zinc-100 overflow-hidden relative">
      {isCreatingGroup && isAdmin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreatingGroup(false)} />
          <form onSubmit={handleCreateGroup} className="relative w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
             <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <Users className="w-5 h-5 text-violet-500" />
                   <h2 className="text-xs font-black uppercase tracking-widest text-white">New Tactical Node</h2>
                </div>
                <button type="button" onClick={() => setIsCreatingGroup(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest pl-1">Node Identifier</label>
                  <input required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-violet-500 outline-none transition-all placeholder-zinc-700" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. MISSION_ALPHA" />
                </div>
                <div className="space-y-3">
                   <label className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest pl-1">Select Field Operators ({selectedMembers.length})</label>
                   <div className="space-y-1.5">
                      {jobbers.filter(j => j.id !== user?.id).map(j => (
                        <button type="button" key={j.id} onClick={() => toggleMemberSelection(j.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedMembers.includes(j.id) ? 'bg-violet-600/10 border-violet-500/50' : 'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-700'}`}>
                          <img src={j.avatar_url || `https://ui-avatars.com/api/?name=${j.name}`} className="w-7 h-7 rounded-lg object-cover border border-zinc-800" />
                          <div className="flex-1 text-left min-w-0">
                            <div className="text-[11px] font-bold text-white truncate">{j.name}</div>
                            <div className="text-[8px] text-zinc-500 font-mono uppercase truncate">{j.handle}</div>
                          </div>
                          {selectedMembers.includes(j.id) && <Check className="w-3.5 h-3.5 text-violet-500" />}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
             <div className="p-6 bg-zinc-900/50 border-t border-zinc-800">
                <button type="submit" disabled={isGroupSubmitting || !groupName.trim() || selectedMembers.length < 1} className="w-full py-3 bg-violet-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-30 shadow-lg shadow-violet-600/20">
                  {isGroupSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Deploy Group Node
                </button>
             </div>
          </form>
        </div>
      )}

      <div className={`flex flex-col border-r border-zinc-800 bg-[#0c0c0e] transition-all duration-300 ${activeChannel ? 'hidden md:flex w-80' : 'w-full md:w-80'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-violet-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Signal Relay</h2>
          </div>
          {isAdmin && (
            <button onClick={() => setIsCreatingGroup(true)} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all shadow-inner" title="Initialize Tactical Node">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="p-4 border-b border-zinc-800/30 bg-zinc-950/30">
            <p className="text-[8px] font-bold text-zinc-600 uppercase mb-3 tracking-widest pl-1">Quick Operator Link</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {jobbers.filter(j => j.id !== user?.id).map(j => (
                <button key={j.id} onClick={() => startDirectLink(j)} className="shrink-0 group relative" title={`Sync with ${j.name}`}>
                  <img src={j.avatar_url || `https://ui-avatars.com/api/?name=${j.name}`} className="w-9 h-9 rounded-xl border border-zinc-800 grayscale group-hover:grayscale-0 transition-all object-cover hover:border-violet-500/50" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-violet-600 rounded-full border-2 border-[#0c0c0e] flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-lg">
                    <MessageSquare className="w-2 h-2 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {channels.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <ShieldAlert className="w-8 h-8 mx-auto text-zinc-900" />
              <p className="text-[9px] text-zinc-700 uppercase font-mono tracking-widest">Standby for Signal</p>
            </div>
          ) : (
            channels.map(chan => {
              const otherMembers = (Object.values(chan.state.members) as any[]).filter(m => m.user?.id !== user?.id);
              const otherMember = otherMembers[0]?.user;
              const lastMsg = chan.state.messages[chan.state.messages.length - 1];
              const isActive = activeChannel?.id === chan.id;
              const isGroup = chan.type === 'group_admin';
              return (
                <button key={chan.id} onClick={() => setActiveChannel(chan)} className={`w-full flex items-center gap-4 px-6 py-4 transition-all border-b border-zinc-800/30 ${isActive ? 'bg-violet-600/10 border-r-2 border-r-violet-500' : 'hover:bg-zinc-800/10'}`}>
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-950 overflow-hidden ${isActive ? 'border-violet-500/50' : ''}`}>
                       {isGroup ? <Users className={`w-4 h-4 ${isActive ? 'text-violet-500' : 'text-zinc-700'}`} /> : <img src={otherMember?.image || 'https://picsum.photos/40'} className={`w-full h-full object-cover grayscale ${isActive ? 'grayscale-0' : ''}`} />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`text-[12px] font-bold truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>{(chan.data as any)?.name || otherMember?.name || 'Channel'}</h3>
                      <span className="text-[8px] text-zinc-700 font-mono">{lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 truncate font-light mt-0.5">{lastMsg?.text || 'Establishing Link...'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 bg-[#09090b] ${!activeChannel ? 'hidden md:flex' : 'flex'}`}>
        {activeChannel ? (
          <>
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-md shrink-0 z-30">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChannel(null)} className="md:hidden p-2 -ml-2 text-zinc-400"><ChevronLeft className="w-5 h-5" /></button>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                  {activeChannel.type === 'group_admin' ? <Users className="w-4 h-4 text-violet-500" /> : <img src={(Object.values(activeChannel.state.members) as any[]).find(m => m.user?.id !== user?.id)?.user?.image || 'https://picsum.photos/40'} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{(activeChannel.data as any)?.name || (Object.values(activeChannel.state.members) as any[]).find(m => m.user?.id !== user?.id)?.user?.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-emerald-500 font-mono uppercase tracking-widest animate-pulse">Link Stable</span>
                    <span className="text-[7px] text-zinc-700 font-mono uppercase px-1 border border-zinc-900 rounded">TLS/2.5</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleHuddle} className={`p-2 rounded-lg border transition-all ${isHuddleActive ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'text-zinc-600 border-zinc-800 hover:text-white'}`} title="Secure Huddle"><Volume2 className="w-4 h-4" /></button>
                <button className="p-2 text-zinc-600 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="max-w-4xl mx-auto space-y-8">
                {activeChannel.state.messages.map((msg, idx) => {
                  const isMe = msg.user?.id === user?.id;
                  const prevMsg = activeChannel.state.messages[idx - 1];
                  const showHeader = !prevMsg || prevMsg.user?.id !== msg.user?.id;
                  return (
                    <div key={msg.id} className={`flex items-start gap-4 ${isMe ? 'flex-row-reverse' : ''} group`}>
                      <img src={msg.user?.image || 'https://picsum.photos/32'} className={`w-8 h-8 rounded-lg border border-zinc-900 shrink-0 mt-1 grayscale group-hover:grayscale-0 transition-all ${showHeader ? 'opacity-100' : 'opacity-0'}`} />
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        {showHeader && (
                          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] font-bold text-zinc-200">{msg.user?.name}</span>
                            <span className="text-[8px] text-zinc-700 font-mono">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words shadow-sm ${isMe ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-tl-none'}`}>
                          {msg.text}
                          {isMe && <div className="flex justify-end mt-0.5"><CheckCheck className="w-3 h-3 text-white/40" /></div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>
            <div className="p-6 bg-[#09090b] border-t border-zinc-800">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl flex items-end p-2 px-4 focus-within:border-violet-500/30 transition-all shadow-2xl">
                <textarea value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }} placeholder="Transmit Signal..." className="flex-1 bg-transparent border-none text-zinc-300 text-sm focus:ring-0 outline-none resize-none py-3 px-2 max-h-40 font-light placeholder-zinc-800" rows={1} />
                <button type="submit" disabled={!inputText.trim()} className={`p-2.5 transition-all ${inputText.trim() ? 'text-violet-500 hover:scale-105' : 'text-zinc-900'}`}><Send className="w-5 h-5" /></button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-6 border border-zinc-900 shadow-2xl">
               <Signal className="w-8 h-8 text-zinc-800" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Secure Core</h3>
            <p className="text-zinc-700 text-[10px] font-mono uppercase tracking-[0.2em] max-w-xs leading-relaxed">Establish link with active node or tactical group</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
