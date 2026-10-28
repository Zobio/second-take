import type { Action } from './types';
import { formatTranscript } from '@/utils/prompt';

/** 従来の機能: ここまでの会話を別のAIに渡して、最後の回答をやり直させる */
export const retry: Action = {
  id: 'retry',
  label: '別のAIに聞き直す',
  targetLabel: (t) => `${t.name}に聞き直す`,

  buildPrompt({ sourceName, messages }) {
    return [
      `以下は、ユーザーと別のAIアシスタント（${sourceName}）との会話です。`,
      `ユーザーは${sourceName}の最後の回答に満足していません。`,
      '会話の流れを踏まえて、ユーザーの最後の質問に対するより良い回答を、あなた自身の回答として作成してください。',
      '元の回答の誤りや不足があれば、それも踏まえてください。',
      '',
      formatTranscript(sourceName, messages),
    ].join('\n');
  },
};
