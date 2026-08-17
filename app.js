/* MDC AI STUDIO - bootstrap */
(function () {
  var s = document.createElement('script');
  s.src = 'https://raw.githubusercontent.com/MDCforLEGAL/MDC-AI-STUDIO/9cc8c27b8e563bdd684af802b3794c12c0c0d340/app.js';
  s.crossOrigin = 'anonymous';
  s.onload = function () {
    var s2 = document.createElement('script');
    s2.src = 'attach.js?v=4';
    document.head.appendChild(s2);
  };
  s.onerror = function () {
    // fallback jsDelivr
    var f = document.createElement('script');
    f.src = 'https://cdn.jsdelivr.net/gh/MDCforLEGAL/MDC-AI-STUDIO@9cc8c27b8e563bdd684af802b3794c12c0c0d340/app.js';
    f.onload = function () {
      var s2 = document.createElement('script');
      s2.src = 'attach.js?v=4';
      document.head.appendChild(s2);
    };
    document.head.appendChild(f);
  };
  document.head.appendChild(s);
})();
