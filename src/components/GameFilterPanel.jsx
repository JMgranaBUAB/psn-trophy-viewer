import React, { useState, useRef } from 'react';
import { X, Download, Upload, Search, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GameFilterPanel = ({ titles, hiddenGames, toggleGame, isHidden, exportHiddenGames, importHiddenGames, hiddenCount, onClose }) => {
  const [search, setSearch] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = (titles || []).filter((t) =>
    t.trophyTitleName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importHiddenGames(ev.target.result);
      if (result.success) {
        setImportStatus({ ok: true, msg: 'Lista importada correctamente' });
      } else {
        setImportStatus({ ok: false, msg: `Error: ${result.error}` });
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/20 w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Filtrar Juegos</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {hiddenCount > 0
                ? `${hiddenCount} juego${hiddenCount > 1 ? 's' : ''} oculto${hiddenCount > 1 ? 's' : ''}`
                : 'Todos los juegos visibles'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Search + Actions */}
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar juego..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportHiddenGames}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-lg text-gray-300 hover:text-purple-300 transition-all"
            >
              <Download size={13} />
              Exportar JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-lg text-gray-300 hover:text-purple-300 transition-all"
            >
              <Upload size={13} />
              Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          {/* Import feedback */}
          <AnimatePresence>
            {importStatus && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs font-medium ${importStatus.ok ? 'text-green-400' : 'text-red-400'}`}
              >
                {importStatus.msg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Game list */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">No se encontraron juegos</p>
          ) : (
            filtered.map((title) => {
              const hidden = isHidden(title.npCommunicationId);
              return (
                <button
                  key={title.npCommunicationId}
                  onClick={() => toggleGame(title.npCommunicationId)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                    hidden
                      ? 'opacity-50 hover:opacity-70'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Game icon */}
                  <img
                    src={title.trophyTitleIconUrl}
                    alt=""
                    className={`w-10 h-10 rounded-lg object-cover flex-shrink-0 border ${
                      hidden ? 'border-white/5 grayscale' : 'border-white/10'
                    }`}
                  />
                  {/* Game name */}
                  <span
                    className={`flex-1 text-sm font-medium truncate ${
                      hidden ? 'text-gray-500 line-through' : 'text-white'
                    }`}
                  >
                    {title.trophyTitleName}
                  </span>
                  {/* Toggle icon */}
                  <div
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                      hidden
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}
                  >
                    {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameFilterPanel;
