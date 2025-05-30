// ==UserScript==
// @name         f95zone Auto-Continue External Hosts
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically redirect through the "Continue to <host>" button on f95zone.to masked links
// @author       haroro107
// @match        *://f95zone.to/masked/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const maxAttempts = 10;
    let attempts = 0;

    function tryRedirect() {
        const btn = document.querySelector('a.host_link');
        if (btn) {
            console.log('f95zone AutoRedirect: Found host_link, clicking...');
            btn.click();
        } else if (++attempts < maxAttempts) {
            window.requestAnimationFrame(tryRedirect);
        } else {
            console.warn('f95zone AutoRedirect: host_link not found.');
        }
    }

    tryRedirect();
})();
