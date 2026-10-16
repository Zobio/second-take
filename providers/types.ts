/**
 * 1つのLLMサービス（Claude, ChatGPT, ...）を表す。
 * サイトごとに違う部分はすべてここに閉じ込め、
 * それ以外のコード（ボタン、background、プロンプト生成）はサイトを知らない。
 *
 * 新しいサービスに対応するときは、このインターフェースを満たすファイルを
 * providers/ に1つ足して providers/index.ts に登録するだけでよい。
 * そうすれば自動的に「送り元」にも「送り先」にもなれる。
 */
export interface Provider {
  /** 内部ID（保存やメッセージで使う）。例: 'claude' */
  id: ProviderId;
  /** 画面表示用の名前。例: 'Claude' */
  name: string;
  /** コンテントスクリプトを動かすURLパターン */
  matches: string[];
  /** 新しい会話を開くURL（送り先として開くときに使う） */
  newChatUrl: string;

  /** 送り元として: 今の画面から会話を取り出す */
  extractConversation(): ChatMessage[];

  /** 送り先として: 入力欄にテキストを入れて送信する */
  submitPrompt(text: string): Promise<void>;
}

export type ProviderId = 'claude' | 'chatgpt';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}
