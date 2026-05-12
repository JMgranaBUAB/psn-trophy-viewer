import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, ArrowLeft, Loader2, Sparkles, Gem, Target } from 'lucide-react';

const medalConfig = [
    { border: 'border-yellow-400/60', glow: '0 0 16px 3px #fbbf2440', text: 'text-yellow-300', icon: '🥇' },
    { border: 'border-slate-300/60', glow: '0 0 16px 3px #94a3b840', text: 'text-slate-300', icon: '🥈' },
    { border: 'border-amber-600/60', glow: '0 0 16px 3px #d9770640', text: 'text-amber-500', icon: '🥉' },
];

const trophyTypeStyles = {
    platinum: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Platino' },
    gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Oro' },
    silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', label: 'Plata' },
    bronze: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Bronce' },
};

const getEasinessColor = (rate) => {
    if (rate >= 90) return 'from-green-400 to-emerald-500';
    if (rate >= 70) return 'from-green-500 to-teal-500';
    if (rate >= 50) return 'from-cyan-400 to-blue-500';
    if (rate >= 30) return 'from-blue-400 to-purple-500';
    return 'from-purple-500 to-pink-500';
};

const getEasinessLabel = (rate) => {
    if (rate >= 90) return { label: 'Muy Fácil', color: 'text-green-400' };
    if (rate >= 70) return { label: 'Fácil', color: 'text-emerald-400' };
    if (rate >= 50) return { label: 'Normal', color: 'text-cyan-400' };
    if (rate >= 30) return { label: 'Moderado', color: 'text-blue-400' };
    return { label: 'Difícil', color: 'text-purple-400' };
};

