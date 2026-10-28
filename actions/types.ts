import type { ChatMessage, Provider } from '@/providers';

/**
 * 「何を頼むか」を表す。（Provider が「どこに送るか」を表すのと対になる）
 *
 * 新しい指示を足すときは、このインターフェースを満たすファイルを
 * actions/ に1つ足して actions/index.ts に登録するだけでよい。
 * メニューの項目・入力欄・送り先の一覧は、この定義から自動で組み立てられる。
 */
export interface Action {
  /** 内部ID。例: 'retry' */
  id: string;
  /** メニュー①に出す名前。例: '別のAIに聞き直す' */
  label: string;
  /** メニュー②の送り先ボタンの文言。例: (Claude) => 'Claudeに聞き直す' */
  targetLabel(target: Provider): string;

  /**
   * 任意の補足を1行で入力させたいときだけ指定する。
   * 指定がない指示は、メニュー②に入力欄を出さない。
   */
  input?: { placeholder: string };

  /** 送り先に渡すプロンプトを組み立てる */
  buildPrompt(ctx: ActionContext): string;

  /** この指示を任せられる送り先か（省略時はすべて可） */
  isAvailableFor?(target: Provider): boolean;
}

export interface ActionContext {
  /** 送り元のサービス名。例: 'Claude' */
  sourceName: string;
  /** 送り元の画面から取り出した会話 */
  messages: ChatMessage[];
  /** ユーザーが入力した補足（未入力なら空文字） */
  note: string;
}
