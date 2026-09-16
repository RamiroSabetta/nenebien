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
  var gate = document.getElementById('audio-gate');
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

  function showGate() {
    if (gate) gate.classList.add('is-visible');
  }

  function hideGate() {
    if (gate) gate.classList.remove('is-visible');
  }

  function activateAudio() {
    restoreTime();
    return audio.play().then(function () {
      updateToggleUI(true);
      setState('playing');
      hideGate();
    });
  }

  function tryAutoplay() {
    var wantsPlaying = localStorage.getItem(STATE_KEY) !== 'paused';
    if (!wantsPlaying) {
      updateToggleUI(false);
      return;
    }
    var startPlayback = function () {
      restoreTime();
      var p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(function () { updateToggleUI(true); })
         .catch(function () { updateToggleUI(false); showGate(); });
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
        activateAudio().catch(function () {});
      } else {
        saveTime();
        audio.pause();
        updateToggleUI(false);
        setState('paused');
      }
    });
  }

  if (gate) {
    var onGateActivate = function (e) {
      e.preventDefault();
      activateAudio().catch(function () {});
    };
    gate.addEventListener('click', onGateActivate);
    gate.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') onGateActivate(e);
    });
  }

  tryAutoplay();
})();

(function () {
  var btn = document.getElementById('rsvp-btn');
  var status = document.getElementById('rsvp-status');
  if (!btn) return;

  var ORIGINAL_LABEL = btn.textContent;
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var MESSAGE_DURATION = 15000;
  var hideTimer = null;
  var clearTimer = null;

  function setStatus(text, kind) {
    if (!status) return;

    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }

    status.classList.remove('is-hidden');
    status.textContent = text;
    status.className = 'rsvp-status' + (kind ? ' is-' + kind : '');

    if (text) {
      hideTimer = setTimeout(function () {
        status.classList.add('is-hidden');
        clearTimer = setTimeout(function () {
          status.textContent = '';
          status.className = 'rsvp-status';
        }, 400);
      }, MESSAGE_DURATION);
    }
  }

  btn.addEventListener('click', function () {
    if (btn.disabled) return;

    var accessKey = btn.getAttribute('data-access-key');
    if (!accessKey || accessKey.indexOf('REEMPLAZAR') === 0) {
      setStatus('Falta configurar la Access Key de Web3Forms en el botón.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';
    setStatus('');

    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: 'Nueva confirmación de asistencia — Nene Bien',
        from_name: 'Landing Nene Bien',
        message:
          'Alguien confirmó su asistencia al evento del 18 de octubre ' +
          'desde la landing page de Nene Bien.\n\n' +
          'Fecha y hora: ' + new Date().toLocaleString('es-AR') + '\n' +
          'Página: ' + window.location.href
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success) throw new Error(data.message || 'Error desconocido');
        btn.textContent = '¡Asistencia confirmada!';
        setStatus('Listo, ya avisamos que vas a estar ahí.', 'success');
        setTimeout(function () {
          btn.disabled = false;
          btn.textContent = ORIGINAL_LABEL;
        }, 4000);
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = ORIGINAL_LABEL;
        setStatus('No se pudo enviar la confirmación. Probá de nuevo en unos segundos.', 'error');
      });
  });
})();