// ==UserScript==
// @name         VNDB Composite Material Badge (Score and Total)
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Menampilkan badge gabungan berbentuk dua bulat (score dan total) seperti [5.06 | 102] dengan warna material design pada vndb.org. Jika rating value adalah "-" maka dianggap 0. Saat badge diklik, jika terdapat elemen <span lang="ja-Latn">, akan diarahkan ke Google Search dengan tambahan kata "Hitomi".
// @author       haroro107
// @match        *://vndb.org/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // Fungsi untuk menentukan warna score (material design)
  function getScoreColor(score) {
    if (score < 4.0) return "#f44336";        // red
    else if (score < 5.0) return "#ffeb3b";     // yellow
    else if (score < 7.0) return "#4caf50";     // green
    else return "#2196f3";                     // blue
  }

  // Fungsi untuk menentukan warna total (material design)
  function getTotalColor(total) {
    if (total < 15) return "#f44336";           // red
    else if (total < 30) return "#ff9800";       // orange
    else if (total < 45) return "#ffeb3b";       // yellow
    else if (total < 60) return "#4caf50";       // green
    else return "#2196f3";                     // blue
  }

  // Tambahkan CSS untuk badge gabungan dengan tampilan material
  const style = document.createElement('style');
  style.textContent = `
  /* Reset style bawaan elemen rating */
  abbr.ulist-widget-icon, abbr.icon-list-add {
    all: unset;
  }
  /* Container komposit untuk badge gabungan */
  .composite-badge {
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    font-family: 'Roboto', Arial, sans-serif;
    box-shadow: 0 2px 4px rgba(0,0,0,0.14), 0 3px 4px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.2);
    margin: 6px 0;
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: default;
  }
  .composite-badge:hover {
    box-shadow: 0 8px 10px rgba(0,0,0,0.14), 0 3px 14px rgba(0,0,0,0.12), 0 4px 5px rgba(0,0,0,0.2);
  }
  /* Bagian badge (score dan total) */
  .badge-half {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 32px;
    letter-spacing: 0.25px;
  }
  /* Divider antar bagian */
  .badge-divider {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.7);
  }
  `;
  document.head.appendChild(style);

  // Proses semua tabel rating (mendeteksi "Rating:" di dalamnya)
  const ratingTables = document.querySelectorAll('table');
  ratingTables.forEach((table) => {
    if (table.innerText.includes("Rating:")) {
      const cells = table.querySelectorAll("td");
      if (cells.length >= 2) {
        // Ambil score dari node teks pertama di cell kedua
        let scoreText = cells[1].childNodes[0]?.textContent.trim();
        let score = parseFloat(scoreText);
        if (isNaN(score)) score = 0;

        // Ambil total dari elemen <small> (format "(102)")
        let total = NaN;
        const smallEl = cells[1].querySelector("small");
        if (smallEl) {
          let totalText = smallEl.textContent.replace(/[()]/g, "").trim();
          total = parseFloat(totalText);
        }
        if (isNaN(total)) total = 0;

        // Dapatkan container utama (misalnya div terdekat)
        const container = table.closest('div');
        if (container) {
          // Hapus elemen badge lama jika ada
          const oldTotalBadge = container.querySelector("abbr.ulist-widget-icon");
          const oldScoreBadge = container.querySelector("abbr.icon-list-add");
          if (oldTotalBadge) oldTotalBadge.remove();
          if (oldScoreBadge) oldScoreBadge.remove();

          // Buat container badge gabungan
          const compositeBadge = document.createElement("span");
          compositeBadge.classList.add("composite-badge");

          // Buat elemen bagian score
          const scoreSpan = document.createElement("span");
          scoreSpan.classList.add("badge-half");
          const scoreColor = getScoreColor(score);
          scoreSpan.style.backgroundColor = scoreColor;
          scoreSpan.style.color = (scoreColor === "#ffeb3b") ? "rgba(0,0,0,0.87)" : "rgba(255,255,255,0.87)";
          scoreSpan.textContent = score.toFixed(2);

          // Buat divider
          const divider = document.createElement("span");
          divider.classList.add("badge-divider");

          // Buat elemen bagian total
          const totalSpan = document.createElement("span");
          totalSpan.classList.add("badge-half");
          const totalColor = getTotalColor(total);
          totalSpan.style.backgroundColor = totalColor;
          totalSpan.style.color = (totalColor === "#ffeb3b") ? "rgba(0,0,0,0.87)" : "rgba(255,255,255,0.87)";
          totalSpan.textContent = total;
           
          // Gabungkan semua bagian ke dalam compositeBadge
          compositeBadge.appendChild(scoreSpan);
          compositeBadge.appendChild(divider);
          compositeBadge.appendChild(totalSpan);

          // Tambahkan effect ripple untuk klik feedback
          compositeBadge.style.position = "relative";
          compositeBadge.style.overflow = "hidden";
          
          // Tambahkan event klik untuk membuka link jika terdapat elemen <span lang="ja-Latn">
          const jaLatnSpan = container.querySelector('span[lang="ja-Latn"]');
          if (jaLatnSpan) {
            // Buat query dengan teks dari elemen tersebut dan tambahkan "Hitomi"
            const queryText = jaLatnSpan.textContent.trim() + " Hitomi";
            compositeBadge.style.cursor = "pointer";
            compositeBadge.addEventListener("click", () => {
              // Membuka Google Search dengan query yang telah disusun
              window.open(`https://www.google.com/search?q=${encodeURIComponent(queryText)}`, "_blank");
            });
          }

          // Tempatkan badge komposit di awal container
          container.insertBefore(compositeBadge, container.firstElementChild);
        }
      }
    }
  });
})();
