/* MDC AI STUDIO - load */
(async function () {
  try {
    var parts = await Promise.all([0, 1, 2, 3].map(function (i) {
      return fetch('chunk' + i + '.txt?v=2').then(function (r) {
        if (!r.ok) throw new Error('chunk' + i + ' ' + r.status);
        return r.text();
      });
    }));
    var s = document.createElement('script');
    s.text = parts.join('');
    document.head.appendChild(s);
  } catch (e) {
    console.error(e);
    document.body.innerHTML = '<pre style="color:#f88;padding:2rem;font-family:sans-serif">Load error: ' + e + '</pre>';
  }
})();
