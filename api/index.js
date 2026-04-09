import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as psnApi from 'psn-api';
const { exchangeNpssoForCode, exchangeCodeForAccessToken, getUserTitles, getProfileFromAccountId, getUserTrophyProfileSummary, getUserTrophiesEarnedForTitle, getTitleTrophies, getTitleTrophyGroups, getUserPlayedGames } = psnApi;
import * as translatePkg from 'translate-google-api';
const translate = translatePkg.default || translatePkg;

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// In-memory caches for stateless environment
// Vercel reuse instances, but don't count on it 100%
const tokenCache = new Map();
const translationCache = new Map();

const authenticate = async (npsso) => {
    if (!npsso || npsso.length !== 64) return null;

    if (tokenCache.has(npsso)) {
        const cached = tokenCache.get(npsso);
        if (Date.now() < cached.expiresAt) {
            console.log(`[AUTH] Using cached token for NPSSO: ${npsso.substring(0, 5)}...`);
            return cached.token;
        }
    }

    try {
        console.log(`[AUTH] Starting fresh PSN authentication...`);
        const accessCode = await exchangeNpssoForCode(npsso);
        const authorization = await exchangeCodeForAccessToken(accessCode);

        console.log(`[AUTH] Success. Token obtained.`);
        tokenCache.set(npsso, {
            token: authorization.accessToken,
            expiresAt: Date.now() + (50 * 60 * 1000)
        });

        return authorization.accessToken;
    } catch (error) {
        console.error('[AUTH] PSN Error:', error.message);
        return null;
    }
};

// Stateless helper middleware
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        req.npsso = authHeader.split(' ')[1];
    } else {
        req.npsso = process.env.NPSSO || null;
    }
    next();
});

const getAccountIdFromToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(base64, 'base64').toString('binary');
        const jsonPayload = decodeURIComponent(decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload).account_id;
    } catch (e) {
        return null;
    }
};

// Use a router for both /api and root paths to handle Vercel rewrites correctly
const router = express.Router();

router.get('/auth/status', async (req, res) => {
    console.log("[API] GET /auth/status");
    const token = await authenticate(req.npsso);
    res.json({ authenticated: !!token, hasNpsso: !!req.npsso });
});

router.post('/api/auth/login', async (req, res) => {
    // Handling both possible prefixes
    const { npsso } = req.body;
    const token = await authenticate(npsso);
    if (token) res.json({ success: true });
    else res.status(401).json({ error: 'Fallo al autenticar.' });
});

// Alias for generic login path
router.post('/auth/login', async (req, res) => {
    const { npsso } = req.body;
    const token = await authenticate(npsso);
    if (token) res.json({ success: true });
    else res.status(401).json({ error: 'Fallo al autenticar.' });
});

router.post('/auth/logout', (req, res) => {
    console.log("[API] POST /auth/logout");
    if (req.npsso) tokenCache.delete(req.npsso);
    res.json({ success: true });
});

router.get('/profile/me', async (req, res) => {
    console.log("[API] GET /api/profile/me");
    const accessToken = await authenticate(req.npsso);
    if (!accessToken) return res.status(401).json({ error: 'Sesión expirada.' });

    const accountId = getAccountIdFromToken(accessToken);
    if (!accountId) return res.status(500).json({ error: 'ID de cuenta no encontrado.' });

    try {
        const [profile, trophySummary] = await Promise.all([
            getProfileFromAccountId({ accessToken }, accountId),
            getUserTrophyProfileSummary({ accessToken }, accountId)
        ]);
        res.json({ ...profile, trophySummary });
    } catch (error) {
        console.error("[PROFILE ERROR]", error.message);
        res.status(500).json({ error: "Error de Sony: " + error.message, code: error.code });
    }
});

