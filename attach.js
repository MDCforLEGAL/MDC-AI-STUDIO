/* MDC AI STUDIO - file attachments */
(function () {
  'use strict';
  if (window.__mdcAttach) return;
  window.__mdcAttach = true;

  var MAX = 4, MAX_BYTES = 5 * 1024 * 1024;
  var pending = [];
  var TEXT_EXTS = {txt:1,md:1,json:1,csv:1,js:1,ts:1,jsx:1,tsx:1,py:1,html:1,css:1,xml:1,yaml:1,yml:1,log:1,svg:1,sql:1,sh:1,env:1,c:1,cpp:1,java:1,go:1,rs:1,rb:1,php:1};

  function $(s) { return document.querySelector(s); }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Wait for core app to mount
  setTimeout(init, 600);

  function init() {
    var userInput = $('#user-input');
    var btnSend = $('#btn-send');
    if (!userInput || !btnSend) {
      setTimeout(init, 400);
      return;
    }

    var preview = $('#attach-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'attach-preview';
      preview.className = 'hidden flex flex-wrap gap-2 mb-2';
      var wrap = userInput.closest('.max-w-3xl');
      if (wrap) wrap.insertBefore(preview, wrap.firstChild);
    }

    var fileInput = $('#file-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'file-input';
      fileInput.multiple = true;
      fileInput.accept = 'image/*,.txt,.md,.json,.csv,.js,.ts,.py,.html,.css,.xml,.yaml,.yml,.log';
      fileInput.className = 'hidden';
      document.body.appendChild(fileInput);
    }

    var btn = $('#btn-attach');
    var row = userInput.parentElement;
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'btn-attach';
      btn.title = 'Attach file / Dosya ekle';
      btn.className = 'm-1.5 p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition shrink-0';
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
      if (row) row.insertBefore(btn, userInput);
    }

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
        if (pending.length >= MAX) { alert('Max 4 files / En fazla 4 dosya'); break; }
        var f = files[i];
        if (f.size > MAX_BYTES) { alert('Max 5MB: ' + f.name); continue; }
        var e = ext(f.name);
        if ((f.type || '').indexOf('image/') === 0) {
          pending.push({ id: 'a' + Date.now() + i, name: f.name, kind: 'image', data: await readDataURL(f) });
        } else if (TEXT_EXTS[e] || (f.type || '').indexOf('text/') === 0 || f.type === 'application/json') {
          var t = await readText(f);
          if (t.length > 120000) t = t.slice(0, 120000) + '\n…[truncated]';
          pending.push({ id: 'a' + Date.now() + i, name: f.name, kind: 'text', data: t });
        } else {
          alert('Unsupported / Desteklenmiyor: ' + f.name);
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
          return '<div class="relative inline-block mr-1 mb-1"><img src="' + a.data + '" alt="" class="w-14 h-14 object-cover rounded-lg border border-gray-700"/><button type="button" data-rm="' + a.id + '" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 hover:bg-red-600 text-white text-xs leading-none">×</button><div class="text-[10px] text-gray-500 truncate max-w-[56px]">' + a.name.replace(/</g,'&lt;') + '</div></div>';
        }
        return '<div class="relative inline-flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs mr-1 mb-1"><span class="truncate max-w-[140px]">' + a.name.replace(/</g,'&lt;') + '</span><button type="button" data-rm="' + a.id + '" class="text-gray-400 hover:text-red-400">×</button></div>';
      }).join('');
      preview.querySelectorAll('[data-rm]').forEach(function (b) {
        b.onclick = function () {
          pending = pending.filter(function (x) { return x.id !== b.getAttribute('data-rm'); });
          renderPreview();
        };
      });
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      fileInput.click();
    });
    fileInput.addEventListener('change', function (e) { processFiles(e.target.files); });

    var dropTarget = $('#input-area') || row;
    if (dropTarget) {
      dropTarget.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropTarget.classList.add('drag-over');
      });
      dropTarget.addEventListener('dragleave', function () {
        dropTarget.classList.remove('drag-over');
      });
      dropTarget.addEventListener('drop', function (e) {
        e.preventDefault();
        dropTarget.classList.remove('drag-over');
        if (e.dataTransfer && e.dataTransfer.files) processFiles(e.dataTransfer.files);
      });
    }

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

    function injectBeforeSend() {
      if (!pending.length) return;
      var parts = [];
      pending.forEach(function (a) {
        if (a.kind === 'text') {
          parts.push('--- ' + a.name + ' ---\n' + a.data);
        } else if (a.kind === 'image') {
          // Vision models need multimodal API; for text models we note the attachment.
          // Data URL is available on window.__mdcPendingImages for future core support.
          parts.push('[Attached image: ' + a.name + ']');
        }
      });
      window.__mdcPendingImages = pending.filter(function (a) { return a.kind === 'image'; });
      if (parts.length) {
        var extra = parts.join('\n\n');
        userInput.value = (userInput.value ? userInput.value + '\n\n' : '') + extra;
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      pending = [];
      renderPreview();
    }

    btnSend.addEventListener('click', function () {
      if (pending.length) injectBeforeSend();
    }, true);

    userInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && pending.length) injectBeforeSend();
    }, true);

    console.log('[MDC AI STUDIO] File attachments ready');
  }
})();
