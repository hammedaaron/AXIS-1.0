
import { StreamChat } from 'stream-chat';

// IMPORTANT: Replace this placeholder with the Key from your GetStream.io Dashboard
const STREAM_API_KEY = 'mv33882w4q37'; 

let clientInstance: StreamChat | null = null;

try {
  if (typeof StreamChat !== 'undefined' && STREAM_API_KEY) {
    clientInstance = StreamChat.getInstance(STREAM_API_KEY);
  } else {
    console.error("[AXIS] StreamChat library or API Key missing.");
  }
} catch (err) {
  console.error("[AXIS] StreamChat Initialization Error:", err);
}

export const chatClient = clientInstance as StreamChat;

/**
 * Hub-and-Spoke ID Generator
 * Ensures that 1-to-1 channels between Admin and User are unique and persistent.
 */
export const getAdminUserChannelId = (adminId: string, userId: string) => {
  if (!adminId || !userId) return `dl-unknown-${Math.random().toString(36).substring(7)}`;
  const sortedIds = [adminId, userId].sort();
  const cleanId1 = sortedIds[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
  const cleanId2 = sortedIds[1].replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
  return `dl-${cleanId1}-${cleanId2}`;
};
