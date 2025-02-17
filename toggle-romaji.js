// ==UserScript==
// @name         Toggle Romaji Visibility
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Toggle visibility of elements with class 'txt-romaji ng-star-inserted' on button click.
// @author       You
// @match        https://mazii.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create the button
    const button = document.createElement('button');
    button.textContent = 'Toggle Romaji';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '10000'; // High z-index to ensure it's on top
    button.style.padding = '10px';
    button.style.backgroundColor = '#007bff';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    // Function to toggle visibility
    function toggleRomajiVisibility() {
        const romajiElements = document.querySelectorAll('.txt-romaji.ng-star-inserted');
        romajiElements.forEach(element => {
            if (element.style.display === 'none') {
                element.style.display = ''; // Show the element
            } else {
                element.style.display = 'none'; // Hide the element
            }
        });
    }

    // Add click event listener to the button
    button.addEventListener('click', toggleRomajiVisibility);

    // Append the button to the body
    document.body.appendChild(button);
})();
