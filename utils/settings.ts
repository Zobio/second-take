import { providers, type ProviderId } from '@/providers';

/**
 * 送り先の選び方。今は固定で ChatGPT（自分自身のときは別のサービス）。
 * 将来ユーザーが選べるようにするときは、この関数の中身を
 * storage から読む実装に変えるだけで、他のファイルは触らなくてよい。
 */
export async function getTargetFor(source: ProviderId): Promise<ProviderId> {
  const preferred: ProviderId = 'chatgpt';
  if (preferred !== source) return preferred;
  return providers.find((p) => p.id !== source)!.id;
}
