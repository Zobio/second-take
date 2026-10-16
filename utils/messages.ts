import type { ProviderId } from '@/providers';

/** コンテントスクリプト ⇔ background でやり取りするメッセージの型 */
export type Message =
  /** 送り元 → background: このプロンプトを target で開いて送信して */
  | { type: 'handoff'; target: ProviderId; prompt: string }
  /** 送り先 → background: このタブ宛てのプロンプトはある？ */
  | { type: 'claim' };

export type ClaimResponse = { prompt: string } | null;

export function sendMessage<R = unknown>(msg: Message): Promise<R> {
  return browser.runtime.sendMessage(msg) as Promise<R>;
}
