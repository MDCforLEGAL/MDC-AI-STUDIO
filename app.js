/* MDC AI STUDIO - Client-side BYOK Chat */
(function () {
  'use strict';

  // ---------- Constants ----------
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
      name: 'Özel',
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

  // ---------- Init ----------
  function init() {
    marked.setOptions({ breaks: true, gfm: true });
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
      return raw ? JSON.parse(raw) : {
        provider: 'openrouter',
        apiKey: '',
        model: 'openai/gpt-4o-mini',
        systemPrompt: '',
        customBaseUrl: ''
      };
    } catch {
      return { provider: 'openrouter', apiKey: '', model: '', systemPrompt: '', customBaseUrl: '' };
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

  // ---------- Chat Management ----------
  function createNewChat() {
    const id = 'chat_' + Date.now();
    chats[id] = {
      id,
      title: 'Yeni Sohbet',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    activeChatId = id;
    localStorage.setItem(STORAGE_KEYS.activeChat, id);
    saveChats();
    renderChatList();
    renderMessages();
    userInput.focus();
  }

  function deleteChat(id) {
    if (!confirm('Bu sohbeti silmek istediğinize emin misiniz?')) return;
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
  }

  // ---------- Render ----------
  function renderChatList() {
    const sorted = Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt);
    chatList.innerHTML = sorted.map(chat => `
      <div class="group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition ${chat.id === activeChatId ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/60 text-gray-400'}" data-id="${chat.id}">
        <span class="flex-1 text-sm truncate">${escapeHtml(chat.title)}</span>
        <button class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 delete-chat" data-id="${chat.id}" title="Sil">
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
        <div class="flex flex-col items-center justify-center h-full text-center px-4">
          <div class="w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-brand-400"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4h-2V7h2z"/></svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-200 mb-2">MDC AI STUDIO</h2>
          <p class="text-gray-500 text-sm max-w-md">Kendi API anahtarınızı ekleyip istediğiniz modelle sohbet edin. Anahtarlar yalnızca tarayıcınızda saklanır.</p>
        </div>
      `;
      return;
    }

    chatContainer.innerHTML = chat.messages.map((msg, idx) => {
      if (msg.role === 'user') {
        return `
          <div class="flex justify-end">
            <div class="message-user max-w-[85%] md:max-w-[70%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white">
              ${escapeHtml(msg.content).replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      } else {
        const html = marked.parse(msg.content || '');
        return `
          <div class="flex justify-start">
            <div class="max-w-[90%] md:max-w-[80%] bg-gray-900 border border-gray-800 rounded-2xl rounded-bl-md px-4 py-3 text-sm prose prose-invert prose-sm max-w-none">
              ${html}
            </div>
          </div>
        `;
      }
    }).join('');

    // Highlight code blocks
    chatContainer.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function updateHeader() {
    const p = PROVIDERS[settings.provider] || PROVIDERS.custom;
    currentProviderLabel.textContent = p.name + (settings.apiKey ? ' • Anahtar kayıtlı' : ' • Anahtar yok');
    currentModelLabel.textContent = settings.model || 'Model seçilmedi';
  }

  // ---------- Settings UI ----------
  function openSettings() {
    providerSelect.value = settings.provider || 'openrouter';
    apiKeyInput.value = settings.apiKey || '';
    modelInput.value = settings.model || '';
    systemPrompt.value = settings.systemPrompt || '';
    customBaseUrl.value = settings.customBaseUrl || '';
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

  function saveSettingsFromUI() {
    settings.provider = providerSelect.value;
    settings.apiKey = apiKeyInput.value.trim();
    settings.model = modelInput.value.trim();
    settings.systemPrompt = systemPrompt.value.trim();
    settings.customBaseUrl = customBaseUrl.value.trim();
    saveSettings();
    updateHeader();
    closeSettings();
  }

  function clearKeys() {
    if (!confirm('Tüm API anahtarları ve ayarlar silinecek. Emin misiniz?')) return;
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
      alert('Lütfen önce Ayarlar\'dan bir API anahtarı ekleyin.');
      openSettings();
      return;
    }
    if (!settings.model) {
      alert('Lütfen bir model seçin veya yazın.');
      openSettings();
      return;
    }

    const chat = chats[activeChatId];
    chat.messages.push({ role: 'user', content: text });
    if (chat.title === 'Yeni Sohbet') {
      chat.title = text.slice(0, 40) + (text.length > 40 ? '…' : '');
    }
    chat.updatedAt = Date.now();
    saveChats();
    renderChatList();
    renderMessages();

    userInput.value = '';
    autoResizeTextarea();
    isGenerating = true;
    btnSend.disabled = true;

    // Placeholder for assistant
    chat.messages.push({ role: 'assistant', content: '' });
    renderMessages();

    const messagesForApi = [];
    if (settings.systemPrompt) {
      messagesForApi.push({ role: 'system', content: settings.systemPrompt });
    }
    // All previous messages except the empty assistant we just added
    const history = chat.messages.slice(0, -1);
    history.forEach(m => messagesForApi.push({ role: m.role, content: m.content }));

    const baseUrl = settings.provider === 'custom'
      ? settings.customBaseUrl.replace(/\/$/, '')
      : (PROVIDERS[settings.provider]?.baseUrl || '');

    if (!baseUrl) {
      appendError('Base URL tanımlı değil.');
      return;
    }

    abortController = new AbortController();

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      };

      // OpenRouter extras
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
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 300)}`);
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
              // Lightweight update
              updateLastAssistantMessage(fullContent);
            }
          } catch (_) {}
        }
      }

      chat.messages[chat.messages.length - 1].content = fullContent || '(boş yanıt)';
      chat.updatedAt = Date.now();
      saveChats();
      renderMessages();

    } catch (err) {
      if (err.name === 'AbortError') {
        chat.messages[chat.messages.length - 1].content += '\n\n*[Durduruldu]*';
      } else {
        const msg = err.message || String(err);
        chat.messages[chat.messages.length - 1].content = `❌ Hata: ${msg}\n\n**İpucu:** CORS engeli olabilir. OpenRouter veya Groq deneyin, ya da kendi proxy'nizi kullanın.`;
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
      bubble.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
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
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
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

    // Mobile sidebar toggle
    const sidebar = $('#sidebar');
    $('#btn-toggle-sidebar')?.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
    });
  }

  // Start
  init();
})();
