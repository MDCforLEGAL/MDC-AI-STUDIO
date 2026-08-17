/* MDC AI STUDIO - bootstrap */
(function () {
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/gh/MDCforLEGAL/MDC-AI-STUDIO@9cc8c27b8e563bdd684af802b3794c12c0c0d340/app.js';
  s.onload = function () {
    var s2 = document.createElement('script');
    s2.src = 'attach.js?v=3';
    document.head.appendChild(s2);
  };
  s.onerror = function () {
    document.body.innerHTML = '<pre style="color:#f88;padding:2rem">Failed to load core app.</pre>';
  };
  document.head.appendChild(s);
})();
