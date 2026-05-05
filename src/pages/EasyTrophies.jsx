import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, Target, Trophy } from 'lucide-react';

const trophyTypeStyles = {
    platinum: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Platino' },
    gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Oro' },
    silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', label: 'Plata' },
    bronze: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Bronce' },
};

const EasyTrophies = () => {
    const [trophies, setTrophies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalProcessed, setTotalProcessed] = useState(0);

    useEffect(() => {
        const fetchEasy = async () => {
            try {
                const npsso = localStorage.getItem('psn_npsso');
                const config = {
                    headers: npsso ? { 'Authorization': `Bearer ${npsso}` } : {},
                    timeout: 120000,
                };
                const res = await axios.get('/api/trophies/easy-missing', config);
                setTrophies(res.data?.trophies || []);
                setTotalProcessed(res.data?.totalProcessed || 0);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEasy();
    }, []);

    // Group trophies by game
    const grouped = {};
    trophies.forEach(t => {
        if (!grouped[t.npCommunicationId]) {
            grouped[t.npCommunicationId] = {
                gameName: t.gameName,
                gameIconUrl: t.gameIconUrl,
                npCommunicationId: t.npCommunicationId,
                platform: t.platform,
                trophies: [],
            };
        }
        grouped[t.npCommunicationId].trophies.push(t);
    });

    // Sort groups by the count of easy trophies (most first)
    const sortedGroups = Object.values(grouped).sort((a, b) => b.trophies.length - a.trophies.length);

    return (
        <div className="min-h-screen bg-[#0f0f15] text-white font-sans">
            {/* Background gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-900/15 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Volver
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <Target className="text-green-400" size={28} />
                            Trofeos Fáciles Pendientes
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Trofeos no obtenidos con ≥ 80% de jugadores que los tienen
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                        <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
                        <p className="text-gray-400 animate-pulse">Buscando trofeos fáciles pendientes...</p>
                        <p className="text-[10px] text-gray-600 mt-3 max-w-xs text-center leading-relaxed">
                            Analizando cada juego de tu colección. Esto puede tardar un minuto.
                        </p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 py-20">{error}</div>
                ) : trophies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                        <Trophy className="text-green-400 mb-4" size={48} />
                        <p className="text-xl font-bold mb-2">¡No tienes trofeos fáciles pendientes!</p>
                        <p className="text-gray-400 text-sm">Has obtenido todos los trofeos con ≥ 80% de rareza.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats bar */}
                        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-3 mb-8">
                            <div className="flex items-center gap-6">
                                <div>
                                    <div className="text-2xl font-bold text-green-400">{trophies.length}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Trofeos fáciles</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div>
                                    <div className="text-2xl font-bold text-white">{sortedGroups.length}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Juegos</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">{totalProcessed} juegos analizados</div>
                        </div>

                        {/* Grouped by game */}
                        <div className="space-y-6">
                            {sortedGroups.map((group, gi) => (
                                <motion.div
                                    key={group.npCommunicationId}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: gi * 0.05 }}
                                >
                                    <Link to={`/game/${group.npCommunicationId}`}>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition-colors">
                                            {/* Game header */}
                                            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                                                <img
                                                    src={group.gameIconUrl}
                                                    alt={group.gameName}
                                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm truncate">{group.gameName}</div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {group.trophies.length} trofeo{group.trophies.length > 1 ? 's' : ''} fácil{group.trophies.length > 1 ? 'es' : ''} pendiente{group.trophies.length > 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                                <span className="text-green-400 bg-green-500/10 border border-green-500/20 text-xs font-bold px-2.5 py-1 rounded-full">
                                                    {group.trophies.length}
                                                </span>
                                            </div>

                                            {/* Trophies list */}
                                            <div className="divide-y divide-white/5">
                                                {group.trophies.map((trophy, ti) => {
                                                    const typeStyle = trophyTypeStyles[trophy.trophyType] || trophyTypeStyles.bronze;
                                                    const rate = parseFloat(trophy.trophyEarnedRate);

                                                    return (
                                                        <div key={ti} className="flex items-center gap-3 px-4 py-2.5">
                                                            {/* Trophy icon */}
                                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                                                                {trophy.trophyIconUrl ? (
                                                                    <img src={trophy.trophyIconUrl} alt="" className="w-full h-full object-cover grayscale opacity-60" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Trophy size={16} className="text-gray-600" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-gray-300 truncate">{trophy.trophyName}</span>
                                                                    <span className={`flex-shrink-0 text-[9px] ${typeStyle.bg} ${typeStyle.text} px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium`}>
                                                                        {typeStyle.label}
                                                                    </span>
                                                                </div>
                                                                {trophy.trophyDetail && (
                                                                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{trophy.trophyDetail}</p>
                                                                )}
                                                            </div>

                                                            {/* Rate */}
                                                            <div className="flex-shrink-0 text-right">
                                                                <div className="text-green-400 font-bold text-sm">{rate}%</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EasyTrophies;
