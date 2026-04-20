import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import UserProfile from '../components/UserProfile';
import trophySound from '../assets/sound/gold, silver, bronze.mp3';
import platinumSound from '../assets/sound/platinum.mp3';

const REFRESH_INTERVAL = 300; // seconds (5 min)

// Plays the corresponding trophy sound effect
const playTrophyChime = (type = 'trophy') => {
    try {
        const sound = type === 'platinum' ? platinumSound : trophySound;
        const audio = new Audio(sound);
        audio.play();
    } catch (e) {
        console.warn('[WIDGET] Could not play sound:', e.message);
    }
};

const getTotalCount = (p) => {
    if (!p?.trophySummary?.earnedTrophies) return 0;
    const e = p.trophySummary.earnedTrophies;
    return (e.platinum || 0) + (e.gold || 0) + (e.silver || 0) + (e.bronze || 0);
};

const ProfileWidget = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [secondsSince, setSecondsSince] = useState(0);
    const lastRefreshRef = useRef(Date.now());
    const prevProfileRef = useRef(null);

    const fetchProfile = async () => {
        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.')
                ? `http://${window.location.hostname}:3001`
                : '';

            const npsso = localStorage.getItem('psn_npsso');
            const response = await axios.get(`${API_URL}/api/profile/me`, {
                headers: npsso ? { 'Authorization': `Bearer ${npsso}` } : {},
                timeout: 20000
            });

            const newProfile = response.data;
            const prev = prevProfileRef.current;

            // Compare trophy counts and play chime if something changed
            if (prev !== null) {
                const prevTotal = getTotalCount(prev);
                const newTotal = getTotalCount(newProfile);
                const prevPlat = prev.trophySummary?.earnedTrophies?.platinum || 0;
                const newPlat = newProfile.trophySummary?.earnedTrophies?.platinum || 0;

                if (newTotal > prevTotal) {
                    // Platinum is the most special
                    playTrophyChime(newPlat > prevPlat ? 'platinum' : 'trophy');
                }
            }

            prevProfileRef.current = newProfile;
            setProfile(newProfile);
            setError(null);
        } catch (err) {
            console.error("Error fetching PSN profile for widget:", err);
            setError("Error loading profile");
        } finally {
            setLoading(false);
            lastRefreshRef.current = Date.now();
            setSecondsSince(0);
        }
    };

    useEffect(() => {
        fetchProfile();

        // Auto-refresh every 5 minutes
        const fetchInterval = setInterval(fetchProfile, REFRESH_INTERVAL * 1000);

        // Tick the elapsed time counter every second
        const tickInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - lastRefreshRef.current) / 1000);
            setSecondsSince(elapsed);
        }, 1000);

        return () => {
            clearInterval(fetchInterval);
            clearInterval(tickInterval);
        };
    }, []);

    const remaining = Math.max(REFRESH_INTERVAL - secondsSince, 0);

    const formatRemaining = (s) => {
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        const rem = s % 60;
        return `${m}m ${rem.toString().padStart(2, '0')}s`;
    };

    const progress = Math.max(100 - (secondsSince / REFRESH_INTERVAL) * 100, 0);

    return (
        <div className="min-h-screen bg-[#0f0f15] text-white flex flex-col items-center justify-center p-6">
            {loading && !profile ? (
                <div className="flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-purple-500 mb-4" size={32} />
                </div>
            ) : error && !profile ? (
                <div className="text-red-500 flex items-center gap-2">
                    <AlertCircle size={24} />
                    <span>{error}</span>
                </div>
            ) : profile ? (
                <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500">
                    <UserProfile profile={profile} />

                    {/* Countdown bar */}
                    <div className="flex items-center gap-3 px-1">
                        <RefreshCw size={11} className="text-gray-600 flex-shrink-0" />
                        <div className="flex-1 bg-white/5 rounded-full h-1 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-none"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[11px] text-gray-600 font-mono tabular-nums w-14 text-right">
                            {formatRemaining(remaining)}
                        </span>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ProfileWidget;
