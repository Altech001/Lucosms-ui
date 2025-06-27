import { useMessage } from '@/context/MessageContext';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useMessageCache = <T,>() => {
  const { state, updateCache } = useMessage();

  const getCachedData = (key: string): T | null => {
    const cached = state.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      state.cache.delete(key);
      return null;
    }

    return cached.data as T;
  };

  const cacheData = (key: string, data: T) => {
    updateCache(key, data);
  };

  return { getCachedData, cacheData };
};