router.get('/trophies/me', async (req, res) => {
    console.log("[API] GET /api/trophies/me");
    const accessToken = await authenticate(req.npsso);
    if (!accessToken) return res.status(401).json({ error: 'Sesión expirada.' });

    const accountId = getAccountIdFromToken(accessToken);
    if (!accountId) return res.status(500).json({ error: 'ID de cuenta no encontrado.' });

    try {
        // Fetch ALL titles by paginating through the PSN API
        const PAGE_SIZE = 800;
        let offset = 0;
        let allTitles = [];
        let totalCount = null;

        do {
            const page = await getUserTitles({ accessToken }, accountId, { limit: PAGE_SIZE, offset });
            if (totalCount === null) {
                totalCount = page.totalItemCount || 0;
            }
            const batch = page.trophyTitles || [];
            allTitles = allTitles.concat(batch);
            offset += batch.length;

            // Stop if we got everything or the page returned nothing new
            if (batch.length === 0 || allTitles.length >= totalCount) break;
        } while (true);

        // Fetch played games to get playDuration, paginating if needed
        let playedGamesMap = {};
        let playedGamesByNamePlatform = {}; // name+platform → duration
        let playedGamesByName = {};         // name → duration (fallback)
        try {
            let pgOffset = 0;
            let pgTotal = null;
            do {
                const pgPage = await getUserPlayedGames({ accessToken }, 'me', { limit: 200, offset: pgOffset });
                if (pgTotal === null) pgTotal = pgPage.totalItemCount || 0;
                const pgBatch = pgPage.titles || [];
                pgBatch.forEach(g => {
                    const duration = g.playDuration || null;
                    if (duration) {
                        playedGamesMap[g.titleId] = duration;
                        // Map by name+platform for PS4/PS5 distinction
                        const cat = g.category || '';
                        if (g.name) {
                            const key = g.name.toLowerCase() + '|' + cat;
                            playedGamesByNamePlatform[key] = duration;
                            playedGamesByName[g.name.toLowerCase()] = duration;
                        }
                        if (g.localizedName) {
                            const key = g.localizedName.toLowerCase() + '|' + cat;
                            playedGamesByNamePlatform[key] = duration;
                            playedGamesByName[g.localizedName.toLowerCase()] = duration;
                        }
                    }
                });
                pgOffset += pgBatch.length;
                if (pgBatch.length === 0 || pgOffset >= pgTotal) break;
            } while (true);
        } catch (pgErr) {
            console.warn('[PLAYED GAMES] Could not fetch play durations:', pgErr.message);
        }

        // Merge playDuration into each trophy title
        // Tiered fallback: titleId → name+platform → name only
        allTitles = allTitles.map(t => {
            const plat = t.trophyTitlePlatform || '';
            const cat = plat.includes('PS5') ? 'ps5_native_game'
                      : plat.includes('PS4') ? 'ps4_game'
                      : '';
            const nameLower = t.trophyTitleName?.toLowerCase();
            return {
                ...t,
                playDuration:
                    playedGamesMap[t.npCommunicationId] ||
                    (nameLower && cat ? playedGamesByNamePlatform[nameLower + '|' + cat] : null) ||
                    (nameLower ? playedGamesByName[nameLower] : null) ||
                    null
            };
        });

        // Sort by last played (lastUpdatedDateTime) instead of last trophy earned
        allTitles.sort((a, b) => new Date(b.lastUpdatedDateTime) - new Date(a.lastUpdatedDateTime));

        res.json({ trophyTitles: allTitles, totalItemCount: allTitles.length });
    } catch (error) {
        console.error("[TROPHIES ERROR]", error.message);
        res.status(500).json({ error: "Error de Sony: " + error.message });
    }
});

