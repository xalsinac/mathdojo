/**
 * Math Dojo · Sistema de Persistencia y Gamificación
 * Guarda récords de racha por disciplina y nivel en localStorage.
 * Permite mostrar maestrías de cinturón en la portada y pantallas de juego.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'mathdojo_records_v1';

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  const DojoStats = {
    getAll() {
      return loadData();
    },

    getBest(gameId, levelId) {
      const data = loadData();
      return (data[gameId] && typeof data[gameId][levelId] === 'number') ? data[gameId][levelId] : 0;
    },

    getGameSummary(gameId) {
      const data = loadData();
      const gameData = data[gameId] || {};
      let maxStreak = 0;
      let masteredLevels = 0;
      let totalLevels = Object.keys(gameData).length;

      for (const level in gameData) {
        const streak = gameData[level];
        if (streak > maxStreak) maxStreak = streak;
        if (streak >= 10) masteredLevels++;
      }

      return {
        maxStreak,
        masteredLevels,
        totalLevels,
        isMastered: maxStreak >= 10
      };
    },

    recordStreak(gameId, levelId, currentStreak) {
      if (typeof currentStreak !== 'number' || currentStreak <= 0) {
        return { isNewBest: false, bestStreak: this.getBest(gameId, levelId) };
      }

      const data = loadData();
      if (!data[gameId]) data[gameId] = {};
      const previousBest = data[gameId][levelId] || 0;

      let isNewBest = false;
      let justMastered = false;

      if (currentStreak > previousBest) {
        data[gameId][levelId] = currentStreak;
        saveData(data);
        isNewBest = true;
        if (currentStreak >= 10 && previousBest < 10) {
          justMastered = true;
        }
      }

      return {
        isNewBest,
        previousBest,
        bestStreak: Math.max(previousBest, currentStreak),
        isMastered: Math.max(previousBest, currentStreak) >= 10,
        justMastered
      };
    },

    syncHomeBadges() {
      const badges = document.querySelectorAll('.card-belt-badge[data-game]');
      badges.forEach(badge => {
        const gameId = badge.getAttribute('data-game');
        const summary = this.getGameSummary(gameId);
        if (summary.maxStreak > 0) {
          badge.classList.add('has-streak');
          if (summary.maxStreak >= 10) {
            badge.classList.add('is-mastered');
            badge.innerHTML = `🥋 Maestro · Récord: <b>${summary.maxStreak}</b> 🔥`;
          } else {
            badge.innerHTML = `Récord: <b>${summary.maxStreak}</b> 🔥`;
          }
        } else {
          badge.classList.remove('has-streak', 'is-mastered');
          badge.innerHTML = `🥋 Entrenar`;
        }
      });
    },

    syncGameLevels(gameId) {
      if (!gameId) return;
      const pills = document.querySelectorAll('.mode-btn[data-level]');
      pills.forEach(pill => {
        const levelId = pill.getAttribute('data-level');
        const best = this.getBest(gameId, levelId);
        let statusEl = pill.querySelector('.belt-pill-status');
        if (!statusEl) {
          statusEl = document.createElement('div');
          statusEl.className = 'belt-pill-status';
          pill.appendChild(statusEl);
        }
        if (best >= 10) {
          statusEl.className = 'belt-pill-status is-mastered';
          statusEl.innerHTML = `🥋 Récord: <b>${best}</b> 🔥`;
        } else if (best > 0) {
          statusEl.className = 'belt-pill-status has-streak';
          statusEl.innerHTML = `Récord: <b>${best}</b> 🔥`;
        } else {
          statusEl.className = 'belt-pill-status';
          statusEl.innerHTML = `🥋 Iniciar`;
        }
      });
    }
  };

  window.DojoStats = DojoStats;

  document.addEventListener('DOMContentLoaded', () => {
    DojoStats.syncHomeBadges();
    if (window.GAME_ID) {
      DojoStats.syncGameLevels(window.GAME_ID);
    }
  });
})();
