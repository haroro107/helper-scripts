// ==UserScript==
// @name         YouTube Filter Live Chat
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Filter YouTube live chat messages with options for exact match and containing text blacklist
// @author       haroro107
// @match        *://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Load blacklist from sessionStorage
    let exactMatchBlacklist = sessionStorage.getItem('exactMatchBlacklist') ? JSON.parse(sessionStorage.getItem('exactMatchBlacklist')) : [];
    let containTextBlacklist = sessionStorage.getItem('containTextBlacklist') ? JSON.parse(sessionStorage.getItem('containTextBlacklist')) : ["judol", "judi"];
    let filterUnicode = sessionStorage.getItem('filterUnicode') ? JSON.parse(sessionStorage.getItem('filterUnicode')) : true;

    // Normalize text (remove Unicode styling)
    function normalizeText(text) {
        return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); // Normalize and convert to lowercase
    }

    // Function to check for styled Unicode text (non-language)
    function isStyledUnicode(text) {
        const validLanguageRegex = /^[\x20-\x7E\u00A0-\u052F\u2E80-\u9FFF\u0400-\u04FF\uAC00-\uD7AF\u1100-\u11FF]+$/;
        return !validLanguageRegex.test(text); // Return true if text contains styled Unicode characters
    }

    // Create button to open the popup
    function createBlacklistButton() {
        const container = document.querySelector('ytd-watch-next-secondary-results-renderer');
        if (container && !document.querySelector('#blacklist-button')) {
            const button = document.createElement('button');
            button.id = 'blacklist-button';
            button.textContent = 'Edit Chat Filter';
            button.style.cssText = `
                position: relative;
                margin: 10px;
                padding: 8px 12px;
                background-color: #ff0000;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                z-index: 9999;
            `;

            button.addEventListener('click', openBlacklistPopup);
            container.insertBefore(button, container.firstChild);
        }
    }

    // Open the popup to edit blacklists
    function openBlacklistPopup() {
        if (document.querySelector('#blacklist-popup')) return;

        const popup = document.createElement('div');
        popup.id = 'blacklist-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            background-color: white;
            border: 2px solid #000;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            padding: 20px;
        `;

        // Exact match input field
        const exactMatchInput = document.createElement('textarea');
        exactMatchInput.style.cssText = `
            width: 100%;
            height: 100px;
            margin-bottom: 10px;
        `;
        exactMatchInput.value = exactMatchBlacklist.join('\n');

        // Contain text input field
        const containTextInput = document.createElement('textarea');
        containTextInput.style.cssText = `
            width: 100%;
            height: 100px;
            margin-bottom: 10px;
        `;
        containTextInput.value = containTextBlacklist.join('\n');

        // Unicode filter checkbox
        const unicodeFilterLabel = document.createElement('label');
        unicodeFilterLabel.style.cssText = `
            display: block;
            margin-bottom: 10px;
        `;
        const unicodeFilterCheckbox = document.createElement('input');
        unicodeFilterCheckbox.type = 'checkbox';
        unicodeFilterCheckbox.checked = filterUnicode;
        unicodeFilterCheckbox.style.marginRight = '5px';

        unicodeFilterLabel.appendChild(unicodeFilterCheckbox);
        unicodeFilterLabel.appendChild(document.createTextNode('Filter Unicode-styled messages'));

        // Save button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.cssText = `
            padding: 8px 12px;
            background-color: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        saveButton.addEventListener('click', () => {
            exactMatchBlacklist = exactMatchInput.value.split('\n').map(word => word.trim()).filter(Boolean);
            containTextBlacklist = containTextInput.value.split('\n').map(word => word.trim()).filter(Boolean);
            filterUnicode = unicodeFilterCheckbox.checked;

            // Save to sessionStorage
            sessionStorage.setItem('exactMatchBlacklist', JSON.stringify(exactMatchBlacklist));
            sessionStorage.setItem('containTextBlacklist', JSON.stringify(containTextBlacklist));
            sessionStorage.setItem('filterUnicode', JSON.stringify(filterUnicode));

            alert('Chat filter updated!');
            popup.remove();
        });

        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 8px 12px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        `;
        cancelButton.addEventListener('click', () => popup.remove());

        popup.appendChild(document.createTextNode('Exact Match Blacklist (one per line)'));
        popup.appendChild(exactMatchInput);
        popup.appendChild(document.createTextNode('Contain Text Blacklist (one per line)'));
        popup.appendChild(containTextInput);
        popup.appendChild(unicodeFilterLabel);
        popup.appendChild(saveButton);
        popup.appendChild(cancelButton);
        document.body.appendChild(popup);
    }

    // Function to filter chat messages
    function filterChatMessages() {
        const chatItems = document.querySelectorAll('#contents #message');
        chatItems.forEach((chatItem) => {
            const messageText = normalizeText(chatItem.textContent);

            // Check if the message is blacklisted
            const isExactMatchBlacklisted = exactMatchBlacklist.some(word => messageText === normalizeText(word));
            const isContainTextBlacklisted = containTextBlacklist.some(word => messageText.includes(normalizeText(word)));

            // Check if the message contains styled Unicode
            const isUnicodeStyled = filterUnicode && isStyledUnicode(chatItem.textContent);

            // Remove the message if it's blacklisted or if it contains styled Unicode
            if (isExactMatchBlacklisted || isContainTextBlacklisted || isUnicodeStyled) {
                const chatContainer = chatItem.closest('yt-live-chat-text-message-renderer');
                if (chatContainer) {
                    chatContainer.remove();
                }
            }
        });
    }

    // Monitor for new chat messages
    const observer = new MutationObserver(() => {
        filterChatMessages();
    });

    // Start observing the live chat for changes
    const chatContainer = document.querySelector('#chat #items');
    if (chatContainer) {
        observer.observe(chatContainer, { childList: true, subtree: true });
    } else {
        const interval = setInterval(() => {
            const chatContainerRetry = document.querySelector('#chat #items');
            if (chatContainerRetry) {
                observer.observe(chatContainerRetry, { childList: true, subtree: true });
                clearInterval(interval);
            }
        }, 1000);
    }

    // Add the button to the UI
    const rendererObserver = new MutationObserver(() => {
        createBlacklistButton();
    });
    rendererObserver.observe(document.body, { childList: true, subtree: true });
})();
