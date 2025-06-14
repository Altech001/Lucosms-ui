import { useState, useEffect } from 'react';

interface CachedMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface BotCache {
  phoneNumber: string;
  messages: CachedMessage[];
}

const CACHE_KEY = 'lucobot_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useBotCache = (phoneNumber: string) => {
  const [cachedMessages, setCachedMessages] = useState<CachedMessage[]>([]);

  // Load cached messages on mount
  useEffect(() => {
    const loadCache = () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const caches: BotCache[] = JSON.parse(cached);
        const userCache = caches.find(c => c.phoneNumber === phoneNumber);
        
        if (userCache) {
          // Check if cache is still valid
          const isValid = userCache.messages.some(msg => 
            Date.now() - msg.timestamp < CACHE_EXPIRY
          );
          
          if (isValid) {
            setCachedMessages(userCache.messages);
          } else {
            // Clear expired cache
            clearCache();
          }
        }
      }
    };

    loadCache();
  }, [phoneNumber]);

  // Update cache when messages change
  const updateCache = (messages: CachedMessage[]) => {
    const cached = localStorage.getItem(CACHE_KEY);
    let caches: BotCache[] = cached ? JSON.parse(cached) : [];
    
    // Remove old cache for this user
    caches = caches.filter(c => c.phoneNumber !== phoneNumber);
    
    // Add new cache
    caches.push({
      phoneNumber,
      messages
    });
    
    // Keep only last 10 user caches
    if (caches.length > 10) {
      caches = caches.slice(-10);
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(caches));
    setCachedMessages(messages);
  };

  const clearCache = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const caches: BotCache[] = JSON.parse(cached);
      const newCaches = caches.filter(c => c.phoneNumber !== phoneNumber);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCaches));
    }
    setCachedMessages([]);
  };

  return {
    cachedMessages,
    updateCache,
    clearCache
  };
};
