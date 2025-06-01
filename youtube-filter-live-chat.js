// ==UserScript==
// @name         YouTube Filter Live Chat
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Filter YouTube live chat messages with options for exact match and containing text blacklist
// @author       haroro107
// @match        *://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Load blacklist from sessionStorage
    let blacklistEntries = sessionStorage.getItem('blacklistEntries')
        ? JSON.parse(sessionStorage.getItem('blacklistEntries'))
        : [
            // Default entries
            { word: "judol", type: "contain" },
            { word: "judi", type: "contain" }
        ];
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

    // Add this helper for leet/similar normalization
    function normalizeLeet(text) {
        return text
            .replace(/0/g, 'o')
            .replace(/1/g, 'i')
            .replace(/3/g, 'e')
            .replace(/4/g, 'a')
            .replace(/5/g, 's')
            .replace(/7/g, 't')
            .replace(/8/g, 'b')
            .replace(/9/g, 'g')
            .replace(/@/g, 'a')
            .replace(/\$/g, 's')
            .replace(/[^a-z0-9]/gi, '') // remove non-alphanum for stricter matching
            .toLowerCase();
    }

    // Helper: check if pattern is a subsequence of text
    function isSubsequence(pattern, text) {
        let i = 0, j = 0;
        while (i < pattern.length && j < text.length) {
            if (pattern[i] === text[j]) i++;
            j++;
        }
        return i === pattern.length;
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
                margin: 10px 0 10px 10px;
                padding: 6px 14px;
                background-color: #272727;
                color: #fff;
                border: 1px solid #444;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                z-index: 9999;
                transition: background 0.2s;
            `;
            button.addEventListener('mouseenter', () => button.style.backgroundColor = '#444');
            button.addEventListener('mouseleave', () => button.style.backgroundColor = '#272727');
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
            width: 320px;
            background: #0f0f0f;
            border: 1.5px solid #444;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 16px rgba(0,0,0,0.35);
            padding: 18px 16px 14px 16px;
            color: #fff;
            font-family: inherit;
        `;

        // Label helper
        function makeLabel(text) {
            const label = document.createElement('div');
            label.textContent = text;
            label.style.cssText = `
                font-size: 13px;
                margin-bottom: 4px;
                font-weight: 500;
            `;
            return label;
        }

        // Helper to create a list UI for blacklist
        function createBlacklistList(entries) {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '10px';

            const list = document.createElement('ul');
            list.style.cssText = `
                list-style: none;
                padding: 0;
                margin: 0 0 6px 0;
                max-height: 110px;
                overflow-y: auto;
            `;

            function renderList() {
                // Remove all children safely instead of using innerHTML
                while (list.firstChild) {
                    list.removeChild(list.firstChild);
                }
                entries.forEach((entry, idx) => {
                    const li = document.createElement('li');
                    li.style.cssText = `
                        display: flex;
                        align-items: center;
                        margin-bottom: 2px;
                    `;
                    // Word display
                    const span = document.createElement('span');
                    span.textContent = entry.word;
                    span.style.cssText = `
                        flex: 1;
                        font-size: 13px;
                        background: #272727;
                        padding: 2px 8px;
                        border-radius: 3px;
                        margin-right: 6px;
                        word-break: break-all;
                    `;
                    // Select for type (exact/contain/leet)
                    const select = document.createElement('select');
                    select.style.cssText = `
                        margin-right: 6px;
                        font-size: 13px;
                        background: #272727;
                        color: #fff;
                        border: 1px solid #444;
                        border-radius: 3px;
                        padding: 2px 4px;
                    `;
                    const optionContain = document.createElement('option');
                    optionContain.value = 'contain';
                    optionContain.textContent = 'Contain Text';
                    const optionExact = document.createElement('option');
                    optionExact.value = 'exact';
                    optionExact.textContent = 'Exact Match';
                    const optionLeet = document.createElement('option');
                    optionLeet.value = 'leet';
                    optionLeet.textContent = 'Leet/Similar';
                    select.appendChild(optionContain);
                    select.appendChild(optionExact);
                    select.appendChild(optionLeet);
                    select.value = entry.type || 'contain';
                    select.onchange = () => {
                        entry.type = select.value;
                    };

                    // Remove button
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '✕';
                    removeBtn.title = 'Remove';
                    removeBtn.style.cssText = `
                        background: #444;
                        color: #fff;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 13px;
                        padding: 0 7px;
                        height: 22px;
                        line-height: 20px;
                    `;
                    removeBtn.onclick = () => {
                        entries.splice(idx, 1);
                        renderList();
                    };
                    li.appendChild(span);
                    li.appendChild(select);
                    li.appendChild(removeBtn);
                    list.appendChild(li);
                });
            }
            renderList();

            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display: flex; gap: 6px; width: 100%;';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Add word...';
            input.style.cssText = `
                flex: 1;
                min-width: 0;
                background: #272727;
                color: #fff;
                border: 1px solid #444;
                border-radius: 4px;
                font-size: 13px;
                padding: 4px 8px;
            `;
            // Select for type (default: contain, with leet/similar)
            const typeSelect = document.createElement('select');
            typeSelect.style.cssText = `
                min-width: 0;
                font-size: 13px;
                background: #272727;
                color: #fff;
                border: 1px solid #444;
                border-radius: 4px;
                padding: 4px 6px;
            `;
            const optContain = document.createElement('option');
            optContain.value = 'contain';
            optContain.textContent = 'Contain Text';
            const optExact = document.createElement('option');
            optExact.value = 'exact';
            optExact.textContent = 'Exact Match';
            const optLeet = document.createElement('option');
            optLeet.value = 'leet';
            optLeet.textContent = 'Leet/Similar';
            typeSelect.appendChild(optContain);
            typeSelect.appendChild(optExact);
            typeSelect.appendChild(optLeet);
            typeSelect.value = 'contain';

            // Add button as icon
            const addBtn = document.createElement('button');
            addBtn.textContent = '＋';
            addBtn.title = 'Add';
            addBtn.style.cssText = `
                background: #444;
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                padding: 0 10px;
                height: 28px;
                width: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            `;
            addBtn.addEventListener('mouseenter', () => addBtn.style.backgroundColor = '#666');
            addBtn.addEventListener('mouseleave', () => addBtn.style.backgroundColor = '#444');
            addBtn.onclick = () => {
                const val = input.value.trim();
                if (val && !entries.some(e => e.word === val && e.type === typeSelect.value)) {
                    entries.push({ word: val, type: typeSelect.value });
                    input.value = '';
                    renderList();
                }
            };
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') addBtn.click();
            });
            inputRow.appendChild(input);
            inputRow.appendChild(typeSelect);
            inputRow.appendChild(addBtn);

            wrapper.appendChild(list);
            wrapper.appendChild(inputRow);

            return { wrapper, getList: () => entries.slice() };
        }

        // Create UI for blacklist
        const blacklistListUI = createBlacklistList([...blacklistEntries]);

        // Unicode filter checkbox
        const unicodeFilterLabel = document.createElement('label');
        unicodeFilterLabel.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 14px;
            font-size: 13px;
            cursor: pointer;
            user-select: none;
        `;
        const unicodeFilterCheckbox = document.createElement('input');
        unicodeFilterCheckbox.type = 'checkbox';
        unicodeFilterCheckbox.checked = filterUnicode;
        unicodeFilterCheckbox.style.marginRight = '7px';
        unicodeFilterCheckbox.style.accentColor = '#272727';

        unicodeFilterLabel.appendChild(unicodeFilterCheckbox);
        unicodeFilterLabel.appendChild(document.createTextNode('Filter Unicode-styled messages'));

        // Button row
        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 6px;
        `;

        // Save button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.cssText = `
            padding: 6px 16px;
            background: #272727;
            color: #fff;
            border: 1px solid #444;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        `;
        saveButton.addEventListener('mouseenter', () => saveButton.style.backgroundColor = '#444');
        saveButton.addEventListener('mouseleave', () => saveButton.style.backgroundColor = '#272727');
        saveButton.addEventListener('click', () => {
            blacklistEntries = blacklistListUI.getList();
            filterUnicode = unicodeFilterCheckbox.checked;

            // Save to sessionStorage
            sessionStorage.setItem('blacklistEntries', JSON.stringify(blacklistEntries));
            sessionStorage.setItem('filterUnicode', JSON.stringify(filterUnicode));

            alert('Chat filter updated!');
            // Reload only the chat iframe instead of the whole page
            const chatFrame = document.getElementById('chatframe');
            if (chatFrame && chatFrame.contentWindow) {
                chatFrame.contentWindow.location.reload();
            }
            popup.remove();
        });

        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 6px 16px;
            background: #272727;
            color: #fff;
            border: 1px solid #444;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        `;
        cancelButton.addEventListener('mouseenter', () => cancelButton.style.backgroundColor = '#444');
        cancelButton.addEventListener('mouseleave', () => cancelButton.style.backgroundColor = '#272727');
        cancelButton.addEventListener('click', () => popup.remove());

        buttonRow.appendChild(saveButton);
        buttonRow.appendChild(cancelButton);

        popup.appendChild(makeLabel('Blacklist Entries'));
        popup.appendChild(blacklistListUI.wrapper);
        popup.appendChild(unicodeFilterLabel);
        popup.appendChild(buttonRow);
        document.body.appendChild(popup);
    }

    // Function to filter chat messages
    function filterChatMessages() {
        const chatItems = document.querySelectorAll('#contents #message');
        chatItems.forEach((chatItem) => {
            const messageText = normalizeText(chatItem.textContent);
            const messageLeet = normalizeLeet(chatItem.textContent);

            // Check if the message is blacklisted
            const isBlacklisted = blacklistEntries.some(entry => {
                const entryWordNorm = normalizeText(entry.word);
                const entryWordLeet = normalizeLeet(entry.word);
                if (entry.type === 'leet') {
                    // Leet/Similar: subsequence match
                    return isSubsequence(entryWordLeet, messageLeet);
                } else if (entry.type === 'exact') {
                    return messageText === entryWordNorm;
                } else {
                    return messageText.includes(entryWordNorm);
                }
            });

            // Check if the message contains styled Unicode
            const isUnicodeStyled = filterUnicode && isStyledUnicode(chatItem.textContent);

            // Remove the message if it's blacklisted or if it contains styled Unicode
            if (isBlacklisted || isUnicodeStyled) {
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
