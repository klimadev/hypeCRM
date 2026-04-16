export async function obterSnapshotCacheado<T>(params: {
  key: string;
  ttlMs: number;
  loader: () => Promise<T>;
}): Promise<T> {
  void params.key;
  void params.ttlMs;
  return await params.loader();
}
