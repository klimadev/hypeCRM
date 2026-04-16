type PushNameCacheEntry = {
  pushName: string | null;
  timestamp: number;
};

type PushNameCacheInstance = Map<string, PushNameCacheEntry>;

const cache = new Map<string, PushNameCacheInstance>();

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES_PER_INSTANCE = 500;

function getInstanceCache(instanceName: string): PushNameCacheInstance {
  let instanceCache = cache.get(instanceName);
  if (!instanceCache) {
    instanceCache = new Map();
    cache.set(instanceName, instanceCache);
  }
  return instanceCache;
}

export function getPushNameFromCache(instanceName: string, telefone: string): string | null {
  const instanceCache = cache.get(instanceName);
  if (!instanceCache) return null;

  const entry = instanceCache.get(telefone);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    instanceCache.delete(telefone);
    return null;
  }

  return entry.pushName;
}

export function setPushNameInCache(instanceName: string, telefone: string, pushName: string | null): void {
  const instanceCache = getInstanceCache(instanceName);

  if (instanceCache.size >= MAX_ENTRIES_PER_INSTANCE) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of instanceCache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      instanceCache.delete(oldestKey);
    }
  }

  instanceCache.set(telefone, {
    pushName,
    timestamp: Date.now(),
  });
}

export function clearPushNameCache(instanceName?: string): void {
  if (instanceName) {
    cache.delete(instanceName);
  } else {
    cache.clear();
  }
}