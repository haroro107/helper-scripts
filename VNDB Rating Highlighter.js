// ==UserScript==
// @name         VNDB Material Badge (Switch Total and Score) - Fix Rating Value
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Tampilkan badge material design pada vndb.org dengan background berdasarkan total, teks berdasarkan score, dan jika rating value berupa "-" maka akan menampilkan 0.
// @author       Haroro107
// @match        *://vndb.org/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Fungsi untuk menentukan background color berdasarkan nilai total
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
                let scoreText = cells[1].childNodes[0]?.textContent.trim();
                let score = parseFloat(scoreText);
                // Jika score tidak valid (misalnya tanda "-"), set nilai score menjadi 0
                if (isNaN(score)) score = 0;

                let total = NaN;
                // Ambil nilai total dari elemen <small> yang biasanya ditulis dalam format seperti "(70)"
                const smallEl = cells[1].querySelector("small");
                if (smallEl) {
                    let totalText = smallEl.textContent.replace(/[()]/g, "").trim();
                    total = parseFloat(totalText);
                }
                // Jika total tidak valid, set nilai total menjadi 0
                if (isNaN(total)) total = 0;

                // Jika kedua nilai valid (setelah perbaikan)
                const container = table.closest('div');
                if (container) {
                    // Hapus elemen lama yang mewakili rating
                    const oldTotalBadge = container.querySelector("abbr.ulist-widget-icon");
                    const oldScoreBadge = container.querySelector("abbr.icon-list-add");
                    if (oldTotalBadge) oldTotalBadge.remove();
                    if (oldScoreBadge) oldScoreBadge.remove();

                    // Buat badge baru yang menggabungkan informasi:
                    // background berdasarkan total dan teks berdasarkan score
                    const newBadge = document.createElement("span");
                    newBadge.classList.add("material-badge");
                    // Tampilkan score dengan 2 digit desimal
                    newBadge.textContent = score.toFixed(2);
                    const bgColor = getTotalColor(total);
                    newBadge.style.backgroundColor = bgColor;
                    // Jika backgroundnya yellow, gunakan warna teks hitam untuk kontras
                    if (bgColor === "yellow") {
                        newBadge.style.color = "black";
                    } else {
                        newBadge.style.color = "#fff";
                    }
                    // Tempatkan badge baru di awal container
                    container.insertBefore(newBadge, container.firstElementChild);
                }
            }
        }
    });
})();
