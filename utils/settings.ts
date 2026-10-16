import { providers, type Provider, type ProviderId } from '@/providers';

/**
 * 送り先の候補（メニューに出す順）。今は「自分以外の全サービス」を登録順に返す。
 * 将来「よく使う順に並べる」「特定のサービスを隠す」などをしたくなったら、
 * この関数の中身を storage から読む実装に変えるだけで、他のファイルは触らなくてよい。
 */
export async function getTargetsFor(source: ProviderId): Promise<Provider[]> {
  return providers.filter((p) => p.id !== source);
}
