// ==UserScript==
// @name         MyAnimeList Search Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Enhance MyAnimeList with filtering and coloring
// @author       haroro107
// @match        https://myanimelist.net/anime.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function createSettingsUI() {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggleSettings';
        toggleButton.textContent = 'Show Settings';
        toggleButton.style.position = 'fixed';
        toggleButton.style.left = '10px';
        toggleButton.style.bottom = '10px';
        toggleButton.style.background = '#4CAF50';
        toggleButton.style.color = 'white';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '4px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.zIndex = '10000';
        document.body.appendChild(toggleButton);

        const settingsDiv = document.createElement('div');
        settingsDiv.id = 'settingsUI';
        settingsDiv.style.position = 'fixed';
        settingsDiv.style.left = '10px';
        settingsDiv.style.bottom = '40px';
        settingsDiv.style.background = 'rgba(0, 0, 0, 0.9)';
        settingsDiv.style.color = 'white';
        settingsDiv.style.padding = '10px';
        settingsDiv.style.borderRadius = '6px';
        settingsDiv.style.zIndex = '9999';
        settingsDiv.style.boxShadow = '0px 0px 8px rgba(255, 255, 255, 0.2)';
        settingsDiv.style.fontFamily = 'Arial, sans-serif';
        settingsDiv.style.width = '200px';
        settingsDiv.style.display = 'none';

        settingsDiv.innerHTML = `
            <label><input type="checkbox" id="hideCMPL"> Hide CMPL</label>
            <input type="number" id="hideScore" step="0.01" placeholder="Min score" style="width: 100%; padding: 4px; margin-bottom: 5px; border-radius: 4px; border: none;">
            <input type="number" id="hideMembers" placeholder="Min members" style="width: 100%; padding: 4px; margin-bottom: 5px; border-radius: 4px; border: none;">
            <button id="refreshList" style="width: 100%; padding: 4px; border: none; border-radius: 4px; background: #2196F3; color: white; cursor: pointer;">Apply</button>
            <button id="resetFilters" style="width: 100%; padding: 4px; margin-top: 5px; border: none; border-radius: 4px; background: #f44336; color: white; cursor: pointer;">Reset</button>
        `;
        document.body.appendChild(settingsDiv);

        document.getElementById('refreshList').addEventListener('click', filterList);
        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('hideCMPL').checked = false;
            document.getElementById('hideScore').value = '';
            document.getElementById('hideMembers').value = '';
            document.querySelectorAll('tr').forEach(row => row.style.display = '');
            filterList();
        });

        toggleButton.addEventListener('click', () => {
            settingsDiv.style.display = settingsDiv.style.display === 'none' ? 'block' : 'none';
            toggleButton.textContent = settingsDiv.style.display === 'none' ? 'Show Settings' : 'Hide Settings';
        });
    }

    function filterList() {
        const hideCMPL = document.getElementById('hideCMPL').checked;
        const hideScore = parseFloat(document.getElementById('hideScore').value);
        const hideMembers = parseInt(document.getElementById('hideMembers').value, 10);

        document.querySelectorAll('tr').forEach(row => {
            const cmplButton = row.querySelector('.completed');
            const scoreElem = row.querySelector('td:nth-child(5)');
            const memberElem = row.querySelector('td:nth-child(8)');

            row.style.display = '';

            if (cmplButton && hideCMPL) {
                row.style.display = 'none';
            }

            if (scoreElem) {
                const score = parseFloat(scoreElem.innerText);
                if (!isNaN(hideScore) && score < hideScore) {
                    row.style.display = 'none';
                }
                scoreElem.style.backgroundColor = getColor(score, [7.00, 7.50, 8.00]);
                scoreElem.style.color = 'white';
                scoreElem.style.fontWeight = 'bold';
                scoreElem.style.padding = '3px';
                scoreElem.style.borderRadius = '4px';
            }

            if (memberElem) {
                const members = parseInt(memberElem.innerText.replace(/,/g, ''), 10);
                if (!isNaN(hideMembers) && members < hideMembers) {
                    row.style.display = 'none';
                }
                memberElem.style.backgroundColor = getColor(members, [50000, 100000, 200000]);
                memberElem.style.color = 'white';
                memberElem.style.fontWeight = 'bold';
                memberElem.style.padding = '3px';
                memberElem.style.borderRadius = '4px';
            }
        });
    }

    function getColor(value, thresholds) {
        if (value < thresholds[0]) return 'red';
        if (value < thresholds[1]) return 'orange';
        if (value < thresholds[2]) return 'yellow';
        return 'green';
    }

    createSettingsUI();
    filterList();
})();
