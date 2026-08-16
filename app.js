/* MDC AI STUDIO - Client-side BYOK Chat + i18n + mobile fixes */
(function () {
  'use strict';

  // ---------- i18n ----------
  const I18N = {
    en: {
      newChat: 'New chat',
      settings: 'Settings',
      keysLocalOnly: 'Keys stay in your browser',
      inputPlaceholder: 'Type a message... (Enter to send)',
      footerNote: 'API keys stay only in your browser • MDC AI STUDIO',
      language: 'Language',
      provider: 'Provider',
      apiKey: 'API Key',
      keyHint: 'Key is stored only in your browser (localStorage).',
      model: 'Model',
      systemPrompt: 'System Prompt (optional)',
      systemPlaceholder: 'You are a helpful assistant...',
      securityTitle: 'Security note:',
      securityBody: ' Your API key is sent only to the provider you choose. No third-party server is used. Some providers may block browser requests due to CORS.',
      clearKeys: 'Clear keys',
      save: 'Save',
      modelNotSelected: 'No model selected',
      addKeyFromSettings: 'Add API key in Settings',
      keySaved: 'Key saved',
      noKey: 'No key',
      emptyTitle: 'MDC AI STUDIO',
      emptyDesc: 'Add your own API key and chat with any model. Keys never leave your browser.',
      newChatTitle: 'New chat',
      deleteConfirm: 'Delete this chat?',
      clearConfirm: 'All API keys and settings will be cleared. Continue?',
      needKey: 'Please add an API key in Settings first.',
      needModel: 'Please select or type a model.',
      baseUrlMissing: 'Base URL is not set.',
      emptyReply: '(empty reply)',
      stopped: '*[Stopped]*',
      errorHint: '**Tip:** This may be a CORS block. Try OpenRouter or Groq, or use your own proxy.',
      errorPrefix: 'Error:',
      custom: 'Custom',
      delete: 'Delete'
    },
    tr: {
      newChat: 'Yeni sohbet',
      settings: 'Ayarlar',
      keysLocalOnly: 'Anahtarlar sadece tarayıcıda',
      inputPlaceholder: 'Mesajınızı yazın... (Enter gönder)',
      footerNote: 'API anahtarları sadece tarayıcınızda saklanır • MDC AI STUDIO',
      language: 'Dil',
      provider: 'Sağlayıcı',
      apiKey: 'API Anahtarı',
      keyHint: 'Anahtar sadece tarayıcınızda (localStorage) saklanır.',
      model: 'Model',
      systemPrompt: 'Sistem Promptu (opsiyonel)',
      systemPlaceholder: 'Sen yardımcı bir asistansın...',
      securityTitle: 'Güvenlik notu:',
      securityBody: ' API anahtarınız yalnızca seçtiğiniz sağlayıcıya gönderilir. Üçüncü taraf sunucu kullanılmaz. Bazı sağlayıcılar CORS nedeniyle tarayıcı isteklerini engelleyebilir.',
      clearKeys: 'Anahtarları temizle',
      save: 'Kaydet',
      modelNotSelected: 'Model seçilmedi',
      addKeyFromSettings: 'Ayarlardan API anahtarı ekleyin',
      keySaved: 'Anahtar kayıtlı',
      noKey: 'Anahtar yok',
      emptyTitle: 'MDC AI STUDIO',
      emptyDesc: 'Kendi API anahtarınızı ekleyip istediğiniz modelle sohbet edin. Anahtarlar tarayıcınızdan çıkmaz.',
      newChatTitle: 'Yeni sohbet',
      deleteConfirm: 'Bu sohbeti silmek istediğinize emin misiniz?',
      clearConfirm: 'Tüm API anahtarları ve ayarlar silinecek. Emin misiniz?',
      needKey: 'Lütfen önce Ayarlar\'dan bir API anahtarı ekleyin.',
      needModel: 'Lütfen bir model seçin veya yazın.',
      baseUrlMissing: 'Base URL tanımlı değil.',
      emptyReply: '(boş yanıt)',
      stopped: '*[Durduruldu]*',
      errorHint: '**İpucu:** CORS engeli olabilir. OpenRouter veya Groq deneyin, ya da kendi proxy\'nizi kullanın.',
      errorPrefix: 'Hata:',
      custom: 'Özel',
      delete: 'Sil'
    }
  };

  let lang = 'en';
  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.setAttribute('title', t(key));
    });
    document.documentElement.lang = lang;
    updateHeader();
    renderChatList();
    renderMessages();
  }

  // Country → language (extendable)
  const COUNTRY_LANG = {
    TR: 'tr', CY: 'tr',
    // default everything else → en
  };

  async function detectLangFromCountry() {
    // 1) Saved preference wins
    const saved = settings.langPref;
    if (saved && saved !== 'auto' && I18N[saved]) return saved;

    // 2) Browser language
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (nav.startsWith('tr')) return 'tr';

    // 3) Timezone hint (no network)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz === 'Europe/Istanbul' || tz === 'Asia/Istanbul') return 'tr';
    } catch (_) {}

    // 4) IP country (best-effort, short timeout)
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const code = (data.country_code || data.country || '').toUpperCase();
        if (COUNTRY_LANG[code]) return COUNTRY_LANG[code];
      }
    } catch (_) {}

    return 'en';
  }

  // ---------- Providers ----------
  const PROVIDERS = {
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini', 'o4-mini']
    },
    groq: {
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-4-scout-17b-16e-instruct', 'qwen/qwen3-32b', 'openai/gpt-oss-120b']
    },
    openrouter: {
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      models: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-flash', 'deepseek/deepseek-chat', 'x-ai/grok-3']
    },
    deepseek: {
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com',
      models: ['deepseek-chat', 'deepseek-reasoner']
    },
    xai: {
      name: 'xAI',
      baseUrl: 'https://api.x.ai/v1',
      models: ['grok-3', 'grok-3-mini', 'grok-2']
    },
    custom: {
      nameKey: 'custom',
      baseUrl: '',
      models: []
    }
  };

  const STORAGE_KEYS = {
    settings: 'mdc_ai_settings',
    chats: 'mdc_ai_chats',
    activeChat: 'mdc_ai_active_chat'
  };

  // ---------- State ----------
  let settings = loadSettings();
  let chats = loadChats();
  let activeChatId = localStorage.getItem(STORAGE_KEYS.activeChat) || null;
  let isGenerating = false;
  let abortController = null;

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const chatContainer = $('#chat-container');
  const chatList = $('#chat-list');
  const userInput = $('#user-input');
  const btnSend = $('#btn-send');
  const settingsModal = $('#settings-modal');
  const providerSelect = $('#provider-select');
  const apiKeyInput = $('#api-key-input');
  const modelInput = $('#model-input');
  const modelList = $('#model-list');
  const systemPrompt = $('#system-prompt');
  const customBaseUrlWrap = $('#custom-base-url-wrap');
  const customBaseUrl = $('#custom-base-url');
  const currentModelLabel = $('#current-model-label');
  const currentProviderLabel = $('#current-provider-label');
  const langSelect = $('#lang-select');
  const sidebar = $('#sidebar');
  const sidebarOverlay = $('#sidebar-overlay');

  // ---------- Init ----------
  async function init() {
    marked.setOptions({ breaks: true, gfm: true });
    lang = await detectLangFromCountry();
    applyI18n();

    renderChatList();
    if (!activeChatId || !chats[activeChatId]) {
      createNewChat();
    } else {
      renderMessages();
    }
    updateHeader();
    bindEvents();
    autoResizeTextarea();
  }

  // ---------- Storage ----------
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.settings);
      const def = {
        provider: 'openrouter',
        apiKey: '',
        model: 'openai/gpt-4o-mini',
        systemPrompt: '',
        customBaseUrl: '',
        langPref: 'auto'
      };
      return raw ? { ...def, ...JSON.parse(raw) } : def;
    } catch {
      return { provider: 'openrouter', apiKey: '', model: '', systemPrompt: '', customBaseUrl: '', langPref: 'auto' };
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  function loadChats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.chats);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveChats() {
    localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chats));
  }

  // ---------- Sidebar mobile ----------
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  function toggleSidebar() {
    if (sidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
  }

  // ---------- Chat Management ----------
  function createNewChat() {
    const id = 'chat_' + Date.now();
    chats[id] = {
      id,
      title: t('newChatTitle'),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    activeChatId = id;
    localStorage.setItem(STORAGE_KEYS.activeChat, id);
    saveChats();
    renderChatList();
    renderMessages();
    closeSidebar();
    userInput.focus();
  }

  function deleteChat(id) {
    if (!confirm(t('deleteConfirm'))) return;
    delete chats[id];
    if (activeChatId === id) {
      const remaining = Object.keys(chats);
      if (remaining.length) {
        activeChatId = remaining[0];
        localStorage.setItem(STORAGE_KEYS.activeChat, activeChatId);
      } else {
        createNewChat();
        return;
      }
    }
    saveChats();
    renderChatList();
    renderMessages();
  }

  function setActiveChat(id) {
    activeChatId = id;
    localStorage.setItem(STORAGE_KEYS.activeChat, id);
    renderChatList();
    renderMessages();
    closeSidebar();
  }

  // ---------- Render ----------
  function renderChatList() {
    const sorted = Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt);
    chatList.innerHTML = sorted.map(chat => `
      <div class="group flex items-center gap-1 rounded-lg px-2.5 py-2.5 cursor-pointer transition touch-manipulation ${chat.id === activeChatId ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/60 text-gray-400'}" data-id="${chat.id}">
        <span class="flex-1 text-sm truncate">${escapeHtml(chat.title)}</span>
        <button class="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 hover:text-red-400 delete-chat shrink-0" data-id="${chat.id}" title="${t('delete')}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');

    chatList.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.delete-chat')) return;
        setActiveChat(el.dataset.id);
      });
    });
    chatList.querySelectorAll('.delete-chat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteChat(btn.dataset.id);
      });
    });
  }

  function renderMessages() {
    const chat = chats[activeChatId];
    if (!chat || !chat.messages.length) {
      chatContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center px-4 py-8">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-brand-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </div>
          <h2 class="text-lg sm:text-xl font-semibold text-gray-200 mb-2">${t('emptyTitle')}</h2>
          <p class="text-gray-500 text-sm max-w-sm leading-relaxed">${t('emptyDesc')}</p>
        </div>
      `;
      return;
    }

    chatContainer.innerHTML = chat.messages.map((msg) => {
      if (msg.role === 'user') {
        return `
          <div class="flex justify-end">
            <div class="message-user max-w-[88%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm text-white break-words">
              ${escapeHtml(msg.content).replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      } else {
        const html = marked.parse(msg.content || '');
        return `
          <div class="flex justify-start">
            <div class="max-w-[92%] sm:max-w-[85%] md:max-w-[80%] bg-gray-900 border border-gray-800 rounded-2xl rounded-bl-md px-3.5 py-3 text-sm prose prose-invert prose-sm max-w-none break-words overflow-hidden">
              ${html}
            </div>
          </div>
        `;
      }
    }).join('');

    chatContainer.querySelectorAll('pre code').forEach((block) => {
      try { hljs.highlightElement(block); } catch (_) {}
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function updateHeader() {
    const p = PROVIDERS[settings.provider] || PROVIDERS.custom;
    const name = p.nameKey ? t(p.nameKey) : p.name;
    const keyStatus = settings.apiKey ? t('keySaved') : t('noKey');
    currentProviderLabel.textContent = name + ' • ' + keyStatus;
    currentModelLabel.textContent = settings.model || t('modelNotSelected');
  }

  // ---------- Settings UI ----------
  function openSettings() {
    providerSelect.value = settings.provider || 'openrouter';
    apiKeyInput.value = settings.apiKey || '';
    modelInput.value = settings.model || '';
    systemPrompt.value = settings.systemPrompt || '';
    customBaseUrl.value = settings.customBaseUrl || '';
    langSelect.value = settings.langPref || 'auto';
    toggleCustomUrl();
    fillModelList();
    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('flex');
  }

  function closeSettings() {
    settingsModal.classList.add('hidden');
    settingsModal.classList.remove('flex');
  }

  function toggleCustomUrl() {
    if (providerSelect.value === 'custom') {
      customBaseUrlWrap.classList.remove('hidden');
    } else {
      customBaseUrlWrap.classList.add('hidden');
    }
  }

  function fillModelList() {
    const p = PROVIDERS[providerSelect.value];
    modelList.innerHTML = (p?.models || []).map(m => `<option value="${m}">`).join('');
  }

  async function saveSettingsFromUI() {
    settings.provider = providerSelect.value;
    settings.apiKey = apiKeyInput.value.trim();
    settings.model = modelInput.value.trim();
    settings.systemPrompt = systemPrompt.value.trim();
    settings.customBaseUrl = customBaseUrl.value.trim();
    settings.langPref = langSelect.value;
    saveSettings();

    if (settings.langPref === 'auto') {
      lang = await detectLangFromCountry();
    } else {
      lang = settings.langPref;
    }
    applyI18n();
    closeSettings();
  }

  function clearKeys() {
    if (!confirm(t('clearConfirm'))) return;
    settings.apiKey = '';
    settings.model = '';
    settings.systemPrompt = '';
    settings.customBaseUrl = '';
    saveSettings();
    apiKeyInput.value = '';
    modelInput.value = '';
    systemPrompt.value = '';
    customBaseUrl.value = '';
    updateHeader();
  }

  // ---------- API Call ----------
  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || isGenerating) return;

    if (!settings.apiKey) {
      alert(t('needKey'));
      openSettings();
      return;
    }
    if (!settings.model) {
      alert(t('needModel'));
      openSettings();
      return;
    }

    const chat = chats[activeChatId];
    chat.messages.push({ role: 'user', content: text });
    if (chat.title === t('newChatTitle') || chat.title === 'Yeni sohbet' || chat.title === 'New chat') {
      chat.title = text.slice(0, 36) + (text.length > 36 ? '…' : '');
    }
    chat.updatedAt = Date.now();
    saveChats();
    renderChatList();
    renderMessages();

    userInput.value = '';
    autoResizeTextarea();
    isGenerating = true;
    btnSend.disabled = true;

    chat.messages.push({ role: 'assistant', content: '' });
    renderMessages();

    const messagesForApi = [];
    if (settings.systemPrompt) {
      messagesForApi.push({ role: 'system', content: settings.systemPrompt });
    }
    const history = chat.messages.slice(0, -1);
    history.forEach(m => messagesForApi.push({ role: m.role, content: m.content }));

    const baseUrl = settings.provider === 'custom'
      ? (settings.customBaseUrl || '').replace(/\/$/, '')
      : (PROVIDERS[settings.provider]?.baseUrl || '');

    if (!baseUrl) {
      appendError(t('baseUrlMissing'));
      return;
    }

    abortController = new AbortController();

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      };
      if (settings.provider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'MDC AI STUDIO';
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: settings.model,
          messages: messagesForApi,
          stream: true,
          temperature: 0.7
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 280)}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              chat.messages[chat.messages.length - 1].content = fullContent;
              updateLastAssistantMessage(fullContent);
            }
          } catch (_) {}
        }
      }

      chat.messages[chat.messages.length - 1].content = fullContent || t('emptyReply');
      chat.updatedAt = Date.now();
      saveChats();
      renderMessages();

    } catch (err) {
      if (err.name === 'AbortError') {
        chat.messages[chat.messages.length - 1].content += '\n\n' + t('stopped');
      } else {
        const msg = err.message || String(err);
        chat.messages[chat.messages.length - 1].content =
          `❌ ${t('errorPrefix')} ${msg}\n\n${t('errorHint')}`;
      }
      saveChats();
      renderMessages();
    } finally {
      isGenerating = false;
      btnSend.disabled = false;
      abortController = null;
      userInput.focus();
    }
  }

  function updateLastAssistantMessage(content) {
    const last = chatContainer.lastElementChild;
    if (!last) return;
    const bubble = last.querySelector('.prose');
    if (bubble) {
      bubble.innerHTML = marked.parse(content);
      bubble.querySelectorAll('pre code').forEach(b => {
        try { hljs.highlightElement(b); } catch (_) {}
      });
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  function appendError(msg) {
    const chat = chats[activeChatId];
    chat.messages[chat.messages.length - 1].content = `❌ ${msg}`;
    saveChats();
    renderMessages();
    isGenerating = false;
    btnSend.disabled = false;
  }

  // ---------- Helpers ----------
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 128) + 'px';
  }

  // ---------- Events ----------
  function bindEvents() {
    btnSend.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    userInput.addEventListener('input', autoResizeTextarea);

    $('#btn-new-chat').addEventListener('click', createNewChat);
    $('#btn-settings').addEventListener('click', openSettings);
    $('#btn-close-settings').addEventListener('click', closeSettings);
    $('#btn-save-settings').addEventListener('click', saveSettingsFromUI);
    $('#btn-clear-keys').addEventListener('click', clearKeys);
    providerSelect.addEventListener('change', () => {
      toggleCustomUrl();
      fillModelList();
      const p = PROVIDERS[providerSelect.value];
      if (p && p.models.length && !modelInput.value) {
        modelInput.value = p.models[0];
      }
    });

    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettings();
    });

    $('#btn-toggle-sidebar')?.addEventListener('click', toggleSidebar);
    $('#btn-close-sidebar')?.addEventListener('click', closeSidebar);
    sidebarOverlay?.addEventListener('click', closeSidebar);

    // Close sidebar on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
        closeSettings();
      }
    });
  }

  init();
})();
