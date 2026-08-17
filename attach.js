/* MDC AI STUDIO - file attachments overlay */
(function () {
  'use strict';
  if (window.__mdcAttach) return;
  window.__mdcAttach = true;

  var MAX = 4, MAX_BYTES = 5 * 1024 * 1024;
  var pending = [];
  var TEXT_EXTS = {txt:1,md:1,json:1,csv:1,js:1,ts:1,py:1,html:1,css:1,xml:1,yaml:1,yml:1,log:1,svg:1,sql:1,sh:1};

  function $(s) { return document.querySelector(s); }
  var inputArea = $('#input-area') || $('.bg-gray-900.rounded-2xl');
  var userInput = $('#user-input');
  var btnSend = $('#btn-send');
  if (!userInput || !btnSend) return;

  // Build UI
  var preview = document.createElement('div');
  preview.id = 'attach-preview';
  preview.className = 'hidden flex flex-wrap gap-2 mb-2';
  var wrap = userInput.closest('.max-w-3xl') || userInput.parentElement.parentElement;
  if (wrap) wrap.insertBefore(preview, wrap.firstChild);

  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = 'image/*,.txt,.md,.json,.csv,.js,.ts,.py,.html,.css,.xml,.yaml,.yml,.log';
  fileInput.className = 'hidden';
  fileInput.id = 'file-input';
  document.body.appendChild(fileInput);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'btn-attach';
  btn.title = 'Attach file';
  btn.className = 'm-1.5 p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition shrink-0';
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';

  var row = userInput.parentElement;
  if (row) row.insertBefore(btn, userInput);

  function readDataURL(f) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }
  function readText(f) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = rej;
      r.readAsText(f);
    });
  }
  function ext(n) {
    var i = n.lastIndexOf('.');
    return i >= 0 ? n.slice(i + 1).toLowerCase() : '';
  }

  async function processFiles(list) {
    var files = Array.from(list || []);
    for (var i = 0; i < files.length; i++) {
      if (pending.length >= MAX) { alert('Max 4 files'); break; }
      var f = files[i];
      if (f.size > MAX_BYTES) { alert('Too large (max 5MB): ' + f.name); continue; }
      var e = ext(f.name);
      if ((f.type || '').indexOf('image/') === 0) {
        pending.push({ id: 'a' + Date.now() + i, name: f.name, kind: 'image', data: await readDataURL(f) });
      } else if (TEXT_EXTS[e] || (f.type || '').indexOf('text/') === 0 || f.type === 'application/json') {
        var t = await readText(f);
        if (t.length > 120000) t = t.slice(0, 120000) + '\n…';
        pending.push({ id: 'a' + Date.now() + i, name: f.name, kind: 'text', data: t });
      } else {
        alert('Unsupported: ' + f.name);
      }
    }
    renderPreview();
    fileInput.value = '';
  }

  function renderPreview() {
    if (!pending.length) {
      preview.classList.add('hidden');
      preview.innerHTML = '';
      return;
    }
    preview.classList.remove('hidden');
    preview.innerHTML = pending.map(function (a) {
      if (a.kind === 'image') {
        return '<div class="relative inline-block"><img src="' + a.data + '" class="w-14 h-14 object-cover rounded-lg border border-gray-700"/><button data-rm="' + a.id + '" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-700 text-xs">×</button></div>';
      }
      return '<div class="relative inline-flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs"><span class="truncate max-w-[120px]">' + a.name.replace(/</g,'&lt;') + '</span><button data-rm="' + a.id + '">×</button></div>';
    }).join('');
    preview.querySelectorAll('[data-rm]').forEach(function (b) {
      b.onclick = function () {
        pending = pending.filter(function (x) { return x.id !== b.getAttribute('data-rm'); });
        renderPreview();
      };
    });
  }

  btn.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function (e) { processFiles(e.target.files); });

  // Drag drop on input row
  if (row) {
    row.addEventListener('dragover', function (e) { e.preventDefault(); row.style.outline = '2px dashed #8b5cf6'; });
    row.addEventListener('dragleave', function () { row.style.outline = ''; });
    row.addEventListener('drop', function (e) {
      e.preventDefault();
      row.style.outline = '';
      if (e.dataTransfer && e.dataTransfer.files) processFiles(e.dataTransfer.files);
    });
  }

  // Paste images
  userInput.addEventListener('paste', function (e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    var files = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image/') === 0) {
        var f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) { e.preventDefault(); processFiles(files); }
  });

  // Intercept send: prepend file contents / store images for multimodal
  var origClick = btnSend.onclick;
  function buildExtraText() {
    var extra = '';
    pending.forEach(function (a) {
      if (a.kind === 'text') extra += '\n\n--- ' + a.name + ' ---\n' + a.data;
    });
    return extra;
  }

  // Hook: before Enter/send, inject text file content into the textarea
  function injectBeforeSend() {
    var extra = buildExtraText();
    var imgs = pending.filter(function (a) { return a.kind === 'image'; });
    if (extra) {
      userInput.value = (userInput.value || '') + extra;
      userInput.dispatchEvent(new Event('input'));
    }
    // For images: append a note; full vision needs core support
    if (imgs.length) {
      var note = imgs.map(function (a) { return '[Image: ' + a.name + ']'; }).join(' ');
      userInput.value = (userInput.value ? userInput.value + '\n' : '') + note;
      // Store for potential future use
      window.__mdcPendingImages = imgs;
    }
    pending = [];
    renderPreview();
  }

  btnSend.addEventListener('click', function () {
    if (pending.length) injectBeforeSend();
  }, true);

  userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && pending.length) {
      injectBeforeSend();
    }
  }, true);

  console.log('[MDC] File attach ready');
})();
