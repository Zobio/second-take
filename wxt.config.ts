import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'second-take',
    description: 'LLMの回答を、ワンクリックで別のLLMに聞き直す',
    permissions: ['storage'],
  },
});
