import type { ChatMessage, Provider } from './types';
import { clickSendOrEnter, insertTextToEditor, visibleText, waitForElement } from '@/utils/dom';

// 画面の構造が変わったら、まずここのセレクタを直す
const SEL = {
  // 1つのメッセージを包む要素と、その発言者を表す属性。
  // 新しい画面の形式を先に、古い形式を予備として後に並べる。
  message: [
    { selector: '[data-message-role]', roleAttr: 'data-message-role' },
    { selector: '[data-message-author-role]', roleAttr: 'data-message-author-role' },
  ],
  editor: [
    '#prompt-textarea',
    'div[contenteditable="true"]',
    'form textarea', // ログアウト時や新UIでは素の textarea のことがある
    'textarea',
  ],
  sendButton: ['button[data-testid="send-button"]', '#composer-submit-button'],
};

export const chatgpt: Provider = {
  id: 'chatgpt',
  name: 'ChatGPT',
  matches: ['https://chatgpt.com/*'],
  newChatUrl: 'https://chatgpt.com/',

  extractConversation() {
    const all = SEL.message.map((m) => m.selector).join(', ');
    const messages: ChatMessage[] = [];

    document.querySelectorAll<HTMLElement>(all).forEach((el) => {
      // 新旧の形式が入れ子になっている場合、外側だけを数える（二重取り防止）
      if (el.parentElement?.closest(all)) return;

      const def = SEL.message.find((m) => el.matches(m.selector))!;
      const role = el.getAttribute(def.roleAttr);
      if (role !== 'user' && role !== 'assistant') return;

      const text = visibleText(el);
      if (text) messages.push({ role, text });
    });
    return messages;
  },

  async submitPrompt(text) {
    const editor = await waitForElement(SEL.editor);
    insertTextToEditor(editor, text);
    await clickSendOrEnter(editor, SEL.sendButton);
  },
};
