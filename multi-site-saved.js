// ==UserScript==
// @name         Multi-Site Anime Watched Button
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Add a watched/unwatched button to multiple anime listing sites
// @author       You
// @match        *://kusonime.com/*
// @match        *://doronime.id/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to get stored anime list
    function getAnimeList() {
        return JSON.parse(localStorage.getItem('watchedAnime')) || {};
    }

    // Function to save anime list
    function saveAnimeList(data) {
        localStorage.setItem('watchedAnime', JSON.stringify(data));
    }

    let watchedList = getAnimeList();

    // Material colors
    const colors = {
        watched: '#4CAF50', // Green
        unwatched: '#F44336' // Red
    };

    // Site-specific query selectors
    const siteSelectors = {
        'kusonime.com': '.kover h2 a',
        'doronime.id': '.Card__caption-title a' // Customize for another site
    };

    let currentSite = Object.keys(siteSelectors).find(site => location.hostname.includes(site));
    if (!currentSite) return;

    document.querySelectorAll(siteSelectors[currentSite]).forEach(link => {
        let animeUrl = link.href;
        let button = document.createElement('button');
        button.textContent = watchedList[animeUrl] ? 'Saved' : 'Get';
        button.style.marginRight = '5px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = watchedList[animeUrl] ? colors.watched : colors.unwatched;
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '5px 10px';
        button.style.borderRadius = '4px';

        button.addEventListener('click', () => {
            if (watchedList[animeUrl]) {
                delete watchedList[animeUrl];
                button.textContent = 'Get';
                button.style.backgroundColor = colors.unwatched;
            } else {
                watchedList[animeUrl] = true;
                button.textContent = 'Saved';
                button.style.backgroundColor = colors.watched;
            }
            saveAnimeList(watchedList);
        });

        link.parentElement.insertBefore(button, link);
    });

    // Settings Button
    let settingsButton = document.createElement('button');
    settingsButton.textContent = '⚙ Settings';
    settingsButton.style.position = 'fixed';
    settingsButton.style.bottom = '20px';
    settingsButton.style.left = '20px';
    settingsButton.style.zIndex = '1000';
    settingsButton.style.cursor = 'pointer';
    document.body.appendChild(settingsButton);

    // Settings Menu
    let menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.bottom = '50px';
    menu.style.left = '20px';
    menu.style.background = 'white';
    menu.style.padding = '10px';
    menu.style.border = '1px solid black';
    menu.style.display = 'none';
    menu.style.flexDirection = 'column'; // Ensure vertical layout
    menu.style.gap = '5px';

    let clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Data';
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all watched data?')) {
            localStorage.removeItem('watchedAnime');
            watchedList = {};
            location.reload();
        }
    });

    let exportButton = document.createElement('button');
    exportButton.textContent = 'Export Data';
    exportButton.addEventListener('click', () => {
        let now = new Date();
        let fileName = `anime-list-${now.toISOString().slice(0, 10)}.json`;
        let dataStr = JSON.stringify(watchedList, null, 2);
        let blob = new Blob([dataStr], { type: 'application/json' });
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
    });

    let importButton = document.createElement('button');
    importButton.textContent = 'Import Data';
    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    importButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', event => {
        let file = event.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = e => {
                try {
                    watchedList = JSON.parse(e.target.result);
                    saveAnimeList(watchedList);
                    location.reload();
                } catch (error) {
                    alert('Invalid file format');
                }
            };
            reader.readAsText(file);
        }
    });

    menu.appendChild(clearButton);
    menu.appendChild(exportButton);
    menu.appendChild(importButton);
    document.body.appendChild(menu);
    document.body.appendChild(fileInput);

    settingsButton.addEventListener('click', () => {
        if (menu.style.display === 'none') {
            menu.style.display = 'flex';
            menu.style.flexDirection = 'column'; // Ensure it stays vertical
        } else {
            menu.style.display = 'none';
        }
    });
})();
