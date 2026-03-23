import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

// Parse ISO 8601 duration (PT228H56M33S) → "228h 56min" or "45min"
const parsePlayDuration = (duration) => {
    if (!duration) return null;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return null;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    if (hours === 0 && minutes === 0) return null;
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
};

const TrophyCard = ({ title }) => {
    // Check if platinum trophy is earned
    const hasPlatinum = title.earnedTrophies?.platinum > 0;
    const is100 = title.progress === 100;
    const isSpecial = hasPlatinum || is100;
    const playTime = parsePlayDuration(title.playDuration);

    // Neon style: platinum = cyan/blue, 100% without platinum = gold
    const neonColor = hasPlatinum
        ? { ring: '#60c8ff', glow: '0 0 8px 2px #60c8ff, 0 0 24px 6px #3b82f6, 0 0 48px 10px #1d4ed840' }
        : { ring: '#facc15', glow: '0 0 8px 2px #facc15, 0 0 24px 6px #f59e0b, 0 0 48px 10px #92400e40' };

    // Platform badge styling
    const getPlatformInfo = (platform) => {
        if (platform?.includes('PS5')) return { text: 'PS5', color: 'bg-blue-600' };
        if (platform?.includes('PS4')) return { text: 'PS4', color: 'bg-blue-500' };
        if (platform?.includes('VITA')) return { text: 'Vita', color: 'bg-purple-500' };
        if (platform?.includes('PS3')) return { text: 'PS3', color: 'bg-gray-600' };
        return { text: 'PSN', color: 'bg-gray-500' };
    };

    const platformInfo = getPlatformInfo(title.trophyTitlePlatform);

    return (
        <Link to={`/game/${title.npCommunicationId}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ duration: 0.2 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                style={isSpecial ? {
                    border: `2px solid ${neonColor.ring}`,
                    boxShadow: neonColor.glow,
                } : {
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                {/* Game Image */}
                <div className="relative h-40 overflow-hidden">
                    <img
                        src={title.trophyTitleIconUrl}
                        alt={title.trophyTitleName}
                        className="w-full h-full object-cover"
                    />
                    {/* Platform Badge */}
                    <div className={`absolute top-2 right-2 ${platformInfo.color} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {platformInfo.text}
                    </div>
                    {/* Platinum Badge */}
                    {hasPlatinum && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1"
                            style={{ boxShadow: '0 0 8px 2px #60c8ff80' }}>
                            <Trophy size={12} />
                            Platino
                        </div>
                    )}
                    {/* 100% badge (no platinum) */}
                    {is100 && !hasPlatinum && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1"
                            style={{ boxShadow: '0 0 8px 2px #facc1580' }}>
                            ✓ 100%
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0f0f15] to-transparent"></div>
                </div>

                {/* Game Info */}
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{title.trophyTitleName}</h3>

                    {/* Trophy Counts */}
                    <div className="flex justify-between items-center text-sm mb-3">
                        <div className="flex gap-2">
                            {title.definedTrophies?.platinum > 0 && (
                                <span className="text-blue-300 flex items-center gap-1">
                                    <Trophy size={14} /> {title.earnedTrophies?.platinum || 0}/{title.definedTrophies?.platinum || 0}
                                </span>
                            )}
                            <span className="text-yellow-300">
                                {title.earnedTrophies?.gold || 0}/{title.definedTrophies?.gold || 0}
                            </span>
                            <span className="text-gray-300">
                                {title.earnedTrophies?.silver || 0}/{title.definedTrophies?.silver || 0}
                            </span>
                            <span className="text-orange-300">
                                {title.earnedTrophies?.bronze || 0}/{title.definedTrophies?.bronze || 0}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isSpecial
                                    ? hasPlatinum
                                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                                        : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                    : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                }`}
                            style={{ width: `${title.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{title.progress}% completado</p>
                    {playTime && (
                        <p className="text-xs text-gray-500 mt-0.5 text-right flex items-center justify-end gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            {playTime}
                        </p>
                    )}
                </div>
            </motion.div>
        </Link>
    );
};

export default TrophyCard;
