/**
 * Servidor de producción para Docker.
 * Sirve la API de Express + el frontend estático compilado por Vite.
 */
import app from './api/index.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT, 10) || 3001;

// Servir archivos estáticos del build de Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback: cualquier ruta que no sea /api/* devuelve index.html (SPA routing)
app.get('*', (req, res, next) => {
    // No interceptar las rutas de la API
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
};

app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`\n🐳 PSN-React Docker Server`);
    console.log(`──────────────────────────────`);
    console.log(`  Local:    http://localhost:${PORT}`);
    console.log(`  Network:  http://${localIP}:${PORT}`);
    console.log(`  Mode:     ${process.env.NODE_ENV || 'development'}`);
    console.log(`──────────────────────────────\n`);
});
