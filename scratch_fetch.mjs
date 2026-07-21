// Test Node 18 native fetch
try {
    const resp = await fetch('https://psnprofiles.com/JMgranaGaming', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    });
    console.log('Status:', resp.status);
    if (resp.ok) {
        const html = await resp.text();
        const flat = html.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
        const w = flat.match(/([\d,]+)\s*<span>\s*World Rank\s*<\/span>/i);
        const c = flat.match(/([\d,]+)\s*<span>\s*Country Rank\s*<\/span>/i);
        console.log('World Rank:', w ? w[1] : 'NOT FOUND');
        console.log('Country Rank:', c ? c[1] : 'NOT FOUND');
    }
} catch (err) {
    console.error('Error:', err.message);
}
