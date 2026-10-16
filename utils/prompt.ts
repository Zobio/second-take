import type { ChatMessage } from '@/providers';

/**
 * 送り先に渡すプロンプトを組み立てる。
 * サイトに依存しないので、どの組み合わせ（任意→任意）でも同じ関数を使う。
 */
export function buildPrompt(sourceName: string, messages: ChatMessage[]): string {
  const transcript = messages
    .map((m) => `【${m.role === 'user' ? 'ユーザー' : sourceName}】\n${m.text}`)
    .join('\n\n');

  return [
    `以下は、ユーザーと別のAIアシスタント（${sourceName}）との会話です。`,
    `ユーザーは${sourceName}の最後の回答に満足していません。`,
    '会話の流れを踏まえて、ユーザーの最後の質問に対するより良い回答を、あなた自身の回答として作成してください。',
    '元の回答の誤りや不足があれば、それも踏まえてください。',
    '',
    '--- 会話ここから ---',
    transcript,
    '--- 会話ここまで ---',
  ].join('\n');
}
