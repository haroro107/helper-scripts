// ==UserScript==
// @name         DLsite Enhanced Sorter
// @namespace    http://tampermonkey.net/
// @version      1.2
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
        toggleBtn.textContent = 'Remove Buttons';
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
        const isRemoved = btn.dataset.removed === 'true';

        document.querySelectorAll('.work_cart, .work_favorite, .work_deals, .work_price_wrap').forEach(el => {
            if (isRemoved) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        // Update button text and state
        if (isRemoved) {
            btn.textContent = 'Remove Buttons';
            btn.style.background = '#f0f0f0';
            delete btn.dataset.removed;
        } else {
            btn.textContent = 'Show Buttons';
            btn.style.background = '#d0ffd0';
            btn.dataset.removed = 'true';
        }
    }

    // Improved number parsing from formatted strings
    function parseCount(text) {
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

        const items = Array.from(list.querySelectorAll('li'));
        const criteria = document.getElementById('sort-criteria').value;
        const order = document.getElementById('sort-order').value;

        items.sort((a, b) => {
            let aValue = 0, bValue = 0;

            if (criteria === 'star_rating') {
                const aRating = a.querySelector('.star_rating');
                const bRating = b.querySelector('.star_rating');
                aValue = aRating ? parseCount(aRating.textContent) : 0;
                bValue = bRating ? parseCount(bRating.textContent) : 0;
            }
            else if (criteria === 'work_review') {
                const aReview = a.querySelector('.work_review a') || a.querySelector('.work_review');
                const bReview = b.querySelector('.work_review a') || b.querySelector('.work_review');
                aValue = aReview ? parseCount(aReview.textContent) : 0;
                bValue = bReview ? parseCount(bReview.textContent) : 0;
            }
            else if (criteria === 'work_dl') {
                const aSales = a.querySelector('.work_dl');
                const bSales = b.querySelector('.work_dl');

                // Extract sales count from the element
                if (aSales) {
                    // Get text from the span inside if exists, otherwise use element text
                    const salesSpan = aSales.querySelector('span');
                    aValue = parseCount(salesSpan ? salesSpan.textContent : aSales.textContent);
                }

                if (bSales) {
                    const salesSpan = bSales.querySelector('span');
                    bValue = parseCount(salesSpan ? salesSpan.textContent : bSales.textContent);
                }
            }

            return order === 'asc' ? aValue - bValue : bValue - aValue;
        });

        // Reattach sorted items
        items.forEach(item => list.appendChild(item));
    }

    // Initialize when page is ready
    window.addEventListener('load', function() {
        createControls();
    });
})();
