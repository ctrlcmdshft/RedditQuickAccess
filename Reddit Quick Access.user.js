// ==UserScript==
// @name         Reddit Corner Buttons (Saved Posts & Messages)
// @namespace    Https://github.com/ctrlcmdshft/RedditQuickAccess
// @version      2.1
// @description  Adds buttons to access Saved Posts and Messages on Reddit (bottom-right corner). Handles SPA navigation and iframe issues.
// @author       CtrlCmdShft
// @match        https://www.reddit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @noframes     // Crucial: Prevents the script from running in iframes, avoiding duplicate runs on pages like Messages.
// @downloadURL  https://github.com/ctrlcmdshft/RedditQuickAccess/raw/refs/heads/main/Reddit-Quick-Access.user.js
// @updateURL    https://github.com/ctrlcmdshft/RedditQuickAccess/raw/refs/heads/main/Reddit-Quick-Access.user.js
// @grant        GM_addStyle
// @run-at       document-start // Run early to set the global flag before potential duplicate injections.
// @license      MIT // Example license, feel free to change
// ==/UserScript==

(function() {
    'use strict';

    /* --- Configuration --- */

    // Constants for button IDs and URLs
    const SAVED_URL = 'https://www.reddit.com/user/me/saved';
    const MESSAGES_URL = 'https://www.reddit.com/message/inbox'; // Base URL for messages page check
    const SAVED_BUTTON_ID = 'userscript-reddit-saved-button';
    const MESSAGES_BUTTON_ID = 'userscript-reddit-messages-button';

    // SVG Icons for the buttons
    const BOOKMARK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>`;
    const MAIL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor" aria-hidden="true"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>`;

    /* --- Initialization Guard (Global Flag) --- */

    // Define a unique name for the flag on the window object.
    // This prevents the script's core logic from running multiple times if the
    // script manager injects it more than once (common in SPAs or due to frames).
    const GLOBAL_FLAG_NAME = '__redditCornerButtonsInitialized_v2_5__'; // Use a versioned name

    // Check if the flag already exists on the window object.
    if (window[GLOBAL_FLAG_NAME]) {
        // If the flag exists, it means another instance of this script has already run
        // or is running in this top-level window context. Abort execution immediately.
        // console.log(`Reddit Corner Buttons: Global flag ${GLOBAL_FLAG_NAME} found. Aborting secondary execution.`);
        return;
    }
    // If the flag does not exist, set it to true immediately.
    // This marks that *this* instance is the primary one for this page view.
    window[GLOBAL_FLAG_NAME] = true;
    // console.log(`Reddit Corner Buttons: Global flag ${GLOBAL_FLAG_NAME} set by this instance.`);


    /* --- Styling --- */

    // CSS styles for the buttons. Using IDs for specificity.
    const styles = `
        .userscript-corner-button {
            /* Positioning */
            position: fixed;
            right: 20px;
            z-index: 1001; /* Ensure visibility above most elements */

            /* Appearance */
            width: 40px;
            height: 40px;
            color: #ffffff; /* White icon */
            border: none;
            border-radius: 50%; /* Circular */
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: background-color 0.2s;

            /* Flex layout for centering icon */
            display: flex !important; /* Use !important needed sometimes on Reddit to override base styles */
            align-items: center;
            justify-content: center;
            padding: 0; /* Remove default padding */
        }
        .userscript-corner-button svg {
            width: 20px;  /* Icon size */
            height: 20px; /* Icon size */
        }
        /* Specific styles for Saved Posts button */
        #${SAVED_BUTTON_ID} {
            bottom: 20px; /* Position from bottom */
            background-color: #ff4500; /* Reddit Orange */
        }
        #${SAVED_BUTTON_ID}:hover {
            background-color: #ff5722; /* Slightly lighter orange */
        }
        /* Specific styles for Messages button */
        #${MESSAGES_BUTTON_ID} {
            bottom: 70px; /* Position above saved button (20px + 40px height + 10px space) */
            background-color: #0079D3; /* Reddit Blue */
        }
        #${MESSAGES_BUTTON_ID}:hover {
            background-color: #1484D7; /* Slightly lighter blue */
        }
    `;
    // Inject the styles into the page head. Use try/catch for safety.
    try {
        GM_addStyle(styles);
        // console.log("Reddit Corner Buttons: Styles injected.");
    } catch (e) {
        console.error("Reddit Corner Buttons: Failed to inject styles using GM_addStyle.", e);
    }


    /* --- Core Functions --- */

    /**
     * Creates a button element based on provided options.
     * Does not append it to the DOM.
     * @param {object} options - Button properties (id, title, svgHTML, url).
     * @returns {HTMLButtonElement|null} The created button element or null on error.
     */
    function createButtonElement(options) {
        try {
            const button = document.createElement('button');
            button.id = options.id;
            button.className = 'userscript-corner-button'; // Apply base styles
            button.title = options.title; // Tooltip on hover
            button.setAttribute('aria-label', options.title); // Accessibility
            button.innerHTML = options.svgHTML; // Set the icon

            // Set the click action to navigate to the specified URL
            button.onclick = function() {
                window.location.href = options.url;
            };
            return button;
        } catch (e) {
            console.error(`Reddit Corner Buttons: Error creating button element ${options.id}:`, e);
            return null;
        }
    }

    /**
     * Removes existing corner buttons from the DOM using their IDs.
     * Acts as a failsafe against duplicates before adding new ones.
     */
    function removeExistingButtons() {
        const idsToRemove = [SAVED_BUTTON_ID, MESSAGES_BUTTON_ID];
        // console.log("Reddit Corner Buttons: Checking for and removing existing buttons...");
        idsToRemove.forEach(id => {
            // Find element by ID
            const existingButton = document.getElementById(id);
            // If found, remove it
            if (existingButton) {
                // console.log(` - Removing button with ID: ${id}`);
                existingButton.remove();
            }
        });
    }

    /**
     * The core logic that ensures buttons are present.
     * Removes any existing buttons and then creates/appends the new ones.
     * Should only be called after the relevant document load event has fired.
     */
    function initializeOrRefreshButtons() {
        // Essential check: Ensure document.body is available before trying to modify it.
        if (!document.body) {
             console.error("Reddit Corner Buttons: initializeOrRefreshButtons called but document.body not found!");
             return; // Cannot proceed without the body element
        }
        // console.log("Reddit Corner Buttons: Running initializeOrRefreshButtons...");

        // 1. Remove any potentially lingering buttons (failsafe)
        removeExistingButtons();

        // 2. Define button configurations
        const buttonConfigs = [
            { id: SAVED_BUTTON_ID, title: 'View Saved Posts', svgHTML: BOOKMARK_ICON_SVG, url: SAVED_URL },
            { id: MESSAGES_BUTTON_ID, title: 'View Messages', svgHTML: MAIL_ICON_SVG, url: MESSAGES_URL }
        ];

        // 3. Create and append each button
        buttonConfigs.forEach(config => {
            const buttonElement = createButtonElement(config);
            if (buttonElement) {
                try {
                    document.body.appendChild(buttonElement);
                    // console.log(` - Successfully created and appended button: ${config.id}`);
                } catch(e) {
                    console.error(`Reddit Corner Buttons: Failed to append button ${config.id} to body:`, e);
                }
            }
        });
        // console.log("Reddit Corner Buttons: Button refresh/initialization complete.");
    }


    /* --- Initialization Trigger --- */

    // This setup runs only in the *single instance* of the script that successfully set the global flag.

    // Determine if the script is currently loading on the problematic messages page.
    // This check happens early, based on the URL when the script first runs.
    const isOnMessagesPageInitially = window.location.href.startsWith(MESSAGES_URL);

    // Choose the correct event to wait for based on the page.
    if (isOnMessagesPageInitially) {
        // --- Special Handling for Messages Page ---
        // This page seems to have timing issues (possibly due to complex loading or iframes previously).
        // Wait for the *full* page load ('load' event) before trying to add buttons.
        // This gives all resources (images, scripts, etc.) time to finish loading.
        // console.log("Reddit Corner Buttons: On messages page. Waiting for 'load' event.");

        // Check if 'load' event already fired (e.g., script injected very late).
        if (document.readyState === 'complete') {
            // If page is already fully loaded, run the initialization immediately.
            // console.log("Reddit Corner Buttons: 'load' event already complete, running initialization now.");
            initializeOrRefreshButtons();
        } else {
            // Otherwise, add a listener for the 'load' event.
            window.addEventListener('load', initializeOrRefreshButtons);
        }
    } else {
        // --- Standard Handling for Other Pages ---
        // For all other Reddit pages, we can add the buttons earlier,
        // once the main HTML DOM is ready ('DOMContentLoaded'). This provides a faster user experience.
        // console.log("Reddit Corner Buttons: Not on messages page. Waiting for 'DOMContentLoaded'.");

        // Check if 'DOMContentLoaded' already fired.
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            // If DOM is already ready, run initialization immediately.
            // console.log("Reddit Corner Buttons: 'DOMContentLoaded' already complete, running initialization now.");
            initializeOrRefreshButtons();
        } else {
            // Otherwise, add a listener for the 'DOMContentLoaded' event.
            window.addEventListener('DOMContentLoaded', initializeOrRefreshButtons);
        }
    }


    /* --- Global Flag Cleanup --- */

    // Add a listener to clean up the global flag when the user navigates away
    // from the Reddit domain entirely (e.g., closes tab, types new URL).
    // This helps ensure a clean slate if they return later in a new session.
    window.addEventListener('beforeunload', () => {
        // console.log(`Reddit Corner Buttons: Clearing global flag ${GLOBAL_FLAG_NAME} on beforeunload.`);
        delete window[GLOBAL_FLAG_NAME];
    });

})(); // End of UserScript IIFE
