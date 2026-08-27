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


(function () {
  var audio = document.getElementById('bg-audio');
  var toggleBtn = document.getElementById('audio-toggle');
  if (!audio) return;

  var TIME_KEY = 'nenebien_audio_time';
  var STATE_KEY = 'nenebien_audio_state';

  function restoreTime() {
    var t = parseFloat(localStorage.getItem(TIME_KEY));
    if (!isNaN(t) && isFinite(t) && t >= 0 && t < (audio.duration || Infinity)) {
      try { audio.currentTime = t; } catch (e) {}
    }
  }

  function saveTime() {
    try { localStorage.setItem(TIME_KEY, String(audio.currentTime)); } catch (e) {}
  }

  function setState(state) {
    try { localStorage.setItem(STATE_KEY, state); } catch (e) {}
  }

  function updateToggleUI(playing) {
    if (!toggleBtn) return;
    toggleBtn.classList.toggle('is-playing', playing);
    toggleBtn.setAttribute('aria-label', playing ? 'Silenciar música' : 'Activar música');
  }

  function armFallback() {
    function resume() {
      restoreTime();
      audio.play().then(function () {
        updateToggleUI(true);
        setState('playing');
      }).catch(function () {});
      document.removeEventListener('click', resume);
      document.removeEventListener('touchend', resume);
    }
    document.addEventListener('click', resume, { once: true });
    document.addEventListener('touchend', resume, { once: true });
  }

  function tryAutoplay() {
    var wantsPlaying = localStorage.getItem(STATE_KEY) !== 'paused'; // por defecto: sonando
    if (!wantsPlaying) {
      updateToggleUI(false);
      return;
    }
    var startPlayback = function () {
      restoreTime();
      var p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(function () { updateToggleUI(true); })
         .catch(function () { updateToggleUI(false); armFallback(); });
      }
    };
    if (audio.readyState >= 1) {
      startPlayback();
    } else {
      audio.addEventListener('loadedmetadata', startPlayback, { once: true });
    }
  }

  audio.addEventListener('timeupdate', saveTime);
  window.addEventListener('pagehide', saveTime);
  window.addEventListener('beforeunload', saveTime);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) saveTime();
  });

  document.querySelectorAll('a[href$=".html"]').forEach(function (link) {
    link.addEventListener('click', saveTime);
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      if (audio.paused) {
        restoreTime();
        audio.play().then(function () {
          updateToggleUI(true);
          setState('playing');
        }).catch(function () {});
      } else {
        saveTime();
        audio.pause();
        updateToggleUI(false);
        setState('paused');
      }
    });
  }

  tryAutoplay();
})();