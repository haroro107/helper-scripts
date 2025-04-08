// ==UserScript==
// @name         VNDB Material Badge (Switch Total and Score)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Mengubah tampilan rating di vndb.org: gunakan background color dari total dan teks dari score dalam badge material design.
// @author       Satud
// @match        *://vndb.org/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Fungsi menentukan background color berdasarkan nilai total
    function getTotalColor(total) {
        if (total < 15) return "red";
        else if (total < 30) return "orange";
        else if (total < 45) return "yellow";
        else if (total < 60) return "green";
        else return "blue";
    }

    // Tambahkan CSS untuk badge material design
    const style = document.createElement('style');
    style.textContent = `
    /* Hapus style bawaan pada elemen yang lama */
    abbr.ulist-widget-icon, abbr.icon-list-add {
        all: unset;
    }
    /* Desain badge material */
    .material-badge {
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        margin: 5px;
        text-align: center;
    }
    `;
    document.head.appendChild(style);

    // Cari semua tabel rating yang mengandung "Rating:" sebagai identifikasi entri rating
    const ratingTables = document.querySelectorAll('table');
    ratingTables.forEach((table) => {
        if (table.innerText.includes("Rating:")) {
            const cells = table.querySelectorAll("td");
            if (cells.length >= 2) {
                // Ambil nilai score dari cell kedua, dengan asumsi score berada pada node teks pertama
                const scoreText = cells[1].childNodes[0]?.textContent.trim();
                const score = parseFloat(scoreText);
                let total = NaN;
                // Ambil nilai total dari elemen <small> dengan format seperti "(70)"
                const smallEl = cells[1].querySelector("small");
                if (smallEl) {
                    const totalText = smallEl.textContent.replace(/[()]/g, "").trim();
                    total = parseFloat(totalText);
                }

                // Jika kedua nilai valid, proses selanjutnya
                if (!isNaN(score) && !isNaN(total)) {
                    // Dapatkan container utama dari rating (misalnya, <div> terdekat)
                    const container = table.closest('div');
                    if (container) {
                        // Hapus elemen lama yang mewakili rating
                        const oldTotalBadge = container.querySelector("abbr.ulist-widget-icon");
                        const oldScoreBadge = container.querySelector("abbr.icon-list-add");
                        if (oldTotalBadge) oldTotalBadge.remove();
                        if (oldScoreBadge) oldScoreBadge.remove();

                        // Buat badge baru yang menggabungkan informasi: background berdasarkan total, teks berdasarkan score
                        const newBadge = document.createElement("span");
                        newBadge.classList.add("material-badge");
                        newBadge.textContent = score.toFixed(2);
                        newBadge.style.backgroundColor = getTotalColor(total);

                        // Tempatkan badge baru. Misalnya, letakkan di dalam container (bisa disesuaikan posisinya)
                        container.insertBefore(newBadge, container.firstElementChild);
                    }
                }
            }
        }
    });
})();
