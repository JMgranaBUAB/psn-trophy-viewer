import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, ArrowLeft, Loader2, Diamond, Gem } from 'lucide-react';

// Medal styles for top 3
const medalConfig = [
    { bg: 'from-yellow-400 to-amber-500', border: 'border-yellow-400/60', glow: '0 0 20px 4px #fbbf2450', text: 'text-yellow-300', icon: '🥇' },
    { bg: 'from-slate-300 to-slate-400', border: 'border-slate-300/60', glow: '0 0 20px 4px #94a3b850', text: 'text-slate-300', icon: '🥈' },
    { bg: 'from-amber-600 to-orange-700', border: 'border-amber-600/60', glow: '0 0 20px 4px #d9770650', text: 'text-amber-500', icon: '🥉' },
];

const trophyTypeStyles = {
    platinum: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Platino' },
    gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Oro' },
    silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', label: 'Plata' },
    bronze: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Bronce' },
};

// Rarity bar color based on percentage
const getRarityColor = (rate) => {
    if (rate <= 1) return 'from-red-500 to-pink-600';
    if (rate <= 5) return 'from-orange-500 to-red-500';
    if (rate <= 15) return 'from-yellow-500 to-orange-500';
    if (rate <= 30) return 'from-blue-400 to-purple-500';
    return 'from-purple-500 to-blue-500';
};

const getRarityLabel = (rate) => {
    if (rate <= 1) return { label: 'Ultra Raro', color: 'text-red-400' };
    if (rate <= 5) return { label: 'Muy Raro', color: 'text-orange-400' };
    if (rate <= 15) return { label: 'Raro', color: 'text-yellow-400' };
    if (rate <= 30) return { label: 'Poco Común', color: 'text-blue-400' };
    return { label: 'Común', color: 'text-gray-400' };
};

const TrophyRow = ({ trophy, index, isPlatinumSection }) => {
    const medal = index < 3 ? medalConfig[index] : null;
    const rate = parseFloat(trophy.trophyEarnedRate);
    const typeStyle = trophyTypeStyles[trophy.trophyType] || trophyTypeStyles.bronze;
    const rarity = getRarityLabel(rate);
    const earnedDate = trophy.earnedDateTime
        ? new Date(trophy.earnedDateTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
        >
            <Link to={`/game/${trophy.npCommunicationId}`}>
                <div
                    className={`relative overflow-hidden flex items-center gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4 backdrop-blur-sm border transition-all duration-200 hover:scale-[1.01] ${
                        medal
                            ? `${medal.border} bg-white/5 hover:bg-white/10`
                            : isPlatinumSection
                                ? 'border-blue-500/20 bg-blue-950/20 hover:bg-blue-950/30'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    style={medal ? { boxShadow: medal.glow } : {}}
                >
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-8 sm:w-10 text-center ${medal ? medal.text : 'text-gray-500'} font-bold text-base sm:text-lg`}>
                        {medal ? medal.icon : `#${index + 1}`}
                    </div>

                    {/* Trophy icon */}
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white/5 relative">
                        {trophy.trophyIconUrl ? (
                            <img src={trophy.trophyIconUrl} alt={trophy.trophyName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Trophy size={20} className="text-gray-600" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm truncate text-white">{trophy.trophyName}</span>
                            {!isPlatinumSection && (
                                <span className={`flex-shrink-0 text-[10px] ${typeStyle.bg} ${typeStyle.text} px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium`}>
                                    {typeStyle.label}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                            {trophy.gameIconUrl && (
                                <img src={trophy.gameIconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
                            )}
                            <span className="text-xs text-gray-400 truncate">{trophy.gameName}</span>
                        </div>
                        {/* Rarity bar */}
                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(rate, 1)}%` }}
                                transition={{ duration: 0.8, delay: index * 0.04 + 0.3, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${getRarityColor(rate)}`}
                            />
                        </div>
                    </div>

                    {/* Rarity % + date */}
                    <div className="flex-shrink-0 text-right">
                        <div className={`font-bold text-lg sm:text-xl ${rarity.color}`}>
                            {rate}%
                        </div>
                        <div className={`text-[9px] sm:text-[10px] ${rarity.color} opacity-70 font-medium`}>{rarity.label}</div>
                        {earnedDate && (
                            <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">{earnedDate}</div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

const RarestTrophies = () => {
    const [rarestAll, setRarestAll] = useState([]);
    const [rarestPlatinums, setRarestPlatinums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalProcessed, setTotalProcessed] = useState(0);

    useEffect(() => {
        const fetchRarest = async () => {
            try {
                const npsso = localStorage.getItem('psn_npsso');
                const config = {
                    headers: npsso ? { 'Authorization': `Bearer ${npsso}` } : {},
                    timeout: 120000, // 2 min — this endpoint processes many games
                };
                const res = await axios.get('/api/trophies/rarest', config);
                setRarestAll(res.data?.rarestAll || []);
                setRarestPlatinums(res.data?.rarestPlatinums || []);
                setTotalProcessed(res.data?.totalProcessed || 0);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRarest();
    }, []);

    return (
        <div className="min-h-screen bg-[#0f0f15] text-white font-sans">
            {/* Background gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[60%] w-[25%] h-[25%] bg-red-900/10 rounded-full blur-[100px]" />
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
                            <Diamond className="text-red-400" size={28} />
                            Trofeos Más Raros
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Los trofeos más difíciles que has conseguido</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                        <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
                        <p className="text-gray-400 animate-pulse">Analizando todos tus trofeos...</p>
                        <p className="text-[10px] text-gray-600 mt-3 max-w-xs text-center leading-relaxed">
                            Estamos revisando cada juego de tu colección para encontrar los trofeos más raros. Esto puede tardar un minuto.
                        </p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 py-20">{error}</div>
                ) : (
                    <div className="space-y-14">
                        {/* Section 1: Top 20 Rarest Trophies */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Trophy size={20} className="text-red-400" />
                                        Top 20 Trofeos Más Raros
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        De {totalProcessed} juegos analizados
                                    </p>
                                </div>
                            </div>

                            {rarestAll.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">No se encontraron trofeos obtenidos.</div>
                            ) : (
                                <div className="space-y-2.5">
                                    {rarestAll.map((trophy, index) => (
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

                        {/* Divider */}
                        <div className="border-t border-white/5" />

                        {/* Section 2: Top 20 Rarest Platinums */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full" />
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Gem size={20} className="text-blue-400" />
                                        Top 20 Platinos Más Raros
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Los platinos más exclusivos de tu colección
                                    </p>
                                </div>
                            </div>

                            {rarestPlatinums.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">No se encontraron platinos.</div>
                            ) : (
                                <div className="space-y-2.5">
                                    {rarestPlatinums.map((trophy, index) => (
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default RarestTrophies;
