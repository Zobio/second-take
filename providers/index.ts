import type { Provider, ProviderId } from './types';
import { claude } from './claude';
import { chatgpt } from './chatgpt';

/** 対応サービスの一覧。新しいサービスはここに足す */
export const providers: Provider[] = [claude, chatgpt];

export function getProvider(id: ProviderId): Provider {
  const p = providers.find((p) => p.id === id);
  if (!p) throw new Error(`未知のプロバイダ: ${id}`);
  return p;
}

/** 今開いているページがどのサービスか判定する */
export function detectProvider(url: string): Provider | undefined {
  return providers.find((p) => p.matches.some((pattern) => matchPattern(pattern, url)));
}

/** 'https://claude.ai/*' のような拡張機能のURLパターンを簡易的に判定 */
function matchPattern(pattern: string, url: string): boolean {
  const re = new RegExp(
    '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
  );
  return re.test(url);
}

export type { Provider, ProviderId, ChatMessage } from './types';
