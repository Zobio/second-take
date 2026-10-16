import { getProvider } from '@/providers';
import type { ClaimResponse, Message } from '@/utils/messages';

// タブID → そのタブで送信すべきプロンプト
// service worker は止まることがあるので、メモリではなく storage.session に置く
const key = (tabId: number) => `pending:${tabId}`;

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
    handle(msg, sender)
      .then(sendResponse)
      .catch((e) => {
        console.error('[second-take]', e);
        sendResponse(null);
      });
    return true; // 非同期で sendResponse することを伝える
  });

  // 開いたタブが使われずに閉じられたら掃除する
  browser.tabs.onRemoved.addListener((tabId) => {
    browser.storage.session.remove(key(tabId));
  });
});

async function handle(
  msg: Message,
  sender: Browser.runtime.MessageSender,
): Promise<ClaimResponse | void> {
  switch (msg.type) {
    case 'handoff': {
      const target = getProvider(msg.target);
      // 先に空のタブを開いてIDを確定 → プロンプトを保存 → 目的のURLへ移動。
      // こうすると、ページ側の問い合わせ（claim）が保存より先に来ることがない。
      const tab = await browser.tabs.create({
        url: 'about:blank',
        // 送り元タブの右隣に開く
        index: sender.tab ? sender.tab.index + 1 : undefined,
      });
      if (tab.id === undefined) throw new Error('タブを開けませんでした');
      await browser.storage.session.set({ [key(tab.id)]: msg.prompt });
      await browser.tabs.update(tab.id, { url: target.newChatUrl });
      return;
    }
    case 'claim': {
      const tabId = sender.tab?.id;
      if (tabId === undefined) return null;
      const k = key(tabId);
      const data = await browser.storage.session.get(k);
      const prompt = data[k] as string | undefined;
      if (!prompt) return null;
      await browser.storage.session.remove(k); // 1回使ったら消す（再読み込みで二重送信しない）
      return { prompt };
    }
  }
}
