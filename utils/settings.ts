import { providers, type Provider, type ProviderId } from '@/providers';
import type { Action } from '@/actions';

/**
 * 送り先の候補（メニュー②に出す順）。
 * 「自分以外」かつ「その指示を任せられる」サービスを、登録順に返す。
 */
export async function getTargetsFor(source: ProviderId, action: Action): Promise<Provider[]> {
  return providers.filter(
    (p) => p.id !== source && (action.isAvailableFor?.(p) ?? true),
  );
}

/**
 * 指示ごとに、前回使った送り先を覚えておく（入力欄で Enter を押したときに使う）。
 * 保存に失敗しても動作には影響しないので、エラーは握りつぶす。
 */
const lastTargetKey = (actionId: string) => `lastTarget:${actionId}`;

export async function getLastTarget(actionId: string): Promise<ProviderId | undefined> {
  try {
    const k = lastTargetKey(actionId);
    const data = await browser.storage.local.get(k);
    return data[k] as ProviderId | undefined;
  } catch {
    return undefined;
  }
}

export async function setLastTarget(actionId: string, target: ProviderId): Promise<void> {
  try {
    await browser.storage.local.set({ [lastTargetKey(actionId)]: target });
  } catch {
    // 無視
  }
}
