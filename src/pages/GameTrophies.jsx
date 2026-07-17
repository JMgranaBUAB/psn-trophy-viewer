import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Lock, Unlock, Loader2, RefreshCw, BookOpen, X, ExternalLink, Eye, EyeOff } from 'lucide-react';
import useHiddenGames from '../hooks/useHiddenGames';

const GameTrophies = () => {
    const { npCommunicationId } = useParams();
    const [groupedTrophies, setGroupedTrophies] = useState({});
    const [titleName, setTitleName] = useState('');
    const [titleIconUrl, setTitleIconUrl] = useState('');
    const [platform, setPlatform] = useState('');
    const { hiddenGames, toggleGame } = useHiddenGames();
    const isHidden = hiddenGames.has(npCommunicationId);
    const [trophyGroupNames, setTrophyGroupNames] = useState({});
    const [filter, setFilter] = useState('unearned'); // 'all', 'earned', 'unearned'
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [guidePopup, setGuidePopup] = useState(null); // trophy object or null

    // Build search URLs for trophy guide sites
    const buildGuideLinks = useCallback((trophy, gameName) => {
        const tName = encodeURIComponent(trophy.trophyName || '');
        const gName = encodeURIComponent(gameName || '');
        const searchQuery = encodeURIComponent(`${gameName} ${trophy.trophyName} trophy guide`);
        return [
            {
                name: 'PSNProfiles',
                url: `https://psnprofiles.com/search/games?q=${gName}`,
                color: 'from-blue-600 to-blue-800',
                icon: '🏆',
            },
            {
                name: 'PSTHC',
                url: `https://psthc.fr/search?q=${gName}`,
                color: 'from-indigo-600 to-indigo-800',
                icon: '🎮',
            },
            {
                name: 'PlayStationTrophies.org',
                url: `https://www.playstationtrophies.org/search.php?do=process&query=${gName}`,
                color: 'from-purple-600 to-purple-800',
                icon: '🎯',
            },
            {
                name: 'PowerPyx',
                url: `https://www.powerpyx.com/?s=${gName}`,
                color: 'from-red-600 to-red-800',
                icon: '⚡',
            },
            {
                name: 'YouTube',
                url: `https://www.youtube.com/results?search_query=${searchQuery}`,
                color: 'from-red-500 to-red-700',
                icon: '▶️',
            },
            {
                name: 'Google',
                url: `https://www.google.com/search?q=${searchQuery}`,
                color: 'from-emerald-600 to-emerald-800',
                icon: '🔍',
            },
        ];
    }, []);

    // Close popup on Escape key
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') setGuidePopup(null); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);


    const fetchTrophies = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }

            const API_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.')
                ? `http://${window.location.hostname}:3001`
                : '';

            const npsso = localStorage.getItem('psn_npsso');
            const response = await axios.get(`${API_URL}/api/titles/${npCommunicationId}/trophies`, {
                headers: npsso ? { 'Authorization': `Bearer ${npsso}` } : {}
            });

            const fetchedTrophies = response.data.trophies || [];

            // Group by trophyGroupId
            const groups = {};
            fetchedTrophies.forEach(trophy => {
                const groupId = trophy.trophyGroupId || 'default';
                if (!groups[groupId]) {
                    groups[groupId] = [];
                }
                groups[groupId].push(trophy);
            });

            // Sort each group by rarity (highest to lowest)
            Object.keys(groups).forEach(groupId => {
                groups[groupId].sort((a, b) => {
                    return parseFloat(b.trophyEarnedRate || 0) - parseFloat(a.trophyEarnedRate || 0);
                });
            });

            setGroupedTrophies(groups);
            setTitleName(response.data.titleName || '');
            setTitleIconUrl(response.data.titleIconUrl || '');
            setPlatform(response.data.platform || '');
            setTrophyGroupNames(response.data.trophyGroups || {});
        } catch (err) {
            console.error("Error fetching game trophies:", err);
            setError("Failed to load trophies.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (npCommunicationId) {
            fetchTrophies();
        }
    }, [npCommunicationId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f15] text-white">
                <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
                <p className="text-gray-400">Loading trophies...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f15] text-white">
                <p className="text-red-500 mb-4">{error}</p>
                <Link to="/" className="text-purple-400 hover:text-purple-300 flex items-center">
                    <ArrowLeft size={20} className="mr-2" /> Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f15] text-white font-sans px-6 py-8 flex flex-col items-center">
            <div className="max-w-5xl mx-auto w-full">
                <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </Link>

                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold flex items-center">
                        {titleIconUrl ? (
                            <img src={titleIconUrl} alt={titleName} className="w-12 h-12 rounded-xl shadow-lg mr-4 object-cover" />
                        ) : (
                            <Trophy className="text-yellow-500 mr-3" size={32} />
                        )}
                        {titleName || 'Game Trophies'}
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => toggleGame(npCommunicationId)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                isHidden
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {isHidden ? (
                                <>
                                    <EyeOff size={16} />
                                    <span>Oculto</span>
                                </>
                            ) : (
                                <>
                                    <Eye size={16} />
                                    <span>Ocultar</span>
                                </>
                            )}
                        </button>
                        {platform && (
                            <span className={`px-3 py-1.5 rounded text-sm font-bold shadow-md ${platform.includes('PS5') ? 'bg-blue-600 text-white' :
                                platform.includes('PS4') ? 'bg-blue-500 text-white' :
                                    platform.includes('VITA') ? 'bg-purple-500 text-white' :
                                        platform.includes('PS3') ? 'bg-gray-600 text-white' :
                                            'bg-gray-500 text-white'
                                }`}>
                                {platform.includes('PS5') ? 'PS5' :
                                    platform.includes('PS4') ? 'PS4' :
                                        platform.includes('VITA') ? 'Vita' :
                                            platform.includes('PS3') ? 'PS3' : 'PSN'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex gap-2 mb-8">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${filter === 'all'
                            ? 'bg-purple-500 text-white shadow shadow-purple-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('earned')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${filter === 'earned'
                            ? 'bg-green-500 text-white shadow shadow-green-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Obtenidos
                    </button>
                    <button
                        onClick={() => setFilter('unearned')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${filter === 'unearned'
                            ? 'bg-red-500 text-white shadow shadow-red-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        No obtenidos
                    </button>
                </div>

                <div className="space-y-8">
                    {Object.keys(groupedTrophies).map((groupId) => {
                        const groupName = groupId === 'default'
                            ? 'Base Game'
                            : (trophyGroupNames[groupId] || `DLC: ${groupId}`);
                        let trophies = groupedTrophies[groupId];

                        // Apply filter
                        if (filter === 'earned') {
                            trophies = trophies.filter(t => t.earned);
                        } else if (filter === 'unearned') {
                            trophies = trophies.filter(t => !t.earned);
                        }

                        // Skip empty groups after filtering
                        if (trophies.length === 0) return null;

                        return (
                            <div key={groupId}>
                                <h2 className="text-xl font-semibold mb-3 flex items-center text-purple-400">
                                    <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                                    {groupName}
                                </h2>

                                {/* Trophy Statistics */}
                                <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex flex-wrap justify-center gap-8 text-center">
                                        {['platinum', 'gold', 'silver', 'bronze'].map(type => {
                                            const total = trophies.filter(t => t.trophyType === type).length;
                                            const earned = trophies.filter(t => t.trophyType === type && t.earned).length;
                                            const pending = total - earned;

                                            // PSN Point values
                                            const pointValues = { bronze: 15, silver: 30, gold: 90, platinum: 300 };
                                            const pendingPoints = pending * pointValues[type];

                                            if (total === 0) return null;

                                            return (
                                                <div key={type} className="flex flex-col">
                                                    <div className={`text-2xl font-bold ${type === 'platinum' ? 'text-blue-300' :
                                                        type === 'gold' ? 'text-yellow-300' :
                                                            type === 'silver' ? 'text-gray-300' :
                                                                'text-orange-300'
                                                        }`}>
                                                        {earned}/{total}
                                                    </div>
                                                    <div className="text-xs text-gray-500 uppercase mt-1">{type}</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {pending > 0 ? (
                                                            <>
                                                                <span>{pending} pendiente{pending > 1 ? 's' : ''}</span>
                                                                <span className="block text-[10px] text-yellow-500/80">+{pendingPoints} pts</span>
                                                            </>
                                                        ) : '✓ Completo'}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {(() => {
                                            const totalTrophies = trophies.length;
                                            const totalEarned = trophies.filter(t => t.earned).length;
                                            const totalPending = totalTrophies - totalEarned;

                                            if (totalTrophies === 0 || trophies.every(t => t.earned)) return null;

                                            return (
                                                <>
                                                    <div className="hidden sm:block w-px bg-white/10 self-stretch my-2"></div>
                                                    <div className="flex flex-col">
                                                        <div className="text-2xl font-bold text-white">
                                                            {totalEarned}/{totalTrophies}
                                                        </div>
                                                        <div className="text-xs text-purple-400 uppercase mt-1 font-semibold">TOTAL</div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {totalPending} restante{totalPending > 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Total Points Summary */}
                                    {(() => {
                                        const pointValues = { bronze: 15, silver: 30, gold: 90, platinum: 300 };
                                        const earnedPts = trophies.filter(t => t.earned).reduce((acc, t) => acc + (pointValues[t.trophyType] || 0), 0);
                                        const totalPts = trophies.reduce((acc, t) => acc + (pointValues[t.trophyType] || 0), 0);
                                        if (totalPts === 0) return null;
                                        const pct = Math.round((earnedPts / totalPts) * 100);
                                        return (
                                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Puntos totales</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-32 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-purple-300 font-bold text-sm">
                                                        {earnedPts}
                                                        <span className="text-white/40 font-normal"> / {totalPts} pts</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* === Trophy List with optional Tracking section === */}
                                {(() => {
                                    // Separate trophies with progress tracking (unearned only)
                                    const trackedTrophies = filter === 'unearned'
                                        ? trophies.filter(t => !t.earned && t.trophyProgressTargetValue > 1)
                                        : [];
                                    const trackedIds = new Set(trackedTrophies.map(t => t.trophyId));
                                    const remainingTrophies = filter === 'unearned'
                                        ? trophies.filter(t => !trackedIds.has(t.trophyId))
                                        : trophies;

                                    const renderTrophy = (trophy, index, isTracked = false) => (
                                        <motion.div
                                            key={trophy.trophyId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`flex items-center p-4 rounded-xl border ${
                                                trophy.earned
                                                    ? 'bg-purple-900/20 border-purple-500/30'
                                                    : isTracked
                                                        ? trophy.trophyType === 'platinum' ? 'bg-blue-900/20 border-blue-400/30'
                                                        : trophy.trophyType === 'gold' ? 'bg-amber-400/10 border-amber-400/30'
                                                        : trophy.trophyType === 'silver' ? 'bg-slate-400/10 border-slate-400/25'
                                                        : 'bg-orange-700/15 border-orange-600/30'
                                                    : 'bg-white/5 border-white/5'
                                            } backdrop-blur-sm hover:bg-white/10 transition-colors`}
                                        >
                                            <div className="flex-shrink-0 mr-4 relative">
                                                <img
                                                    src={trophy.trophyIconUrl}
                                                    alt={trophy.trophyName}
                                                    className={`w-16 h-16 rounded-md object-cover ${!trophy.earned ? 'grayscale opacity-50' : ''}`}
                                                />
                                                {trophy.earned && (
                                                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-[#0f0f15]">
                                                        <Unlock size={12} className="text-black" />
                                                    </div>
                                                )}
                                                {/* Guide button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setGuidePopup(trophy);
                                                    }}
                                                    className="absolute -top-2 -left-2 bg-amber-500 hover:bg-amber-400 rounded-full p-1 border-2 border-[#0f0f15] transition-all hover:scale-110 shadow-lg shadow-amber-500/30 z-10"
                                                    title="Ver guía del trofeo"
                                                >
                                                    <BookOpen size={12} className="text-black" />
                                                </button>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <h3 className={`font-bold text-lg leading-tight ${trophy.earned ? 'text-white' : 'text-gray-400'}`}>
                                                        {trophy.trophyName}
                                                        {trophy.trophyNameEs && trophy.trophyNameEs !== trophy.trophyName && (
                                                            <span className="text-sm font-normal text-blue-300 italic"> · {trophy.trophyNameEs}</span>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center shrink-0">
                                                        {trophy.trophyProgressTargetValue > 1 && (
                                                            <div className={`text-lg font-bold mr-4 ${isTracked ? 'text-yellow-300' : 'text-gray-300'}`}>
                                                                {trophy.progress || 0}/{trophy.trophyProgressTargetValue}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col items-end ml-2">
                                                            <span className={`text-xs px-2 py-1 rounded font-mono uppercase tracking-wider
                                                                ${trophy.trophyType === 'platinum' ? 'bg-blue-500/20 text-blue-300' :
                                                                    trophy.trophyType === 'gold' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                        trophy.trophyType === 'silver' ? 'bg-gray-400/20 text-gray-300' :
                                                                            'bg-orange-500/20 text-orange-300'
                                                                }`}>
                                                                {trophy.trophyType}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 mt-1">{trophy.trophyEarnedRate}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Progress bar for tracked trophies */}
                                                {isTracked && trophy.trophyProgressTargetValue > 1 && (
                                                    <div className="mt-1.5 mb-1.5">
                                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(((trophy.progress || 0) / trophy.trophyProgressTargetValue) * 100, 100)}%` }}
                                                                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                                                                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-yellow-500/70 mt-0.5 text-right">
                                                            {Math.round(((trophy.progress || 0) / trophy.trophyProgressTargetValue) * 100)}% completado
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-gray-400 text-sm">{trophy.trophyDetail}</p>
                                                {trophy.trophyDetailEs && (
                                                    <p className="text-blue-300 text-sm mt-1 italic">
                                                        {trophy.trophyDetailEs}
                                                    </p>
                                                )}
                                                {trophy.earned && (
                                                    <div className="mt-2 text-xs text-green-400">
                                                        Earned on {new Date(trophy.earnedDateTime).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );

                                    return (
                                        <>
                                            {/* Tracked trophies section */}
                                            {trackedTrophies.length > 0 && (
                                                <div className="mb-6">
                                                    <div className="flex items-center gap-2.5 mb-3 mt-2">
                                                        <div className="w-1 h-5 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-full" />
                                                        <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                                                            📊 Seguimiento ({trackedTrophies.length})
                                                        </h3>
                                                        <span className="text-[10px] text-gray-500">Trofeos con progreso</span>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {trackedTrophies.map((trophy, index) => renderTrophy(trophy, index, true))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Remaining trophies */}
                                            <div className="space-y-4">
                                                {remainingTrophies.map((trophy, index) => renderTrophy(trophy, index, false))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </div>

                {/* Floating Refresh Button */}
                <button
                    onClick={() => fetchTrophies(true)}
                    disabled={isRefreshing}
                    className="fixed bottom-8 right-8 p-4 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 z-50"
                    title="Actualizar trofeos"
                >
                    <RefreshCw size={24} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Trophy Guide Modal */}
            <AnimatePresence>
                {guidePopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                        onClick={() => setGuidePopup(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={guidePopup.trophyIconUrl}
                                            alt={guidePopup.trophyName}
                                            className="w-14 h-14 rounded-lg object-cover"
                                        />
                                        <div>
                                            <h3 className="text-lg font-bold text-white leading-tight">
                                                {guidePopup.trophyName}
                                            </h3>
                                            {guidePopup.trophyNameEs && guidePopup.trophyNameEs !== guidePopup.trophyName && (
                                                <p className="text-sm text-blue-300 italic">{guidePopup.trophyNameEs}</p>
                                            )}
                                            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider
                                                ${guidePopup.trophyType === 'platinum' ? 'bg-blue-500/20 text-blue-300' :
                                                    guidePopup.trophyType === 'gold' ? 'bg-yellow-500/20 text-yellow-300' :
                                                        guidePopup.trophyType === 'silver' ? 'bg-gray-400/20 text-gray-300' :
                                                            'bg-orange-500/20 text-orange-300'
                                                }`}>
                                                {guidePopup.trophyType}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setGuidePopup(null)}
                                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm mt-3">{guidePopup.trophyDetail}</p>
                                {guidePopup.trophyDetailEs && (
                                    <p className="text-blue-300/70 text-sm mt-1 italic">{guidePopup.trophyDetailEs}</p>
                                )}
                            </div>

                            {/* Guide Links */}
                            <div className="p-6">
                                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <BookOpen size={14} className="text-amber-400" />
                                    Buscar guía en:
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {buildGuideLinks(guidePopup, titleName).map((link) => (
                                        <a
                                            key={link.name}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${link.color} hover:brightness-125 transition-all hover:scale-[1.02] shadow-lg group`}
                                        >
                                            <span className="text-lg">{link.icon}</span>
                                            <span className="text-sm font-semibold text-white truncate">{link.name}</span>
                                            <ExternalLink size={12} className="text-white/50 group-hover:text-white/80 ml-auto shrink-0" />
                                        </a>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-500 mt-4 text-center">
                                    Los enlaces abren una búsqueda del juego en cada web de guías.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GameTrophies;
