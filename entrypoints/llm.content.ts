import { providers, detectProvider, getProvider, type Provider } from '@/providers';
import { buildPrompt } from '@/utils/prompt';
import { getTargetFor } from '@/utils/settings';
import { sendMessage, type ClaimResponse } from '@/utils/messages';

/**
 * すべての対応サイトで動く、共通のコンテントスクリプト。
 * どのサイトかは実行時に判定し、サイト固有の処理は Provider に任せる。
 * 1つのタブが「送り元（ボタンを出す）」と「送り先（受け取って送信）」の両方を担う。
 */
export default defineContentScript({
  matches: providers.flatMap((p) => p.matches),
  async main() {
    const provider = detectProvider(location.href);
    if (!provider) return;

    // 送り元として: ボタンを出す（background の状態に関係なく先に出す）
    await mountButton(provider);

    // 送り先として: このタブ宛てのプロンプトがあれば送信する
    const claimed = await claimWithRetry();
    if (claimed) {
      try {
        await provider.submitPrompt(claimed.prompt);
      } catch (e) {
        console.error('[second-take] 送信に失敗しました', e);
        alert(`second-take: ${provider.name}への自動送信に失敗しました`);
      }
    }
  },
});

/**
 * background がまだ起動していないと "Receiving end does not exist" になるので、
 * 少し待って何度か試す。最後まで繋がらなければ「宛先なし」として扱う。
 */
async function claimWithRetry(times = 5): Promise<ClaimResponse> {
  for (let i = 0; i < times; i++) {
    try {
      return await sendMessage<ClaimResponse>({ type: 'claim' });
    } catch (e) {
      if (i === times - 1) {
        console.warn('[second-take] background に接続できませんでした', e);
        return null;
      }
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  return null;
}

async function mountButton(source: Provider) {
  const target = getProvider(await getTargetFor(source.id));

  // サイトのCSSと干渉しないよう Shadow DOM の中に置く。
  // 画面右下に固定表示するので、サイトのレイアウト変更やSPA遷移の影響を受けにくい。
  const host = document.createElement('div');
  host.id = 'second-take-root';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      button {
        position: fixed; right: 20px; bottom: 96px; z-index: 2147483647;
        padding: 8px 14px; border: none; border-radius: 999px;
        background: #1f2937; color: #fff; font: 600 13px system-ui, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,.25); cursor: pointer; opacity: .85;
      }
      button:hover { opacity: 1; }
      button:disabled { opacity: .5; cursor: default; }
    </style>
    <button type="button">${target.name}に聞き直す</button>
  `;
  const button = shadow.querySelector('button')!;

  button.addEventListener('click', async () => {
    const messages = source.extractConversation();
    if (messages.length === 0) {
      alert('second-take: 会話が見つかりませんでした');
      return;
    }
    button.disabled = true;
    try {
      await sendMessage({
        type: 'handoff',
        target: target.id,
        prompt: buildPrompt(source.name, messages),
      });
    } catch (e) {
      console.error('[second-take] 引き継ぎに失敗しました', e);
      alert(
        `second-take: ${target.name}への引き継ぎに失敗しました。\n` +
          '拡張機能を再読み込みした場合は、このページも再読み込みしてください。',
      );
    } finally {
      button.disabled = false;
    }
  });

  document.body.append(host);
}
