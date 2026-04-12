import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';
import UserProfile from '../components/UserProfile';

const ProfileWidget = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

            setProfile(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching PSN profile for widget:", err);
            setError("Error loading profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch initially
        fetchProfile();

        // Set up interval for every 5 minutes (300000 ms)
        const intervalId = setInterval(() => {
            fetchProfile();
        }, 300000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, []);

    // Widget specific clean background
    return (
        <div className="min-h-screen bg-[#0f0f15] text-white flex items-center justify-center p-6 bg-transparent">
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
                </div>
            ) : null}
        </div>
    );
};

export default ProfileWidget;
