// ==UserScript==
// @name         Nyaa.si Filter & Sort
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Filter by downloads & sort by download or rate per day on nyaa.si. Handles rows added by auto-pager (PageTuil) via MutationObserver.
// @author       Your Name
// @match        https://nyaa.si/*
// @match        *.nyaa.si/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- UI Setup ---
    const wrapper = document.createElement('div');
    wrapper.style = 'margin-bottom:10px; display:flex; gap:10px; align-items:center;';

    // helper to style selects
    function styleSelect(sel) {
        sel.style.padding = '5px';
        sel.style.borderRadius = '5px';
        sel.style.border = '1px solid #ccc';
    }

    // 1) Filter minimum downloads (first option as label)
    const filterSelect = document.createElement('select');
    [{v:'',      t:'Filter'}, {v:'1000',  t:'>1000'}, {v:'5000',  t:'>5000'}, {v:'10000', t:'>10000'}]
      .forEach(o => filterSelect.append(Object.assign(document.createElement('option'), {value:o.v, textContent:o.t})));
    styleSelect(filterSelect);
    wrapper.append(filterSelect);

    // 2) Sort by metric (embedded label)
    const metricSelect = document.createElement('select');
    [{v:'',        t:'Sort by'}, {v:'download',t:'Download'}, {v:'rate',    t:'Rate per Day'}]
      .forEach(o => metricSelect.append(Object.assign(document.createElement('option'), {value:o.v, textContent:o.t})));
    styleSelect(metricSelect);
    wrapper.append(metricSelect);

    // 3) Order (first option as label)
    const orderSelect = document.createElement('select');
    [{v:'',     t:'-'}, {v:'asc',  t:'Ascending'}, {v:'desc', t:'Descending'}]
      .forEach(o => orderSelect.append(Object.assign(document.createElement('option'), {value:o.v, textContent:o.t})));
    styleSelect(orderSelect);
    wrapper.append(orderSelect);

    const tableDiv = document.querySelector('div.table-responsive');
    if (!tableDiv) return;
    tableDiv.parentNode.insertBefore(wrapper, tableDiv);

    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    // --- helpers ---
    function extractDownloads(text) {
        if (!text) return 0;
        // remove commas and non-digit characters, then pick first full number
        const m = text.replace(/,/g,'').match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
    }

    // Initialize a row's dl dataset if missing
    function initRowDownloadDataset(r) {
        if (!r) return;
        const dlCell = r.querySelector('td:last-child');
        if (!dlCell) return;
        if (dlCell.dataset.original) return; // already initialized
        const raw = dlCell.textContent.trim();
        const num = extractDownloads(raw);
        dlCell.dataset.original = String(num);
    }

    // Init existing rows (first pass)
    Array.from(tbody.querySelectorAll('tr')).forEach(initRowDownloadDataset);

    // Debounce utility
    function debounce(fn, wait) {
        let t;
        return function(...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    // --- main function ---
    function applyAll() {
        const minDL   = parseInt(filterSelect.value, 10) || 0;
        const metric  = metricSelect.value;
        const order   = orderSelect.value;
        const rows    = Array.from(tbody.querySelectorAll('tr'));
        const now     = Date.now();

        // Ensure every row has dataset.original (handles newly added rows)
        rows.forEach(initRowDownloadDataset);

        // 1) Filter
        rows.forEach(r => {
            const dlCell = r.querySelector('td:last-child');
            const dl = dlCell ? (parseInt(dlCell.dataset.original, 10) || 0) : 0;
            r.style.display = dl < minDL ? 'none' : '';
        });

        // 2) No sorting -> restore originals and stop
        if (!metric || !order) {
            rows.forEach(r => {
                const c = r.querySelector('td:last-child');
                if (c && c.dataset.original !== undefined) {
                    c.textContent = c.dataset.original;
                }
            });
            return;
        }

        // 3) Compute keys & update cell display
        const visibleRows = rows.filter(r => r.style.display !== 'none');
        const toSort = visibleRows.map(r => {
            const dlCell = r.querySelector('td:last-child');
            const orig   = dlCell ? (parseInt(dlCell.dataset.original, 10) || 0) : 0;
            let key = 0;

            if (metric === 'download') {
                key = orig;
                if (dlCell) dlCell.textContent = String(orig);
            } else {
                // find timestamp cell (some rows include a data-timestamp attr on a td)
                const tsCell = r.querySelector('td[data-timestamp]');
                let days = 1;
                if (tsCell && tsCell.dataset && tsCell.dataset.timestamp) {
                    const ts = parseInt(tsCell.dataset.timestamp, 10) * 1000;
                    days = Math.max((now - ts) / (1000*60*60*24), 1);
                } else {
                    // fallback: attempt to parse date text in a .meta or similar cell
                    days = 1; // fallback safe default
                }
                key = orig / days;
                if (dlCell) dlCell.textContent = `${orig} (${key.toFixed(2)})`;
            }
            return {row: r, key};
        });

        // 4) Sort
        toSort.sort((a, b) => order === 'asc' ? a.key - b.key : b.key - a.key);

        // 5) Re-append visible sorted rows in that order (hidden rows remain where they were)
        toSort.forEach(obj => tbody.appendChild(obj.row));
    }

    const applyAllDebounced = debounce(applyAll, 120);

    // --- listeners ---
    [filterSelect, metricSelect, orderSelect].forEach(el =>
        el.addEventListener('change', applyAll)
    );

    // --- MutationObserver to detect rows added by auto-pager (PageTuil) ---
    const mo = new MutationObserver(muts => {
        let added = false;
        for (const m of muts) {
            if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1 && node.matches && node.matches('tr')) {
                        initRowDownloadDataset(node);
                        added = true;
                    } else if (node.nodeType === 1) {
                        // maybe a wrapper containing multiple rows
                        const trs = node.querySelectorAll && node.querySelectorAll('tr');
                        if (trs && trs.length) {
                            trs.forEach(initRowDownloadDataset);
                            added = true;
                        }
                    }
                }
            }
        }
        if (added) applyAllDebounced();
    });

    mo.observe(tbody, { childList: true, subtree: true });

    // in case rows get inserted elsewhere (some sites replace the whole table), also observe parent
    const table = document.querySelector('table');
    if (table && table.parentNode) {
        const parentMo = new MutationObserver(muts => {
            // re-init and re-apply (debounced)
            let need = false;
            for (const m of muts) {
                if (m.type === 'childList') {
                    need = true;
                    break;
                }
            }
            if (need) applyAllDebounced();
        });
        parentMo.observe(table.parentNode, { childList: true, subtree: false });
    }

    // run once at load
    applyAll();

})();
