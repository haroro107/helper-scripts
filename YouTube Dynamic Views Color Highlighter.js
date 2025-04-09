// ==UserScript==
// @name         YouTube Dynamic Views Color Highlighter (Material)
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Dynamically colors YouTube view metadata elements based on calculated thresholds using Material Design colors for background and text. Click the button to apply styling.
// @author       haroro107
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Converts text like "1.5M views" into a numeric value.
     * @param {string} viewText - The text containing the view count.
     * @returns {number} The parsed view count.
     */
    function parseViews(viewText) {
        viewText = viewText.trim().toLowerCase().replace("views", "").trim();
        let multiplier = 1;
        if (viewText.includes("m")) {
            multiplier = 1000000;
            viewText = viewText.replace("m", "");
        } else if (viewText.includes("k")) {
            multiplier = 1000;
            viewText = viewText.replace("k", "");
        }
        viewText = viewText.replace(/,/g, "").trim();
        let number = parseFloat(viewText);
        return isNaN(number) ? 0 : number * multiplier;
    }

    /**
     * Computes the minimum and maximum view counts among the elements.
     * @param {Array<number>} viewCounts - An array of view count numbers.
     * @returns {Object} An object with the properties min and max.
     */
    function getMinMax(viewCounts) {
        const min = Math.min(...viewCounts);
        const max = Math.max(...viewCounts);
        return { min, max };
    }

    /**
     * Colors each view count element based on dynamic thresholds.
     * Rules:
     * - Red: if view count < lowest + (range/3)
     * - Yellow: if view count is between lowest+(range/3) and lowest+(2*range/3)
     * - Green: if view count >= lowest + (2*range/3)
     * Colors follow Material Design:
     *   Red: background #EF5350, white text.
     *   Yellow: background #FFCA28, black text.
     *   Green: background #66BB6A, white text.
     */
    function colorizeViews() {
        // Get all spans that could contain view counts.
        const viewSpans = document.querySelectorAll('span.inline-metadata-item.style-scope.ytd-video-meta-block');
        let viewCounts = [];
        let items = [];

        // First pass: gather view counts.
        viewSpans.forEach(span => {
            let text = span.textContent || "";
            if (text.toLowerCase().includes("views")) {
                let count = parseViews(text);
                // Only include valid counts.
                if (count > 0) {
                    viewCounts.push(count);
                    items.push({ span, count });
                }
            }
        });

        // If no valid view counts are found, exit.
        if (viewCounts.length === 0) return;

        // Compute minimum and maximum views.
        const { min, max } = getMinMax(viewCounts);
        const range = max - min;
        const firstThreshold = range > 0 ? (min + range / 3) : min;
        const secondThreshold = range > 0 ? (min + 2 * range / 3) : min;

        console.log(`Min views: ${min}, Max views: ${max}`);
        console.log(`Thresholds: Red < ${firstThreshold}, Yellow < ${secondThreshold}, Green >= ${secondThreshold}`);

        // Second pass: apply colors based on thresholds.
        items.forEach(item => {
            if (item.count < firstThreshold) {
                item.span.style.backgroundColor = "#EF5350"; // Material Red
                item.span.style.color = "#FFFFFF"; // White text
            } else if (item.count < secondThreshold) {
                item.span.style.backgroundColor = "#FFCA28"; // Material Amber
                item.span.style.color = "#000000"; // Black text
            } else {
                item.span.style.backgroundColor = "#66BB6A"; // Material Green
                item.span.style.color = "#FFFFFF"; // White text
            }
            // Adding some padding and border radius for a better visual look.
            item.span.style.padding = "2px 4px";
            item.span.style.borderRadius = "3px";
        });
    }

    /**
     * Creates and injects a button into the page to manually trigger the view colorization.
     * The button is styled using Material Design concepts.
     */
    function addColorizeButton() {
        const btn = document.createElement("button");
        btn.textContent = "Colorize Views";
        btn.style.position = "fixed";
        btn.style.bottom = "10px";
        btn.style.right = "10px";
        btn.style.zIndex = 10000;
        btn.style.padding = "10px 15px";
        btn.style.backgroundColor = "#2196F3"; // Material Blue
        btn.style.color = "#FFFFFF";
        btn.style.border = "none";
        btn.style.borderRadius = "4px";
        btn.style.cursor = "pointer";
        btn.style.boxShadow = "0px 2px 4px rgba(0, 0, 0, 0.3)";
        btn.style.fontFamily = "Roboto, sans-serif";
        btn.style.fontSize = "14px";
        btn.addEventListener("click", colorizeViews);
        document.body.appendChild(btn);
    }

    // Inject the manual trigger button.
    addColorizeButton();

    // Optional: Uncomment the line below if you prefer the colorization to run automatically on navigation.
    // window.addEventListener("yt-navigate-finish", colorizeViews);
})();
