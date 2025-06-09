// ==UserScript==
// @name         Reddit Search Subreddit Filter
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add subreddit filtering buttons to Reddit search results
// @author       haroro107
// @match        *://www.reddit.com/r/*/search*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract subreddit name from URL
    function getSubredditName(url) {
        const match = url.match(/\/r\/([^\/]+)/);
        return match ? match[1].toLowerCase() : null;
    }

    // Create and style the filter button
    function createFilterButton(subreddit) {
        const button = document.createElement('button');
        button.textContent = 'filter subreddit';
        button.style.marginLeft = '8px';
        button.style.padding = '2px 6px';
        button.style.background = 'transparent';
        button.style.border = '1px solid #818384';
        button.style.borderRadius = '4px';
        button.style.color = '#818384';
        button.style.cursor = 'pointer';
        button.style.fontSize = '12px';
        button.dataset.subreddit = subreddit;

        button.addEventListener('click', function(e) {
            e.preventDefault();
            updateSearchFilter(subreddit);
        });

        return button;
    }

    // Update search query with new filter
    function updateSearchFilter(subreddit) {
        const searchInput = document.querySelector('form#search input[name="q"]');
        if (!searchInput) return;

        const currentQuery = searchInput.value.trim();
        const newFilter = `-subreddit:${subreddit}`;

        // Split query into tokens and check for exact filter
        const tokens = currentQuery.split(/\s+/);
        if (tokens.includes(newFilter)) return;

        // Append new filter to query
        searchInput.value = currentQuery
            ? `${currentQuery} ${newFilter}`
            : newFilter;
    }

    // Add buttons to existing subreddit links
    function processLinks() {
        document.querySelectorAll('a.search-subreddit-link').forEach(link => {
            if (link.nextElementSibling && link.nextElementSibling.classList.contains('subreddit-filter-btn')) return;

            const subreddit = getSubredditName(link.href);
            if (!subreddit) return;

            const button = createFilterButton(subreddit);
            button.classList.add('subreddit-filter-btn');
            link.parentNode.insertBefore(button, link.nextSibling);
        });
    }

    // Initialize and watch for dynamic content
    function init() {
        if (!location.href.includes('search?q=')) return;

        // Process existing links
        processLinks();

        // Watch for new content (Reddit uses dynamic loading)
        const observer = new MutationObserver(processLinks);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start the script
    window.addEventListener('load', init);
})();