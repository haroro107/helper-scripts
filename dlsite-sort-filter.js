// ==UserScript==
// @name         DLsite Enhanced Sorter
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Add custom sorting options (rating/reviews/sales) and toggle for cart/favorite buttons
// @author       haroro107
// @match        https://www.dlsite.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create UI controls
    function createControls() {
        const container = document.createElement('div');
        container.id = 'custom-controls-container';
        container.style.margin = '15px 0';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.alignItems = 'center';
        container.style.gap = '10px';

        // Sorting controls
        const sortContainer = document.createElement('div');
        sortContainer.style.display = 'flex';
        sortContainer.style.alignItems = 'center';
        sortContainer.style.gap = '5px';

        const sortLabel = document.createElement('span');
        sortLabel.textContent = 'Sort by:';
        sortLabel.style.fontWeight = 'bold';

        const sortSelect = document.createElement('select');
        sortSelect.id = 'sort-criteria';
        sortSelect.innerHTML = `
            <option value="star_rating">Star Rating</option>
            <option value="work_review">Reviews</option>
            <option value="work_dl">Sales Count</option>
            <option value="rating_per_sale">Rating per Sale</option>
            <option value="file_size">File Size</option>
        `;

        const orderSelect = document.createElement('select');
        orderSelect.id = 'sort-order';
        orderSelect.innerHTML = `
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
        `;

        sortContainer.appendChild(sortLabel);
        sortContainer.appendChild(sortSelect);
        sortContainer.appendChild(orderSelect);

        // Button to remove cart/favorite buttons
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggle-cart-fav';
        toggleBtn.textContent = 'Show Rating/Sale';
        toggleBtn.style.padding = '5px 10px';
        toggleBtn.style.background = '#f0f0f0';
        toggleBtn.style.border = '1px solid #ccc';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.fontSize = '13px';

        // Assemble controls
        container.appendChild(sortContainer);
        container.appendChild(toggleBtn);

        // Insert after status_select
        const target = document.querySelector('.status_select');
        if (target) {
            target.parentNode.insertBefore(container, target.nextSibling);
        }

        // Add event listeners
        sortSelect.addEventListener('change', sortResults);
        orderSelect.addEventListener('change', sortResults);
        toggleBtn.addEventListener('click', toggleCartFavButtons);
    }

    // Toggle cart/favorite buttons
    function toggleCartFavButtons() {
        const btn = document.getElementById('toggle-cart-fav');
        if (!btn) return;
        const isRemoved = btn.dataset.removed === 'true';

        // Cache selectors for performance
        const hideSelectors = [
            '.work_cart', '.work_favorite', '.work_deals', '.work_price_wrap',
            '.work_category_free_sample', '.maker_name', '.work_operation_btn'
        ];
        const hideElements = [];
        hideSelectors.forEach(sel => {
            try {
                document.querySelectorAll(sel).forEach(el => hideElements.push(el));
            } catch (e) {
                // Selector error, skip
                // Optionally log: console.warn(`Selector failed: ${sel}`, e);
            }
        });

        if (isRemoved) {
            hideElements.forEach(el => { if (el) el.style.display = ''; });
        } else {
            hideElements.forEach(el => { if (el) el.style.display = 'none'; });
        }

        // Show rating per sale after removing buttons
        if (!isRemoved) {
            // Cache all li elements once
            const liList = document.querySelectorAll('li');
            liList.forEach(li => {
                if (!li) return;
                const starEl = li.querySelector('.star_rating');
                const dlEl = li.querySelector('.work_dl');
                if (starEl && dlEl) {
                    // Remove previous appended value if exists
                    const prev = dlEl.querySelector('.rating-per-sale');
                    if (prev) prev.remove();

                    const salesSpan = dlEl.querySelector('span');
                    const salesText = salesSpan ? salesSpan.textContent : dlEl.textContent;
                    const rating = parseCount(starEl.textContent || '');
                    const sales = parseCount(salesText || '');
                    let ratio = sales > 0 ? (rating / sales) : 0;
                    ratio = isFinite(ratio) ? ratio.toFixed(2) : '0.00';

                    // Create and append
                    const ratioEl = document.createElement('span');
                    ratioEl.className = 'rating-per-sale';
                    ratioEl.style.marginLeft = '5px';
                    ratioEl.style.color = '#888';
                    ratioEl.textContent = `(${ratio})`;
                    dlEl.appendChild(ratioEl);

                    // --- File size fetch and display ---
                    // Only fetch if not already fetched
                    if (!li.dataset.fileSizeFetched) {
                        const titleDiv = li.querySelector('.multiline_truncate a');
                        if (titleDiv && titleDiv.href) {
                            enqueueFileSizeFetch(titleDiv.href, li, dlEl, ratioEl);
                        }
                    } else {
                        // Already fetched, just display if not present
                        if (!dlEl.querySelector('.file-size-span') && li.dataset.fileSize) {
                            const sizeSpan = document.createElement('span');
                            sizeSpan.className = 'file-size-span';
                            sizeSpan.style.marginLeft = '5px';
                            sizeSpan.style.color = '#888';
                            sizeSpan.textContent = `[${li.dataset.fileSize}]`;
                            ratioEl.after(sizeSpan);
                        }
                    }
                }
            });
            btn.textContent = 'Hide Rating/Sale';
            btn.style.background = '#d0ffd0';
            btn.dataset.removed = 'true';
        } else {
            // Remove all appended .rating-per-sale and .file-size-span spans
            document.querySelectorAll('.work_dl .rating-per-sale, .work_dl .file-size-span').forEach(el => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
            });
            btn.textContent = 'Show Rating/Sale';
            btn.style.background = '#f0f0f0';
            delete btn.dataset.removed;
        }

        // Apply sort by current value after toggling
        sortResults();
    }

    // --- File size fetch queue/throttle ---
    const fileSizeFetchQueue = [];
    let fileSizeFetchActive = false;
    const FILE_SIZE_FETCH_DELAY = 1000; // ms between requests

    function enqueueFileSizeFetch(url, li, dlEl, afterEl) {
        fileSizeFetchQueue.push({ url, li, dlEl, afterEl });
        processFileSizeFetchQueue();
    }

    function processFileSizeFetchQueue() {
        if (fileSizeFetchActive || fileSizeFetchQueue.length === 0) return;
        fileSizeFetchActive = true;
        const { url, li, dlEl, afterEl } = fileSizeFetchQueue.shift();
        fetchFileSizeThrottled(url, li, dlEl, afterEl).finally(() => {
            setTimeout(() => {
                fileSizeFetchActive = false;
                processFileSizeFetchQueue();
            }, FILE_SIZE_FETCH_DELAY);
        });
    }

    // Throttled fetchFileSize
    function fetchFileSizeThrottled(url, li, dlEl, afterEl) {
        return fetch(url)
            .then(resp => resp.text())
            .then(html => {
                // Parse the HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                let size = '';
                // Find the <th>ファイル容量</th> and get the next <td>
                const ths = Array.from(doc.querySelectorAll('th'));
                for (const th of ths) {
                    if (th.textContent && th.textContent.includes('ファイル容量')) {
                        const td = th.nextElementSibling;
                        if (td) {
                            size = td.textContent.trim().replace(/\s+/g, '');
                        }
                        break;
                    }
                }
                if (size) {
                    li.dataset.fileSize = size;
                    li.dataset.fileSizeFetched = '1';
                    // Display after rating-per-sale
                    const sizeSpan = document.createElement('span');
                    sizeSpan.className = 'file-size-span';
                    sizeSpan.style.marginLeft = '5px';
                    sizeSpan.style.color = '#888';
                    sizeSpan.textContent = `[${size}]`;
                    afterEl.after(sizeSpan);
                } else {
                    li.dataset.fileSizeFetched = '1';
                }
            })
            .catch(() => {
                li.dataset.fileSizeFetched = '1';
            });
    }

    // Parse file size string to MB for sorting
    function parseFileSize(sizeStr) {
        if (!sizeStr) return 0;
        // e.g. "4.9GB", "145.66MB"
        const match = sizeStr.match(/([\d\.]+)\s*(GB|MB)/i);
        if (!match) return 0;
        let num = parseFloat(match[1]);
        if (isNaN(num)) return 0;
        if (/GB/i.test(match[2])) {
            num *= 1024;
        }
        return num; // in MB
    }

    // Improved number parsing from formatted strings
    function parseCount(text) {
        if (!text || typeof text !== 'string') return 0;
        // Handle Japanese/English number formats: "21,898" or "2.3万"
        const num = parseFloat(text.replace(/[^\d\.]/g, ''));

        // Handle Japanese "ten thousand" format (e.g., "2.3万" = 23000)
        if (text.includes('万') && !isNaN(num)) {
            return Math.round(num * 10000);
        }

        return isNaN(num) ? 0 : num;
    }

    // Main sorting function
    function sortResults() {
        const list = document.getElementById('search_result_img_box');
        if (!list) return;

        // Cache items and controls
        const items = Array.from(list.querySelectorAll('li'));
        const sortCriteriaEl = document.getElementById('sort-criteria');
        const sortOrderEl = document.getElementById('sort-order');
        if (!sortCriteriaEl || !sortOrderEl) return;
        const criteria = sortCriteriaEl.value;
        const order = sortOrderEl.value;

        // Pre-cache values for sorting to avoid repeated DOM queries
        const itemData = items.map(item => {
            let value = 0;
            try {
                if (criteria === 'star_rating') {
                    const rating = item.querySelector('.star_rating');
                    value = rating ? parseCount(rating.textContent || '') : 0;
                } else if (criteria === 'work_review') {
                    const review = item.querySelector('.work_review a') || item.querySelector('.work_review');
                    value = review ? parseCount(review.textContent || '') : 0;
                } else if (criteria === 'work_dl') {
                    const sales = item.querySelector('.work_dl');
                    if (sales) {
                        const salesSpan = sales.querySelector('span');
                        value = parseCount((salesSpan ? salesSpan.textContent : sales.textContent) || '');
                    }
                } else if (criteria === 'rating_per_sale') {
                    const rating = item.querySelector('.star_rating');
                    const salesEl = item.querySelector('.work_dl');
                    let sales = 0, val = 0;
                    if (salesEl) {
                        const salesSpan = salesEl.querySelector('span');
                        sales = parseCount((salesSpan ? salesSpan.textContent : salesEl.textContent) || '');
                    }
                    val = rating ? parseCount(rating.textContent || '') : 0;
                    value = sales > 0 ? val / sales : 0;
                } else if (criteria === 'file_size') {
                    // Use data-file-size if available, else 0
                    value = parseFileSize(item.dataset.fileSize || '');
                }
            } catch (e) {
                value = 0;
            }
            return { item, value };
        });

        itemData.sort((a, b) => order === 'asc' ? a.value - b.value : b.value - a.value);

        // Reattach sorted items
        itemData.forEach(({ item }) => {
            if (item && item.parentNode === list) {
                list.appendChild(item);
            }
        });
    }

    // Initialize when page is ready
    window.addEventListener('load', function() {
        createControls();
    });
})();
