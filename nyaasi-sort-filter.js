// ==UserScript==
// @name         Nyaa.si Filter & Sort (Download / Rate with Styled Selects)
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Filter by downloads & sort by download or rate per day on nyaa.si, with styled selects and embedded labels in options
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
    [{v:'',      t:'Filter'},
     {v:'1000',  t:'>1000'},
     {v:'5000',  t:'>5000'},
     {v:'10000', t:'>10000'}]
      .forEach(o => filterSelect.append(Object.assign(document.createElement('option'), {value:o.v, textContent:o.t})));
    styleSelect(filterSelect);
    wrapper.append(filterSelect);

    // 2) Sort by metric (embedded label)
    const metricSelect = document.createElement('select');
    [{v:'',        t:'Sort by'},
     {v:'download',t:'Download'},
     {v:'rate',    t:'Rate per Day'}]
      .forEach(o => metricSelect.append(Object.assign(document.createElement('option'), {value:o.v, textContent:o.t})));
    styleSelect(metricSelect);
    wrapper.append(metricSelect);

    // 3) Order (first option as label)
    const orderSelect = document.createElement('select');
    [{v:'',     t:'-'},
     {v:'asc',  t:'Ascending'},
     {v:'desc', t:'Descending'}]
      .forEach(o => orderSelect.append(Object.assign(document.createElement('option'), {value:o.v, textContent:o.t})));
    styleSelect(orderSelect);
    wrapper.append(orderSelect);

    const tableDiv = document.querySelector('div.table-responsive');
    if (!tableDiv) return;
    tableDiv.parentNode.insertBefore(wrapper, tableDiv);

    // --- store original download text ---
    const rowsInit = Array.from(document.querySelectorAll('table tbody tr'));
    rowsInit.forEach(r => {
        const dlCell = r.querySelector('td:last-child');
        if (dlCell) dlCell.dataset.original = dlCell.textContent.trim();
    });

    // --- main function ---
    function applyAll() {
        const minDL   = parseInt(filterSelect.value) || 0;
        const metric  = metricSelect.value;
        const order   = orderSelect.value;
        const rows    = Array.from(document.querySelectorAll('table tbody tr'));
        const now     = Date.now();

        // 1) Filter
        rows.forEach(r => {
            const dl = parseInt(r.querySelector('td:last-child').dataset.original, 10) || 0;
            r.style.display = dl < minDL ? 'none' : '';
        });

        // 2) No sorting restore originals
        if (!metric || !order) {
            rows.forEach(r => {
                const c = r.querySelector('td:last-child');
                if (c && c.dataset.original) c.textContent = c.dataset.original;
            });
            return;
        }

        // 3) Compute keys & update cell display
        const toSort = rows
            .filter(r => r.style.display !== 'none')
            .map(r => {
                const dlCell = r.querySelector('td:last-child');
                const orig   = parseInt(dlCell.dataset.original, 10) || 0;
                let key;

                if (metric === 'download') {
                    key = orig;
                    dlCell.textContent = dlCell.dataset.original;
                } else {
                    const ts = parseInt(r.querySelector('td[data-timestamp]').dataset.timestamp, 10) * 1000;
                    const days = Math.max((now - ts) / (1000*60*60*24), 1);
                    key = orig / days;
                    dlCell.textContent = `${orig} (${key.toFixed(2)})`;
                }
                return {row: r, key};
            });

        // 4) Sort
        toSort.sort((a, b) => order === 'asc' ? a.key - b.key : b.key - a.key);

        // 5) Re-append
        const tbody = document.querySelector('table tbody');
        toSort.forEach(obj => tbody.appendChild(obj.row));
    }

    // --- listeners ---
    [filterSelect, metricSelect, orderSelect].forEach(el =>
        el.addEventListener('change', applyAll)
    );

})();
