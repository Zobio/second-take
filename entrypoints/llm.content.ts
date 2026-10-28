import { providers, detectProvider, type Provider } from '@/providers';
import { actions, type Action } from '@/actions';
import { getTargetsFor, getLastTarget, setLastTarget } from '@/utils/settings';
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

    await mountButton(provider);

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

/**
 * 右下のボタンとメニュー。
 *   ① 指示を選ぶ（actions/ の一覧）
 *   ② 送り先を選ぶ（指示が入力欄を持つなら、ここに補足の入力欄も出す）
 * 指示・送り先のどちらが増えても、定義から自動で組み立てる。
 */
async function mountButton(source: Provider) {
  const host = document.createElement('div');
  host.id = 'second-take-root';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      .wrap {
        position: fixed; right: 20px; bottom: 96px; z-index: 2147483647;
        display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
        font: 600 13px system-ui, sans-serif;
      }
      button {
        padding: 8px 14px; border: none; border-radius: 999px;
        background: #1f2937; color: #fff; font: inherit;
        box-shadow: 0 2px 8px rgba(0,0,0,.25); cursor: pointer; opacity: .85;
      }
      button:hover { opacity: 1; }
      button:disabled { opacity: .5; cursor: default; }
      .menu { display: none; flex-direction: column; align-items: flex-end; gap: 6px; }
      .menu.open { display: flex; }
      .menu button { background: #fff; color: #1f2937; border: 1px solid #d1d5db; }
      .menu .back { background: transparent; box-shadow: none; border: none; color: #6b7280; padding: 4px 8px; }
      .title { color: #374151; padding: 0 4px; text-shadow: 0 0 4px #fff; }
      input {
        width: 260px; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 10px;
        font: 400 13px system-ui, sans-serif; color: #111827; background: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,.15); outline: none;
      }
      input:focus { border-color: #6b7280; }
    </style>
    <div class="wrap">
      <div class="menu"></div>
      <button type="button" class="toggle">別のAIに頼む ▴</button>
    </div>
  `;
  const toggle = shadow.querySelector<HTMLButtonElement>('.toggle')!;
  const menu = shadow.querySelector<HTMLDivElement>('.menu')!;

  const close = () => menu.classList.remove('open');

  const makeButton = (text: string, onClick: () => void, className?: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    if (className) b.className = className;
    b.addEventListener('click', onClick);
    return b;
  };

  const showActions = () => {
    menu.replaceChildren(...actions.map((a) => makeButton(a.label, () => showTargets(a))));
  };

  const showTargets = async (action: Action) => {
    const targets = await getTargetsFor(source.id, action);
    const children: HTMLElement[] = [];

    let input: HTMLInputElement | undefined;
    if (action.input) {
      input = document.createElement('input');
      input.type = 'text';
      input.placeholder = action.input.placeholder;
      isolateKeyboard(input);
      children.push(input);
    }

    const run = (target: Provider) => {
      close();
      setLastTarget(action.id, target.id);
      handoff(source, target, action, input?.value.trim() ?? '', toggle);
    };

    for (const t of targets) children.push(makeButton(action.targetLabel(t), () => run(t)));

    children.push(makeButton(`← ${action.label}`, showActions, 'back'));
    menu.replaceChildren(...children);

    if (input) {
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Escape') return close();
        if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
        e.preventDefault();
        const lastId = await getLastTarget(action.id);
        const target = targets.find((t) => t.id === lastId) ?? targets[0];
        if (target) run(target);
      });
      input.focus();
    }
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.classList.contains('open')) return close();
    showActions();
    menu.classList.add('open');
  });
  document.addEventListener('click', (e) => {
    if (!e.composedPath().includes(host)) close();
  });

  document.body.append(host);
}

function isolateKeyboard(el: HTMLElement) {
  for (const type of ['keydown', 'keyup', 'keypress', 'beforeinput', 'input', 'paste']) {
    el.addEventListener(type, (e) => e.stopPropagation());
  }
}

async function handoff(
  source: Provider,
  target: Provider,
  action: Action,
  note: string,
  button: HTMLButtonElement,
) {
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
      prompt: action.buildPrompt({ sourceName: source.name, messages, note }),
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
}
