import type { ChatMessage, Provider } from './types';
import { clickSendOrEnter, insertTextToEditor, waitForElement } from '@/utils/dom';

// 画面の構造が変わったら、まずここのセレクタを直す
const SEL = {
  message: '[data-message-author-role]',
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
    const messages: ChatMessage[] = [];
    document.querySelectorAll<HTMLElement>(SEL.message).forEach((el) => {
      const role = el.getAttribute('data-message-author-role');
      if (role !== 'user' && role !== 'assistant') return;
      const text = el.innerText.trim();
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
