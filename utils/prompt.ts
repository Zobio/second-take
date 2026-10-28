import type { ChatMessage } from '@/providers';

/**
 * 会話を、送り先のAIに読ませる文章の形にする。
 * どの指示（actions/）からも共通で使う。
 */
export function formatTranscript(sourceName: string, messages: ChatMessage[]): string {
  const body = messages
    .map((m) => `【${m.role === 'user' ? 'ユーザー' : sourceName}】\n${m.text}`)
    .join('\n\n');
  return ['--- 会話ここから ---', body, '--- 会話ここまで ---'].join('\n');
}