router.get('/titles/:npCommunicationId/trophies', async (req, res) => {
    const { npCommunicationId } = req.params;
    const accessToken = await authenticate(req.npsso);
    if (!accessToken) return res.status(401).json({ error: 'Sesión expirada.' });

    const accountId = getAccountIdFromToken(accessToken);
    if (!accountId) return res.status(500).json({ error: 'ID de cuenta no encontrado.' });

    try {
        const titlesResponse = await getUserTitles({ accessToken }, accountId);
        const titleInfo = titlesResponse.trophyTitles.find(t => t.npCommunicationId === npCommunicationId);
        const titleName = titleInfo ? titleInfo.trophyTitleName : 'Juego';
        const serviceName = titleInfo?.npServiceName || (titleInfo?.trophyTitlePlatform?.includes('PS5') ? 'trophy2' : 'trophy');

        const [staticTrophies, userTrophies, trophyGroupsResponse] = await Promise.all([
            getTitleTrophies({ accessToken }, npCommunicationId, 'all', { npServiceName: serviceName }),
            getUserTrophiesEarnedForTitle({ accessToken }, accountId, npCommunicationId, 'all', { limit: 300, npServiceName: serviceName }),
            getTitleTrophyGroups({ accessToken }, npCommunicationId, { npServiceName: serviceName })
        ]);

        const trophyGroups = {};
        trophyGroupsResponse.trophyGroups.forEach(g => {
            trophyGroups[g.trophyGroupId] = g.trophyGroupName;
        });

        const mergedTrophies = staticTrophies.trophies.map(t => {
            const earned = userTrophies.trophies.find(u => u.trophyId === t.trophyId);
            return {
                ...t,
                ...earned,
                earned: earned ? earned.earned : false,
                earnedDateTime: earned ? earned.earnedDateTime : null,
                trophyEarnedRate: earned ? earned.trophyEarnedRate : (t.trophyEarnedRate || "0.0")
            };
        });

        // Comprehensive Translation Support
        const translationTasks = [];

        // Game title: NOT translated (keep original name)

        // 2. Trophy Groups
        for (const [groupId, groupName] of Object.entries(trophyGroups)) {
            const groupKey = `group_${npCommunicationId}_${groupId}`;
            if (!translationCache.has(groupKey)) {
                translationTasks.push({ key: groupKey, text: groupName, type: 'group' });
            }
        }

        // 3. Trophy Names and Details
        mergedTrophies.forEach(t => {
            const nameKey = `name_${npCommunicationId}_${t.trophyId}`;
            const detailKey = `detail_${npCommunicationId}_${t.trophyId}`;

            if (!translationCache.has(nameKey)) {
                translationTasks.push({ key: nameKey, text: t.trophyName, type: 'name' });
            }
            if (!translationCache.has(detailKey)) {
                translationTasks.push({ key: detailKey, text: t.trophyDetail, type: 'detail' });
            }
        });

        if (translationTasks.length > 0) {
            try {
                console.log(`[TRANS] Translating ${translationTasks.length} items for ${titleName}...`);
                const textsToTranslate = translationTasks.map(task => task.text);
                const translations = await translate(textsToTranslate, { to: 'es' });

                translationTasks.forEach((task, index) => {
                    const translatedText = Array.isArray(translations) ? translations[index] : translations;
                    translationCache.set(task.key, translatedText);
                });
            } catch (error) {
                console.error("[TRANS ERROR]", error.message);
            }
        }

        const finalTrophies = mergedTrophies.map(t => ({
            ...t,
            trophyNameEs: translationCache.get(`name_${npCommunicationId}_${t.trophyId}`) || null,
            trophyDetailEs: translationCache.get(`detail_${npCommunicationId}_${t.trophyId}`) || null
        }));

        const finalTrophyGroups = {};
        for (const [groupId, groupName] of Object.entries(trophyGroups)) {
            finalTrophyGroups[groupId] = translationCache.get(`group_${npCommunicationId}_${groupId}`) || groupName;
        }

        res.json({
            trophies: finalTrophies,
            titleName: titleName,
            platform: titleInfo?.trophyTitlePlatform || '',
            trophyGroups: finalTrophyGroups
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Map router to both /api and root
app.use('/api', router);
app.use('/', router);

export default app;
