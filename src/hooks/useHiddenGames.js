import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'psn_hidden_games';

const useHiddenGames = () => {
  const [hiddenGames, setHiddenGames] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Sync to localStorage whenever hiddenGames changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hiddenGames]));
  }, [hiddenGames]);

  const toggleGame = useCallback((npCommunicationId) => {
    setHiddenGames((prev) => {
      const next = new Set(prev);
      if (next.has(npCommunicationId)) {
        next.delete(npCommunicationId);
      } else {
        next.add(npCommunicationId);
      }
      return next;
    });
  }, []);

  const isHidden = useCallback(
    (npCommunicationId) => hiddenGames.has(npCommunicationId),
    [hiddenGames]
  );

  const exportHiddenGames = useCallback(() => {
    const data = JSON.stringify([...hiddenGames], null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'psn_hidden_games.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [hiddenGames]);

  const importHiddenGames = useCallback((jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      setHiddenGames(new Set(parsed));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    hiddenGames,
    hiddenCount: hiddenGames.size,
    toggleGame,
    isHidden,
    exportHiddenGames,
    importHiddenGames,
  };
};

export default useHiddenGames;
