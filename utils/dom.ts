/**
 * サイト横断で使うDOMの補助関数。
 * Claude / ChatGPT はどちらもSPAで、要素が後から現れるため「待つ」処理が要る。
 */

/** selectors のどれかに一致する要素が現れるまで待つ */
export function waitForElement<T extends Element = HTMLElement>(
  selectors: string[],
  timeoutMs = 15000,
): Promise<T> {
  const find = () => {
    for (const s of selectors) {
      const el = document.querySelector<T>(s);
      if (el) return el;
    }
    return null;
  };

  return new Promise((resolve, reject) => {
    const found = find();
    if (found) return resolve(found);

    const observer = new MutationObserver(() => {
      const el = find();
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`要素が見つかりません: ${selectors.join(', ')}`));
    }, timeoutMs);
  });
}

/**
 * 要素の「画面に見えている」文章を取り出す。
 * スクリーンリーダー用の見えない要素（.sr-only）には同じ文章が
 * 重複して入っていることがあるので、それを除いて読む。
 */
export function visibleText(el: HTMLElement): string {
  // .sr-only: Tailwind系（Claude など） / .cdk-visually-hidden: Angular系（Gemini）
  const hidden = '.sr-only, .cdk-visually-hidden, [aria-hidden="true"]';
  if (!el.querySelector(hidden)) return el.innerText.trim();
  return [...el.children]
    .filter((c): c is HTMLElement => c instanceof HTMLElement && !c.matches(hidden))
    .map((c) => visibleText(c))
    .filter(Boolean)
    .join('\n')
    .trim();
}

export const sleep =(ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * contenteditable（ProseMirror など）の入力欄にテキストを入れる。
 * value を直接書き換えるとエディタ側の状態とずれるので、
 * ユーザーが入力したのと同じ扱いになる insertText を使う。
 */
export function insertTextToEditor(editor: HTMLElement, text: string) {
  editor.focus();
  if (editor instanceof HTMLTextAreaElement) {
    // React 管理の textarea は .value を直接書くと状態に反映されないので、
    // まず insertText を試し、だめならネイティブの setter 経由で書き込む
    editor.select();
    if (!document.execCommand('insertText', false, text) || editor.value !== text) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      setter?.call(editor, text);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }
  // 既存の内容を全選択して置き換える
  const range = document.createRange();
  range.selectNodeContents(editor);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  document.execCommand('insertText', false, text);
}

/**
 * 送信ボタンを押す。ボタンが見つからない／有効にならない場合は
 * 入力欄で Enter を押したことにする（どちらのサイトも Enter で送信できる）。
 */
export async function clickSendOrEnter(
  editor: HTMLElement,
  sendButtonSelectors: string[],
  timeoutMs = 5000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const s of sendButtonSelectors) {
      const btn = document.querySelector<HTMLButtonElement>(s);
      if (btn && !btn.disabled) {
        btn.click();
        return;
      }
    }
    await sleep(200);
  }
  editor.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }),
  );
}
