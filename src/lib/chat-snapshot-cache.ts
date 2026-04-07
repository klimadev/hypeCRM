type CacheEntry<T> = {
  promise: Promise<T> | null;
  snapshot: T | null;
  expiresAt: number;
};

type CacheStore = Map<string, CacheEntry<unknown>>;

declare global {
  var __chatSnapshotCache: CacheStore | undefined;
}

function obterStore() {
  if (!globalThis.__chatSnapshotCache) {
    globalThis.__chatSnapshotCache = new Map();
  }

  return globalThis.__chatSnapshotCache;
}

export async function obterSnapshotCacheado<T>(params: {
  key: string;
  ttlMs: number;
  loader: () => Promise<T>;
}): Promise<T> {
  const store = obterStore();
  const agora = Date.now();
  const existente = store.get(params.key) as CacheEntry<T> | undefined;

  if (existente?.promise) {
    return existente.promise;
  }

  if (existente?.snapshot && existente.expiresAt > agora) {
    return existente.snapshot;
  }

  const promise = params.loader();
  store.set(params.key, {
    promise,
    snapshot: existente?.snapshot ?? null,
    expiresAt: agora + params.ttlMs,
  });

  try {
    const snapshot = await promise;
    store.set(params.key, {
      promise: null,
      snapshot,
      expiresAt: Date.now() + params.ttlMs,
    });
    return snapshot;
  } catch (error) {
    store.delete(params.key);
    throw error;
  }
}
