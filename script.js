(function () {
  var supportsDvh = CSS && CSS.supports && CSS.supports('height', '100dvh');

  function setViewportHeight() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh100', (vh * 100) + 'px');
  }

  if (!supportsDvh) {
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
  }
})();