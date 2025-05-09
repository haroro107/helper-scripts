# Helper Scripts

This repository contains a collection of user scripts and a batch script designed to enhance the functionality of various websites and automate tasks. These scripts are primarily intended for use with Tampermonkey or similar browser extensions.

## Table of Contents

- [Scripts Overview](#scripts-overview)
- [Installation](#installation)
- [Usage](#usage)
- [Scripts Details](#scripts-details)
  - [Multi-Site Anime Watched Button](#multi-site-anime-watched-button)
  - [YouTube Dynamic Views Highlighter](#youtube-dynamic-views-highlighter)
  - [VNDB Rating Highlighter](#vndb-rating-highlighter)
  - [MyAnimeList Search Enhancer](#myanimelist-search-enhancer)
  - [AniDB Sort & Material Color](#anidb-sort--material-color)
  - [Toggle Romaji Visibility](#toggle-romaji-visibility)
  - [Inviska ZIP Batch Script](#inviska-zip-batch-script)

---

## Scripts Overview

| Script Name                          | Description                                                                 |
|--------------------------------------|-----------------------------------------------------------------------------|
| `multi-site-saved.js`                | Adds a "watched/unwatched" button to anime listing sites.                   |
| `youtube-dynamic-views-highlighter.js` | Highlights YouTube view counts dynamically based on thresholds.             |
| `vndb-rating-highlighter.js`         | Displays composite badges for VNDB ratings with Material Design colors.     |
| `mal-search-filter.js`               | Enhances MyAnimeList search results with filtering and coloring options.    |
| `anidb-sort-filter.js`               | Adds sorting and Material Design coloring to AniDB tables.                  |
| `toggle-romaji.js`                   | Toggles the visibility of Romaji text on Mazii.net.                         |
| `inviska-zip.bat`                    | Automates zipping and cleanup of specific files and folders.                |

---

## Installation

### For User Scripts
1. Install a browser extension like [Tampermonkey](https://www.tampermonkey.net/).
2. Copy the content of the desired `.js` script.
3. Create a new script in Tampermonkey and paste the copied content.
4. Save and enable the script.

### For Batch Script
1. Ensure you have [7-Zip](https://www.7-zip.org/) installed and added to your system's PATH.
2. Place the `inviska-zip.bat` file in the directory where you want to process subfolders.
3. Run the script by double-clicking it or executing it in a terminal.

---

## Usage

### User Scripts
- Each script is designed to work on specific websites. Ensure the script is enabled when visiting the corresponding site.
- Some scripts add buttons or UI elements to the page for interaction.

### Batch Script
- Place the batch script in the root directory containing subfolders you want to process.
- Run the script to create ZIP files for each subfolder and clean up the processed files.

---

## Scripts Details

### Multi-Site Anime Watched Button
- **File**: [`multi-site-saved.js`](c:/Projects/helper-scripts/multi-site-saved.js)
- **Description**: Adds a "watched/unwatched" button to anime listing sites like Kusonime and Doronime. Includes options to export, import, and clear the watched list.

### YouTube Dynamic Views Highlighter
- **File**: [`youtube-dynamic-views-highlighter.js`](c:/Projects/helper-scripts/youtube-dynamic-views-highlighter.js)
- **Description**: Highlights YouTube view counts dynamically based on thresholds using Material Design colors. Includes a button to trigger the highlighting.

### VNDB Rating Highlighter
- **File**: [`vndb-rating-highlighter.js`](c:/Projects/helper-scripts/vndb-rating-highlighter.js)
- **Description**: Displays composite badges for VNDB ratings with Material Design colors. Clicking the badge can redirect to a Google search.

### MyAnimeList Search Enhancer
- **File**: [`mal-search-filter.js`](c:/Projects/helper-scripts/mal-search-filter.js)
- **Description**: Enhances MyAnimeList search results with filtering options for score, members, and completed status. Adds color coding for scores and member counts.

### AniDB Sort & Material Color
- **File**: [`anidb-sort-filter.js`](c:/Projects/helper-scripts/anidb-sort-filter.js)
- **Description**: Adds sorting functionality and Material Design coloring to AniDB tables for ratings, averages, reviews, and user counts.

### Toggle Romaji Visibility
- **File**: [`toggle-romaji.js`](c:/Projects/helper-scripts/toggle-romaji.js)
- **Description**: Toggles the visibility of Romaji text on Mazii.net with a single button click.

### Inviska ZIP Batch Script
- **File**: [`inviska-zip.bat`](c:/Projects/helper-scripts/inviska-zip.bat)
- **Description**: Automates the creation of ZIP files for subfolders, including specific file types and folders. Cleans up processed files after zipping.

---
