/**
 * Math Dojo · Sistema de Sonido Procedural y Háptico
 * 100% Web Audio API nativo (sin dependencias ni archivos externos de audio).
 * Efectos arcade y estética Dojo/Artes Marciales para alumnos de secundaria.
 */
(function() {
  'use strict';

  let ctx = null;
  let isMuted = false;

  try {
    isMuted = localStorage.getItem('mathdojo_muted') === 'true';
  } catch (_) {}

  function getAudioContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // Desbloqueo de AudioContext en la primera interacción del usuario
  function unlockAudio() {
    const c = getAudioContext();
    if (c && c.state === 'suspended') {
      c.resume().catch(() => {});
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  }
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });

  const DojoAudio = {
    isMuted() {
      return isMuted;
    },

    toggleMute() {
      isMuted = !isMuted;
      try {
        localStorage.setItem('mathdojo_muted', isMuted ? 'true' : 'false');
      } catch (_) {}
      this.syncUI();
      if (!isMuted) {
        this.play('tap');
      }
      return isMuted;
    },

    syncUI() {
      const icons = document.querySelectorAll('.sound-icon');
      icons.forEach(el => {
        el.textContent = isMuted ? '🔇' : '🔊';
      });
      const btns = document.querySelectorAll('.sound-toggle-btn');
      btns.forEach(btn => {
        btn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
        btn.classList.toggle('is-muted', isMuted);
      });
    },

    vibrate(pattern) {
      try {
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
          navigator.vibrate(pattern);
        }
      } catch (_) {}
    },

    play(effect) {
      if (isMuted) return;
      const c = getAudioContext();
      if (!c) return;

      const now = c.currentTime;

      switch (effect) {
        // Corte limpio de Katana al acertar
        case 'slash':
        case 'correct': {
          this.vibrate(18);

          // Componente de golpe afilado (White noise con barrido pasa-banda)
          const bufferSize = c.sampleRate * 0.14;
          const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }

          const noise = c.createBufferSource();
          noise.buffer = buffer;

          const filter = c.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(3200, now);
          filter.frequency.exponentialRampToValueAtTime(700, now + 0.13);
          filter.Q.setValueAtTime(3.5, now);

          const noiseGain = c.createGain();
          noiseGain.gain.setValueAtTime(0.5, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(c.destination);
          noise.start(now);

          // Componente tonal cristalino (Brillo de espada)
          const osc = c.createOscillator();
          const oscGain = c.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(784, now); // G5
          osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08); // C6
          oscGain.gain.setValueAtTime(0.25, now);
          oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc.connect(oscGain);
          oscGain.connect(c.destination);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }

        // Choque metálico / trampa mental (Fallo)
        case 'clash':
        case 'wrong': {
          this.vibrate([40, 30, 45]);

          // Dos osciladores disonantes metálicos
          const osc1 = c.createOscillator();
          const osc2 = c.createOscillator();
          const gain = c.createGain();

          osc1.type = 'sawtooth';
          osc2.type = 'square';
          osc1.frequency.setValueAtTime(196, now); // G3
          osc1.frequency.exponentialRampToValueAtTime(130, now + 0.25);
          osc2.frequency.setValueAtTime(260, now);
          osc2.frequency.exponentialRampToValueAtTime(160, now + 0.25);

          gain.gain.setValueAtTime(0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(c.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.28);
          osc2.stop(now + 0.28);
          break;
        }

        // Cambio rápido de pregunta / Shuriken ligero
        case 'woosh': {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        // Arpegio ascendente para hitos de racha (5, 10, 15...)
        case 'combo': {
          this.vibrate([20, 30, 30]);
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
          notes.forEach((freq, idx) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            const start = now + idx * 0.055;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.22, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(start);
            osc.stop(start + 0.18);
          });
          break;
        }

        // Gong de cinturón maestro (Racha 10 alcanzada)
        case 'gong': {
          this.vibrate([60, 40, 80]);
          const freqs = [174.61, 261.63, 349.23, 523.25]; // F3, C4, F4, C5
          freqs.forEach(freq => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(now);
            osc.stop(now + 1.2);
          });
          break;
        }

        // Clic sutil para botones
        case 'tap':
        default: {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1100, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
      }
    }
  };

  window.DojoAudio = DojoAudio;

  document.addEventListener('DOMContentLoaded', () => {
    DojoAudio.syncUI();
  });
})();
