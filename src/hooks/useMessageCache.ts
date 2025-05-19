import { useMessage } from '@/context/MessageContext';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

type CachedData = any; // Replace with specific type if known

export const useMessageCache = () => {
  const { state, updateCache } = useMessage();

  const getCachedData = (key: string): CachedData | null => {
    const cached = state.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      state.cache.delete(key);
      return null;
    }

    return cached.data;
  };

  const cacheData = (key: string, data: CachedData) => {
    updateCache(key, data);
  };

  return { getCachedData, cacheData };
};