import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Clock, ArrowLeft, Loader2, Medal } from 'lucide-react';

// Parse ISO 8601 duration (PT228H56M33S) → total seconds
const parseDurationToSeconds = (duration) => {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = parseInt(match[1] || '0', 10);
    const m = parseInt(match[2] || '0', 10);
    const s = parseInt(match[3] || '0', 10);
    return h * 3600 + m * 60 + s;
};

// Format seconds to human-readable
const formatDuration = (duration) => {
    if (!duration) return null;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return null;
    const h = parseInt(match[1] || '0', 10);
    const m = parseInt(match[2] || '0', 10);
    if (h === 0 && m === 0) return null;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
};

// Medal colors for top 3
const medalConfig = [
    { bg: 'from-yellow-400 to-amber-500', border: 'border-yellow-400/60', glow: '0 0 20px 4px #fbbf2450', text: 'text-yellow-300', icon: '🥇' },
    { bg: 'from-slate-300 to-slate-400', border: 'border-slate-300/60', glow: '0 0 20px 4px #94a3b850', text: 'text-slate-300', icon: '🥈' },
    { bg: 'from-amber-600 to-orange-700', border: 'border-amber-600/60', glow: '0 0 20px 4px #d9770650', text: 'text-amber-500', icon: '🥉' },
];

const TopGames = () => {
    const [titles, setTitles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTitles = async () => {
            try {
                const npsso = localStorage.getItem('psn_npsso');
                const config = {
                    headers: npsso ? { 'Authorization': `Bearer ${npsso}` } : {},
                    timeout: 30000,
                };
                const res = await axios.get('/api/trophies/me', config);
                const all = res.data?.trophyTitles || [];
                // Filter only games with playDuration and sort by duration desc
                const withTime = all
                    .filter(t => t.playDuration)
                    .sort((a, b) => parseDurationToSeconds(b.playDuration) - parseDurationToSeconds(a.playDuration))
                    .slice(0, 20);
                setTitles(withTime);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTitles();
    }, []);

    const maxSeconds = titles.length > 0 ? parseDurationToSeconds(titles[0].playDuration) : 1;

    return (
        <div className="min-h-screen bg-[#0f0f15] text-white font-sans">
            {/* Background gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute top-[30%] left-[50%] w-[30%] h-[30%] bg-amber-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
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
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Clock className="text-purple-400" size={32} />
                            Top 20 Juegos
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Los juegos en los que más horas has invertido</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                        <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
                        <p className="text-gray-400 animate-pulse">Calculando tus horas de juego...</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 py-20">{error}</div>
                ) : titles.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">No hay datos de tiempo de juego disponibles.</div>
                ) : (
                    <div className="space-y-3">
                        {titles.map((title, index) => {
                            const seconds = parseDurationToSeconds(title.playDuration);
                            const pct = Math.round((seconds / maxSeconds) * 100);
                            const timeStr = formatDuration(title.playDuration);
                            const medal = index < 3 ? medalConfig[index] : null;
                            const hasPlatinum = title.earnedTrophies?.platinum > 0;

                            return (
                                <motion.div
                                    key={title.npCommunicationId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.04 }}
                                >
                                    <Link to={`/game/${title.npCommunicationId}`}>
                                        <div
                                            className={`relative overflow-hidden flex items-center gap-4 rounded-2xl p-4 backdrop-blur-sm border transition-all duration-200 hover:scale-[1.01] ${
                                                medal
                                                    ? `border ${medal.border} ${hasPlatinum ? 'bg-cyan-950/30' : 'bg-white/5'} hover:bg-white/10`
                                                    : hasPlatinum
                                                        ? 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/40 hover:from-cyan-950/50 hover:via-blue-950/40 hover:to-slate-900/50'
                                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            }`}
                                            style={
                                                medal
                                                    ? { boxShadow: medal.glow }
                                                    : hasPlatinum
                                                        ? { boxShadow: '0 0 15px 2px rgba(96, 200, 255, 0.15), inset 0 0 30px 0px rgba(96, 200, 255, 0.05)' }
                                                        : {}
                                            }
                                        >
                                            {/* Platinum shimmer overlay */}
                                            {hasPlatinum && (
                                                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                                                    <div className="absolute -inset-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent" style={{ animationDelay: `${index * 0.2}s` }} />
                                                </div>
                                            )}

                                            {/* Rank number */}
                                            <div className={`flex-shrink-0 w-10 text-center ${medal ? medal.text : hasPlatinum ? 'text-cyan-400' : 'text-gray-500'} font-bold text-lg`}>
                                                {medal ? medal.icon : `#${index + 1}`}
                                            </div>

                                            {/* Game image */}
                                            <div className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden ${hasPlatinum ? 'ring-1 ring-cyan-500/30' : ''}`}>
                                                <img
                                                    src={title.trophyTitleIconUrl}
                                                    alt={title.trophyTitleName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Game info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-semibold text-sm truncate ${hasPlatinum ? 'text-cyan-50' : ''}`}>{title.trophyTitleName}</span>
                                                    {hasPlatinum && (
                                                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">
                                                            <Trophy size={9} />Platino
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Progress bar */}
                                                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.8, delay: index * 0.04 + 0.3, ease: 'easeOut' }}
                                                        className={`h-full rounded-full ${
                                                            medal
                                                                ? index === 0
                                                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                                                    : index === 1
                                                                        ? 'bg-gradient-to-r from-slate-300 to-slate-400'
                                                                        : 'bg-gradient-to-r from-amber-600 to-orange-500'
                                                                : hasPlatinum
                                                                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                                                                    : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className={`text-[10px] ${hasPlatinum ? 'text-cyan-500/60' : 'text-gray-500'}`}>{title.progress}% trofeos</span>
                                                </div>
                                            </div>

                                            {/* Time played */}
                                            <div className={`flex-shrink-0 text-right ${medal ? medal.text : hasPlatinum ? 'text-cyan-300' : 'text-gray-300'}`}>
                                                <div className="flex items-center gap-1 justify-end">
                                                    <Clock size={13} />
                                                    <span className="font-bold text-base">{timeStr}</span>
                                                </div>
                                                <div className={`text-[10px] mt-0.5 ${hasPlatinum ? 'text-cyan-500/50' : 'text-gray-500'}`}>jugadas</div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopGames;
