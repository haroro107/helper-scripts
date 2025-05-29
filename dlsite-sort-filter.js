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
                }
            });
            btn.textContent = 'Hide Rating/Sale';
            btn.style.background = '#d0ffd0';
            btn.dataset.removed = 'true';
        } else {
            // Remove all appended .rating-per-sale spans
            document.querySelectorAll('.work_dl .rating-per-sale').forEach(el => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
            });
            btn.textContent = 'Show Rating/Sale';
            btn.style.background = '#f0f0f0';
            delete btn.dataset.removed;
        }

        // Apply sort by current value after toggling
        sortResults();
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
                }
            } catch (e) {
                value = 0;
                // Optionally log: console.warn('Error parsing item for sort', e, item);
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