/* ── Compact Trophy Row (sections 1 & 2) ── */
const TrophyRow = ({ trophy, index, isPlatinumSection }) => {
    const medal = index < 3 ? medalConfig[index] : null;
    const rate = parseFloat(trophy.trophyEarnedRate);
    const typeStyle = trophyTypeStyles[trophy.trophyType] || trophyTypeStyles.bronze;
    const easiness = getEasinessLabel(rate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
        >
            <Link to={`/game/${trophy.npCommunicationId}`}>
                <div
                    className={`relative overflow-hidden flex items-center gap-2.5 rounded-xl p-2.5 backdrop-blur-sm border transition-all duration-200 hover:scale-[1.01] ${
                        medal
                            ? `${medal.border} bg-white/5 hover:bg-white/10`
                            : isPlatinumSection
                                ? 'border-blue-500/20 bg-blue-950/20 hover:bg-blue-950/30'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    style={medal ? { boxShadow: medal.glow } : {}}
                >
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-7 text-center ${medal ? medal.text : 'text-gray-500'} font-bold text-sm`}>
                        {medal ? medal.icon : `#${index + 1}`}
                    </div>

                    {/* Trophy icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                        {trophy.trophyIconUrl ? (
                            <img src={trophy.trophyIconUrl} alt={trophy.trophyName} className="w-full h-full object-cover grayscale opacity-60" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Trophy size={16} className="text-gray-600" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-semibold text-xs truncate text-white">{trophy.trophyName}</span>
                            {!isPlatinumSection && (
                                <span className={`flex-shrink-0 text-[8px] ${typeStyle.bg} ${typeStyle.text} px-1 py-0.5 rounded-full uppercase tracking-wider font-medium`}>
                                    {typeStyle.label}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                            {trophy.gameIconUrl && (
                                <img src={trophy.gameIconUrl} alt="" className="w-3.5 h-3.5 rounded-sm flex-shrink-0" />
                            )}
                            <span className="text-[10px] text-gray-400 truncate">{trophy.gameName}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-0.5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(rate, 1)}%` }}
                                transition={{ duration: 0.8, delay: index * 0.03 + 0.2, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${getEasinessColor(rate)}`}
                            />
                        </div>
                    </div>

                    {/* Rate */}
                    <div className="flex-shrink-0 text-right">
                        <div className={`font-bold text-sm ${easiness.color}`}>{rate}%</div>
                        <div className={`text-[8px] ${easiness.color} opacity-70 font-medium`}>{easiness.label}</div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

/* ── Compact Game Row (closest to platinum – section 3) ── */
const GamePlatRow = ({ game, index }) => {
    const medal = index < 3 ? medalConfig[index] : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
        >
            <Link to={`/game/${game.npCommunicationId}`}>
                <div
                    className={`relative overflow-hidden flex items-center gap-2.5 rounded-xl p-2.5 backdrop-blur-sm border transition-all duration-200 hover:scale-[1.01] ${
                        medal
                            ? `${medal.border} bg-white/5 hover:bg-white/10`
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    style={medal ? { boxShadow: medal.glow } : {}}
                >
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-7 text-center ${medal ? medal.text : 'text-gray-500'} font-bold text-sm`}>
                        {medal ? medal.icon : `#${index + 1}`}
                    </div>

                    {/* Game icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                        {game.gameIconUrl ? (
                            <img src={game.gameIconUrl} alt={game.gameName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Trophy size={16} className="text-gray-600" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs truncate text-white mb-0.5">{game.gameName}</div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] text-gray-400">
                                {game.earnedTrophies}/{game.totalTrophies}
                            </span>
                            <span className="text-[8px] text-gray-600">•</span>
                            <span className={`text-[10px] font-semibold ${game.missingTrophies <= 3 ? 'text-green-400' : game.missingTrophies <= 10 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                Faltan {game.missingTrophies}
                            </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${game.progress}%` }}
                                transition={{ duration: 0.8, delay: index * 0.03 + 0.2, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                    game.progress >= 90 ? 'from-green-400 to-emerald-500'
                                    : game.progress >= 70 ? 'from-cyan-400 to-blue-500'
                                    : game.progress >= 50 ? 'from-blue-400 to-purple-500'
                                    : 'from-purple-500 to-pink-500'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Progress % */}
                    <div className="flex-shrink-0 text-right">
                        <div className={`font-bold text-sm ${
                            game.progress >= 90 ? 'text-green-400'
                            : game.progress >= 70 ? 'text-cyan-400'
                            : game.progress >= 50 ? 'text-blue-400'
                            : 'text-purple-400'
                        }`}>
                            {game.progress}%
                        </div>
                        <div className="text-[8px] text-gray-500 font-medium">
                            {game.missingTrophies} rest.
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

/* ── Main Page ── */
const EasiestTrophies = () => {
    const [easiestAll, setEasiestAll] = useState([]);
    const [easiestPlatinums, setEasiestPlatinums] = useState([]);
    const [closestToPlat, setClosestToPlat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalProcessed, setTotalProcessed] = useState(0);

    useEffect(() => {
        const fetchEasiest = async () => {
            try {
                const npsso = localStorage.getItem('psn_npsso');

                // Build exclude param from hidden games
                let excludeParam = '';
                try {
                    const stored = localStorage.getItem('psn_hidden_games');
                    if (stored) {
                        const hidden = JSON.parse(stored);
                        if (Array.isArray(hidden) && hidden.length > 0) {
                            excludeParam = hidden.join(',');
                        }
                    }
                } catch (_) { /* ignore */ }

                const config = {
                    headers: npsso ? { 'Authorization': `Bearer ${npsso}` } : {},
                    timeout: 180000,
                };
                const url = `/api/trophies/easiest${excludeParam ? `?exclude=${excludeParam}` : ''}`;
                const res = await axios.get(url, config);
                setEasiestAll(res.data?.easiestAll || []);
                setEasiestPlatinums(res.data?.easiestPlatinums || []);
                setClosestToPlat(res.data?.closestToPlat || []);
                setTotalProcessed(res.data?.totalProcessed || 0);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEasiest();
    }, []);

    return (
        <div className="min-h-screen bg-[#0f0f15] text-white font-sans">
            {/* Background gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/15 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[60%] w-[25%] h-[25%] bg-cyan-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Volver
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <Sparkles className="text-green-400" size={28} />
                            Trofeos Pendientes Más Fáciles
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Los trofeos y platinos pendientes más fáciles de obtener · {totalProcessed} juegos analizados</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                        <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
                        <p className="text-gray-400 animate-pulse">Analizando todos tus trofeos...</p>
                        <p className="text-[10px] text-gray-600 mt-3 max-w-xs text-center leading-relaxed">
                            Estamos revisando cada juego de tu colección para encontrar los trofeos pendientes más fáciles y los platinos más cercanos. Esto puede tardar un minuto.
                        </p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 py-20">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Column 1: Top 20 Easiest Trophies */}
                        <section className="min-w-0">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-1 h-7 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full" />
                                <div>
                                    <h2 className="text-base font-bold flex items-center gap-2">
                                        <Trophy size={18} className="text-green-400" />
                                        Trofeos Pendientes
                                    </h2>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        Mayor % de obtención
                                    </p>
                                </div>
                            </div>

                            {easiestAll.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 text-sm">No se encontraron trofeos pendientes.</div>
                            ) : (
                                <div className="space-y-1.5">
                                    {easiestAll.map((trophy, index) => (
                                        <TrophyRow
                                            key={`all-${trophy.npCommunicationId}-${trophy.trophyName}-${index}`}
                                            trophy={trophy}
                                            index={index}
                                            isPlatinumSection={false}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Column 2: Top 20 Easiest Platinums */}
                        <section className="min-w-0">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-1 h-7 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full" />
                                <div>
                                    <h2 className="text-base font-bold flex items-center gap-2">
                                        <Gem size={18} className="text-blue-400" />
                                        Platinos Pendientes
                                    </h2>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        Mayor % de obtención
                                    </p>
                                </div>
                            </div>

                            {easiestPlatinums.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 text-sm">No se encontraron platinos pendientes.</div>
                            ) : (
                                <div className="space-y-1.5">
                                    {easiestPlatinums.map((trophy, index) => (
                                        <TrophyRow
                                            key={`plat-${trophy.npCommunicationId}-${index}`}
                                            trophy={trophy}
                                            index={index}
                                            isPlatinumSection={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Column 3: Top 20 Closest to Platinum */}
                        <section className="min-w-0">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-1 h-7 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
                                <div>
                                    <h2 className="text-base font-bold flex items-center gap-2">
                                        <Target size={18} className="text-yellow-400" />
                                        Cerca del Platino
                                    </h2>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        Menos trofeos restantes
                                    </p>
                                </div>
                            </div>

                            {closestToPlat.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 text-sm">No se encontraron juegos con platino pendiente.</div>
                            ) : (
                                <div className="space-y-1.5">
                                    {closestToPlat.map((game, index) => (
                                        <GamePlatRow
                                            key={`plat-close-${game.npCommunicationId}-${index}`}
                                            game={game}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EasiestTrophies;
