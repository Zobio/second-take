import type { ChatMessage, Provider } from './types';
import { clickSendOrEnter, insertTextToEditor, visibleText, waitForElement } from '@/utils/dom';

// 画面の構造が変わったら、まずここのセレクタを直す
const SEL = {
  userMessage: 'user-query',
  // ユーザー発言の本文部分（「あなたのプロンプト」などの見出しを含めないため）
  userBody: '.query-text',
  assistantMessage: 'model-response',
  // 回答の本文部分（「思考プロセスを表示」などのボタンを含めないため）
  assistantBody: 'message-content',
  editor: [
    'rich-textarea .ql-editor',
    'div.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"]',
  ],
  // 送信ボタンは入力欄に文字が入ってから現れる。見つからなければ Enter で送信する
  sendButton: [
    'button.send-button',
    'button[aria-label*="送信"]',
    'button[aria-label*="Send"]',
    'button[aria-label="プロンプトを送信"]',
    'button[aria-label="Send message"]',
  ],
};

export const gemini: Provider = {
  id: 'gemini',
  name: 'Gemini',
  matches: ['https://gemini.google.com/*'],
  newChatUrl: 'https://gemini.google.com/app',

  extractConversation() {
    const messages: ChatMessage[] = [];
    document
      .querySelectorAll<HTMLElement>(`${SEL.userMessage}, ${SEL.assistantMessage}`)
      .forEach((el) => {
        const isUser = el.matches(SEL.userMessage);
        const body = isUser ? SEL.userBody : SEL.assistantBody;
        const target = el.querySelector<HTMLElement>(body) ?? el;
        const text = visibleText(target);
        if (text) messages.push({ role: isUser ? 'user' : 'assistant', text });
      });
    return messages;
  },

  async submitPrompt(text) {
    const editor = await waitForElement(SEL.editor);
    insertTextToEditor(editor, text);
    await clickSendOrEnter(editor, SEL.sendButton);
  },
};
