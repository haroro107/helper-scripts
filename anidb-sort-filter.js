// ==UserScript==
// @name         AniDB Sort & Material Color
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Menambahkan panel sort untuk kolom rating, average, reviews dan user di anidb.net serta mengubah background dan warna teks berdasarkan material color thresholds.
// @author       -
// @match        https://anidb.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Fungsi helper: ambil material colors dan text color berdasarkan nilai dan thresholds
    // thresholds: array berisi batas [threshold1, threshold2, threshold3, threshold4]
    // Untuk nilai < threshold1 => red lighten-2, < threshold2 => orange lighten-2, < threshold3 => yellow lighten-2, < threshold4 => green lighten-2, selain itu blue lighten-2.
    function getMaterialColorForValue(value, thresholds) {
        if(value < thresholds[0]) return { background: '#e57373', color: 'white' };  // red lighten-2
        if(value < thresholds[1]) return { background: '#ffb74d', color: 'black' };  // orange lighten-2
        if(value < thresholds[2]) return { background: '#fff176', color: 'black' };  // yellow lighten-2
        if(value < thresholds[3]) return { background: '#aed581', color: 'black' };  // green lighten-2
        return { background: '#64b5f6', color: 'white' };  // blue lighten-2
    }

    // Fungsi untuk menerapkan warna material pada cell
    function applyColors() {
        document.querySelectorAll('#animelist tbody tr').forEach(row => {
            // Untuk kolom Rating, Average, Reviews
            const ratingCell = row.querySelector('td.rating.weighted');
            if (ratingCell) {
                let ratingVal = parseFloat(ratingCell.textContent.trim().split(' ')[0]);
                const style = getMaterialColorForValue(ratingVal, [2.5, 3.5, 4.5, 5.5]);
                ratingCell.style.backgroundColor = style.background;
                ratingCell.style.color = style.color;
            }
            const avgCell = row.querySelector('td.rating.avg');
            if (avgCell) {
                let avgVal = parseFloat(avgCell.textContent.trim().split(' ')[0]);
                const style = getMaterialColorForValue(avgVal, [2.5, 3.5, 4.5, 5.5]);
                avgCell.style.backgroundColor = style.background;
                avgCell.style.color = style.color;
            }
            const reviewCell = row.querySelector('td.rating.review');
            if (reviewCell) {
                let reviewVal = parseFloat(reviewCell.textContent.trim().split(' ')[0]);
                const style = getMaterialColorForValue(reviewVal, [2.5, 3.5, 4.5, 5.5]);
                reviewCell.style.backgroundColor = style.background;
                reviewCell.style.color = style.color;
            }
            // Untuk kolom User
            const userCell = row.querySelector('td.count.members');
            if (userCell) {
                let userVal = parseFloat(userCell.textContent.trim());
                const style = getMaterialColorForValue(userVal, [500, 1000, 1500, 2000]);
                userCell.style.backgroundColor = style.background;
                userCell.style.color = style.color;
            }
        });
    }

    // Fungsi sorting tabel berdasarkan kolom tertentu.
    // columnSelector: fungsi yang mengambil nilai numerik dari cell pada row.
    // ascending: boolean untuk urutan ascending (true) atau descending (false).
    function sortTable(columnSelector, ascending) {
        const table = document.getElementById('animelist');
        const tbody = table.querySelector('tbody');
        let rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((a, b) => {
            let aVal = columnSelector(a);
            let bVal = columnSelector(b);
            aVal = isNaN(aVal) ? 0 : aVal;
            bVal = isNaN(bVal) ? 0 : bVal;
            return ascending ? aVal - bVal : bVal - aVal;
        });

        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
    }

    // Membuat panel kontrol sort di kanan bawah browser
    function createSortPanel() {
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.bottom = '10px';
        panel.style.right = '10px';
        panel.style.padding = '10px';
        // panel.style.backgroundColor = '#fff';
        // panel.style.border = '1px solid #ccc';
        panel.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        panel.style.zIndex = '9999';
        panel.style.fontSize = '14px';
        panel.style.borderRadius = '4px';

        const columns = [
            { label: 'Rating', selector: row => {
                const cell = row.querySelector('td.rating.weighted');
                return cell ? parseFloat(cell.textContent.trim().split(' ')[0]) : 0;
            }},
            { label: 'Average', selector: row => {
                const cell = row.querySelector('td.rating.avg');
                return cell ? parseFloat(cell.textContent.trim().split(' ')[0]) : 0;
            }},
            { label: 'Reviews', selector: row => {
                const cell = row.querySelector('td.rating.review');
                return cell ? parseFloat(cell.textContent.trim().split(' ')[0]) : 0;
            }},
            { label: 'User', selector: row => {
                const cell = row.querySelector('td.count.members');
                return cell ? parseFloat(cell.textContent.trim()) : 0;
            }}
        ];

        // Menyimpan status sorting (true: ascending, false: descending)
        const sortStatus = {};
        columns.forEach(col => sortStatus[col.label] = true);

        columns.forEach(col => {
            const btn = document.createElement('button');
            btn.textContent = col.label + ' ↑';
            btn.style.margin = '2px';
            btn.style.padding = '4px 8px';
            btn.style.border = 'none';
            btn.style.borderRadius = '3px';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = 'bold';
            btn.style.backgroundColor = '#64b5f6';
            btn.style.color = 'white';
            btn.addEventListener('click', () => {
                sortStatus[col.label] = !sortStatus[col.label];
                btn.textContent = col.label + (sortStatus[col.label] ? ' ↑' : ' ↓');
                sortTable(col.selector, sortStatus[col.label]);
                applyColors();
            });
            panel.appendChild(btn);
        });

        document.body.appendChild(panel);
    }

    // Eksekusi fungsi setelah halaman selesai dimuat
    window.addEventListener('load', function() {
        applyColors();
        createSortPanel();
    });
})();
