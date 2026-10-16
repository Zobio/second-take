import type { ChatMessage, Provider } from './types';
import { clickSendOrEnter, insertTextToEditor, visibleText, waitForElement } from '@/utils/dom';

// 画面の構造が変わったら、まずここのセレクタを直す
const SEL = {
  userMessage: '[data-testid="user-message"]',
  assistantMessage: '[data-testid="assistant-message"]',
  editor: ['div.ProseMirror[contenteditable="true"]', 'div[contenteditable="true"]'],
  sendButton: [
    'button[aria-label="Send message"]',
    'button[aria-label="メッセージを送信"]',
  ],
};

export const claude: Provider = {
  id: 'claude',
  name: 'Claude',
  matches: ['https://claude.ai/*'],
  newChatUrl: 'https://claude.ai/new',

  extractConversation() {
    const nodes = document.querySelectorAll<HTMLElement>(
      `${SEL.userMessage}, ${SEL.assistantMessage}`,
    );
    const messages: ChatMessage[] = [];
    nodes.forEach((el) => {
      const text = visibleText(el);
      if (!text) return;
      messages.push({ role: el.matches(SEL.userMessage) ? 'user' : 'assistant', text });
    });
    return messages;
  },

  async submitPrompt(text) {
    const editor = await waitForElement(SEL.editor);
    insertTextToEditor(editor, text);
    await clickSendOrEnter(editor, SEL.sendButton);
  },
};
