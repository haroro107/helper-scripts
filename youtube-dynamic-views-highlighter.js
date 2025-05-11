// ==UserScript==
// @name         YouTube Dynamic Views Highlighter
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Toggle coloring of YouTube view counts plus a stats panel—now uses DOM APIs only (no innerHTML). Skips iframes (e.g. live chat).​
// @author       haroro107
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // don’t run in iframes
    if (window.top !== window.self) return;

    let isColored = false;
    let stats = { min: 0, max: 0, low: 0, mid: 0, high: 0 };

    function parseViews(text) {
        text = text.toLowerCase().replace(/views?/, '').trim();
        let mul = 1;
        if (text.endsWith('m')) { mul = 1e6; text = text.slice(0, -1); }
        if (text.endsWith('k')) { mul = 1e3; text = text.slice(0, -1); }
        return parseFloat(text.replace(/[, ]/g, '')) * mul || 0;
    }

    function updateStats(counts) {
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const delta = max - min || 1;
        let low=0, mid=0, high=0;
        counts.forEach(v => {
            const pct = (v - min) / delta;
            if (pct < 1/3) low++;
            else if (pct < 2/3) mid++;
            else high++;
        });
        stats = { min, max, low, mid, high };
        renderStatsPanel();
    }

    function colorize() {
        const elems = Array.from(document.querySelectorAll('span.inline-metadata-item'))
                           .filter(el => /views?/i.test(el.textContent));
        const counts = elems.map(el => parseViews(el.textContent));
        if (!counts.length) return;

        const min = Math.min(...counts), max = Math.max(...counts), delta = max - min || 1;
        elems.forEach(el => {
            const pct = (parseViews(el.textContent) - min) / delta;
            let bg, fg = '#fff';
            if (pct < 1/3)       bg = '#e57373';
            else if (pct < 2/3)  { bg = '#ffd54f'; fg = '#000'; }
            else                 bg = '#81c784';
            Object.assign(el.style, {
                backgroundColor: bg,
                color: fg,
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'background-color .2s ease'
            });
        });

        updateStats(counts);
    }

    function reset() {
        document.querySelectorAll('span.inline-metadata-item').forEach(el => {
            if (/views?/i.test(el.textContent)) el.style.cssText = '';
        });
        stats = { min: 0, max: 0, low: 0, mid: 0, high: 0 };
        renderStatsPanel();
    }

    // Stats panel
    const panel = document.createElement('div');
    Object.assign(panel.style, {
        position: 'fixed',
        bottom: '70px',
        right: '20px',
        width: '200px',
        padding: '10px',
        fontFamily: 'sans-serif',
        fontSize: '13px',
        background: 'rgba(50,50,50,0.9)',
        color: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        display: 'none',
        zIndex: 10001,
        lineHeight: '1.4'
    });
    document.body.appendChild(panel);

    function renderStatsPanel() {
        // clear existing
        while (panel.firstChild) {
            panel.removeChild(panel.firstChild);
        }

        if (!stats.max) {
            const em = document.createElement('em');
            em.textContent = 'No data';
            panel.appendChild(em);
            return;
        }

        // Title
        const title = document.createElement('strong');
        title.textContent = 'Views Stats';
        panel.appendChild(title);
        panel.appendChild(document.createElement('br'));

        // Lowest
        panel.appendChild(document.createTextNode(`Lowest: ${stats.min.toLocaleString()}`));
        panel.appendChild(document.createElement('br'));

        // Highest
        panel.appendChild(document.createTextNode(`Highest: ${stats.max.toLocaleString()}`));
        panel.appendChild(document.createElement('hr')).style.border = '1px solid #666';

        // Low category
        const lowSpan = document.createElement('span');
        lowSpan.style.color = '#e57373';
        lowSpan.textContent = 'Low (<1/3):';
        panel.appendChild(lowSpan);
        panel.appendChild(document.createTextNode(` ${stats.low}`));
        panel.appendChild(document.createElement('br'));

        // Mid category
        const midSpan = document.createElement('span');
        midSpan.style.color = '#ffd54f';
        midSpan.textContent = 'Mid:';
        panel.appendChild(midSpan);
        panel.appendChild(document.createTextNode(` ${stats.mid}`));
        panel.appendChild(document.createElement('br'));

        // High category
        const highSpan = document.createElement('span');
        highSpan.style.color = '#81c784';
        highSpan.textContent = 'High (>2/3):';
        panel.appendChild(highSpan);
        panel.appendChild(document.createTextNode(` ${stats.high}`));
    }

    // Control buttons container
    const ctrl = document.createElement('div');
    Object.assign(ctrl.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
        zIndex: 10000
    });
    document.body.appendChild(ctrl);

    // Highlight / Reset button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Highlight Views';
    Object.assign(toggleBtn.style, {
        padding: '0.6em 1em',
        fontSize: '14px',
        fontFamily: 'sans-serif',
        background: '#1e88e5',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'transform .1s, background .2s'
    });
    toggleBtn.addEventListener('mouseenter', () => toggleBtn.style.transform = 'scale(1.05)');
    toggleBtn.addEventListener('mouseleave', () => toggleBtn.style.transform = 'scale(1)');
    toggleBtn.addEventListener('click', () => {
        if (!isColored) {
            colorize();
            toggleBtn.textContent = 'Reset Views';
            toggleBtn.style.background = '#e53935';
        } else {
            reset();
            toggleBtn.textContent = 'Highlight Views';
            toggleBtn.style.background = '#1e88e5';
        }
        isColored = !isColored;
    });
    ctrl.appendChild(toggleBtn);

    // Show/Hide panel button
    const infoBtn = document.createElement('button');
    infoBtn.textContent = 'Stats';
    Object.assign(infoBtn.style, {
        padding: '0.6em 0.8em',
        fontSize: '14px',
        fontFamily: 'sans-serif',
        background: '#555',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'transform .1s'
    });
    infoBtn.addEventListener('mouseenter', () => infoBtn.style.transform = 'scale(1.05)');
    infoBtn.addEventListener('mouseleave', () => infoBtn.style.transform = 'scale(1)');
    infoBtn.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    ctrl.appendChild(infoBtn);

    // Reapply on YouTube SPA navigation
    window.addEventListener('yt-navigate-finish', () => {
        if (isColored) colorize();
    });
})();
