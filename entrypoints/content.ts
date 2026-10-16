export default defineContentScript({
  matches: ['https://chatgpt.com/*', 'https://claude.ai/*'],
  main() {
    console.log('[second-take] loaded on', location.host);
  },
});