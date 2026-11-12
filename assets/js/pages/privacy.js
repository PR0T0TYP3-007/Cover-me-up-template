/* Privacy notice — readable before consent, so back goes to wherever the user came from. */
(function () {
  if (!CM.boot()) return;
  if (!CM.store.consent()) CM.$('#topbar .back').href = 'index.html';
})();
