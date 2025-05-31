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
        function createBlacklistList(blacklist, placeholder) {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '10px';

            const list = document.createElement('ul');
            list.style.cssText = `
                list-style: none;
                padding: 0;
                margin: 0 0 6px 0;
                max-height: 70px;
                overflow-y: auto;
            `;

            function renderList() {
                // Remove all children safely instead of using innerHTML
                while (list.firstChild) {
                    list.removeChild(list.firstChild);
                }
                blacklist.forEach((word, idx) => {
                    const li = document.createElement('li');
                    li.style.cssText = `
                        display: flex;
                        align-items: center;
                        margin-bottom: 2px;
                    `;
                    const span = document.createElement('span');
                    span.textContent = word;
                    span.style.cssText = `
                        flex: 1;
                        font-size: 13px;
                        background: #272727;
                        padding: 2px 8px;
                        border-radius: 3px;
                        margin-right: 6px;
                        word-break: break-all;
                    `;
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
                        blacklist.splice(idx, 1);
                        renderList();
                    };
                    li.appendChild(span);
                    li.appendChild(removeBtn);
                    list.appendChild(li);
                });
            }
            renderList();

            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display: flex; gap: 6px;';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = placeholder;
            input.style.cssText = `
                flex: 1;
                background: #272727;
                color: #fff;
                border: 1px solid #444;
                border-radius: 4px;
                font-size: 13px;
                padding: 4px 8px;
            `;
            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add';
            addBtn.style.cssText = `
                background: #272727;
                color: #fff;
                border: 1px solid #444;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                padding: 4px 12px;
                transition: background 0.2s;
            `;
            addBtn.addEventListener('mouseenter', () => addBtn.style.backgroundColor = '#444');
            addBtn.addEventListener('mouseleave', () => addBtn.style.backgroundColor = '#272727');
            addBtn.onclick = () => {
                const val = input.value.trim();
                if (val && !blacklist.includes(val)) {
                    blacklist.push(val);
                    input.value = '';
                    renderList();
                }
            };
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') addBtn.click();
            });
            inputRow.appendChild(input);
            inputRow.appendChild(addBtn);

            wrapper.appendChild(list);
            wrapper.appendChild(inputRow);

            return { wrapper, getList: () => blacklist.slice() };
        }

        // Create UI for both blacklists
        const exactMatchListUI = createBlacklistList([...exactMatchBlacklist], 'Add exact match word');
        const containTextListUI = createBlacklistList([...containTextBlacklist], 'Add contain text word');

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
            exactMatchBlacklist = exactMatchListUI.getList();
            containTextBlacklist = containTextListUI.getList();
            filterUnicode = unicodeFilterCheckbox.checked;

            // Save to sessionStorage
            sessionStorage.setItem('exactMatchBlacklist', JSON.stringify(exactMatchBlacklist));
            sessionStorage.setItem('containTextBlacklist', JSON.stringify(containTextBlacklist));
            sessionStorage.setItem('filterUnicode', JSON.stringify(filterUnicode));

            alert('Chat filter updated!');
            location.reload();
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

        popup.appendChild(makeLabel('Exact Match Blacklist'));
        popup.appendChild(exactMatchListUI.wrapper);
        popup.appendChild(makeLabel('Contain Text Blacklist'));
        popup.appendChild(containTextListUI.wrapper);
        popup.appendChild(unicodeFilterLabel);
        popup.appendChild(buttonRow);
        document.body.appendChild(popup);
    }

    // Cache normalized blacklists for faster lookup
    function getNormalizedBlacklist(list) {
        return list.map(word => normalizeText(word));
    }

    // Function to filter chat messages (batch process, avoid repeated DOM queries)
    function filterChatMessages() {
        // Cache normalized blacklists
        const normalizedExact = getNormalizedBlacklist(exactMatchBlacklist);
        const normalizedContain = getNormalizedBlacklist(containTextBlacklist);

        // Use a Set to avoid re-processing
        const processed = new WeakSet();

        // Query all chat message elements
        const chatItems = document.querySelectorAll('#contents #message');
        chatItems.forEach((chatItem) => {
            if (processed.has(chatItem)) return;
            processed.add(chatItem);

            const messageText = normalizeText(chatItem.textContent);

            // Use Set/Array includes for O(1)/O(n) lookup
            const isExactMatchBlacklisted = normalizedExact.includes(messageText);
            const isContainTextBlacklisted = normalizedContain.some(word => messageText.includes(word));
            const isUnicodeStyled = filterUnicode && isStyledUnicode(chatItem.textContent);

            if (isExactMatchBlacklisted || isContainTextBlacklisted || isUnicodeStyled) {
                const chatContainer = chatItem.closest('yt-live-chat-text-message-renderer');
                if (chatContainer) {
                    chatContainer.remove();
                }
            }
        });
    }

    // Efficiently observe chat container for new messages
    function observeChat() {
        let lastChatContainer = null;
        let observer = null;

        function startObserver(container) {
            if (observer) observer.disconnect();
            observer = new MutationObserver(() => {
                filterChatMessages();
            });
            observer.observe(container, { childList: true, subtree: true });
        }

        function tryAttach() {
            const chatContainer = document.querySelector('#chat #items');
            if (chatContainer && chatContainer !== lastChatContainer) {
                lastChatContainer = chatContainer;
                startObserver(chatContainer);
                filterChatMessages();
            }
        }

        // Initial and dynamic attach
        tryAttach();
        const interval = setInterval(tryAttach, 1000);
        // Optionally clear interval after a while to avoid infinite polling
        setTimeout(() => clearInterval(interval), 20000);
    }
    observeChat();

    // Add the button to the UI (debounced for performance)
    let buttonAdded = false;
    function debouncedCreateBlacklistButton() {
        if (!buttonAdded) {
            createBlacklistButton();
            buttonAdded = true;
        }
    }
    const rendererObserver = new MutationObserver(() => {
        debouncedCreateBlacklistButton();
    });
    rendererObserver.observe(document.body, { childList: true, subtree: true });
})();
