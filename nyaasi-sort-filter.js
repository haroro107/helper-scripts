// ==UserScript==
// @name         Nyaa.si Table Filter and Sort
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Adds filtering and sorting functionality to the table on nyaa.si
// @author       Your Name
// @match        https://nyaa.si/*
// @match        https://sukebei.nyaa.si/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Locate the parent element of the table
    const tableResponsiveDiv = document.querySelector('div.table-responsive');
    if (!tableResponsiveDiv) return; // Exit if the target div is not found

    // Create a wrapper div to hold the filters
    const filterWrapper = document.createElement('div');
    filterWrapper.style.marginBottom = '10px';
    filterWrapper.style.display = 'flex';
    filterWrapper.style.gap = '10px';
    filterWrapper.style.alignItems = 'center';

    // Create the filter select
    const filterSelect = document.createElement('select');
    filterSelect.style.padding = '5px';
    filterSelect.style.borderRadius = '5px';
    filterSelect.style.border = '1px solid #ccc';

    // Add options to the filter select
    const filterOptions = [
        { value: '', text: 'Show All' },
        { value: 1000, text: '> 1000' },
        { value: 5000, text: '> 5000' },
        { value: 10000, text: '> 10000' },
        { value: 15000, text: '> 15000' },
        { value: 20000, text: '> 20000' },
    ];
    filterOptions.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        filterSelect.appendChild(opt);
    });
    filterWrapper.appendChild(filterSelect);

    // Create the sorting select
    const sortSelect = document.createElement('select');
    sortSelect.style.padding = '5px';
    sortSelect.style.borderRadius = '5px';
    sortSelect.style.border = '1px solid #ccc';

    // Add options to the sorting select
    const sortOptions = [
        { value: '', text: 'No Sorting' },
        { value: 'asc', text: 'Ascending' },
        { value: 'desc', text: 'Descending' },
    ];
    sortOptions.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        sortSelect.appendChild(opt);
    });
    filterWrapper.appendChild(sortSelect);

    // Insert the filter wrapper above the table
    tableResponsiveDiv.parentNode.insertBefore(filterWrapper, tableResponsiveDiv);

    // Add event listener for filtering and sorting
    function applyFilterAndSort() {
        const filterValue = parseInt(filterSelect.value, 10);
        const sortValue = sortSelect.value;

        const rows = Array.from(document.querySelectorAll('table tr')).slice(1); // Exclude header row

        // Apply filtering
        rows.forEach((row) => {
            const lastTd = row.querySelector('td:last-child');
            if (lastTd) {
                const value = parseInt(lastTd.textContent.trim(), 10);
                if (!isNaN(filterValue) && value < filterValue) {
                    row.style.display = 'none';
                } else {
                    row.style.display = '';
                }
            }
        });

        // Apply sorting
        if (sortValue) {
            const tbody = document.querySelector('table tbody');
            rows.sort((a, b) => {
                const aValue = parseInt(a.querySelector('td:last-child').textContent.trim(), 10) || 0;
                const bValue = parseInt(b.querySelector('td:last-child').textContent.trim(), 10) || 0;
                return sortValue === 'asc' ? aValue - bValue : bValue - aValue;
            });

            // Reappend rows in the sorted order
            rows.forEach((row) => tbody.appendChild(row));
        }
    }

    // Attach the event listeners
    filterSelect.addEventListener('change', applyFilterAndSort);
    sortSelect.addEventListener('change', applyFilterAndSort);
})();
