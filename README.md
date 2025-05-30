# Helper Scripts

This repository contains a collection of user scripts and a batch script designed to enhance the functionality of various websites and automate tasks. These scripts are primarily intended for use with Tampermonkey or similar browser extensions.

## Table of Contents

- [Scripts Overview](#scripts-overview)
- [Installation](#installation)
- [Usage](#usage)
- [Scripts Details](#scripts-details)
  - [Multi-Site Anime Watched Button](#multi-site-anime-watched-button)
  - [YouTube Dynamic Views Highlighter](#youtube-dynamic-views-highlighter)
  - [VNDB Composite Material Badge](#vndb-composite-material-badge)
  - [MyAnimeList Search Enhancer](#myanimelist-search-enhancer)
  - [AniDB Sort & Material Color](#anidb-sort--material-color)
  - [DLsite Enhanced Sorter](#dlsite-enhanced-sorter)
  - [F95zone Auto-Continue External Hosts](#f95zone-auto-continue-external-hosts)
  - [Toggle Romaji Visibility](#mazii-toggle-romaji-visibility)
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
| `dlsite-sort-filter.js`              | Adds custom sorting and toggles for DLsite results.                         |
| `f95zone-redirect.js`                | Automatically continues through external host links on f95zone.to.          |
| `mazii-toggle-romaji.js`             | Toggles the visibility of Romaji text on Mazii.net.                         |
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
- **File**: [`multi-site-saved.js`](multi-site-saved.js)
- **Description**: Adds a "watched/unwatched" button to anime listing sites like Kusonime and Doronime. Includes options to export, import, and clear the watched list.

### YouTube Dynamic Views Highlighter
- **File**: [`youtube-dynamic-views-highlighter.js`](youtube-dynamic-views-highlighter.js)
- **Description**: Highlights YouTube view counts dynamically based on thresholds using Material Design colors. Includes a button to trigger the highlighting.

### VNDB Composite Material Badge
- **File**: [`vndb-rating-highlighter.js`](vndb-rating-highlighter.js)
- **Description**: Displays composite badges for VNDB ratings with Material Design colors. Clicking the badge can redirect to a Google search.

### MyAnimeList Search Enhancer
- **File**: [`mal-search-filter.js`](mal-search-filter.js)
- **Description**: Enhances MyAnimeList search results with filtering options for score, members, and completed status. Adds color coding for scores and member counts.

### AniDB Sort & Material Color
- **File**: [`anidb-sort-filter.js`](anidb-sort-filter.js)
- **Description**: Adds sorting functionality and Material Design coloring to AniDB tables for ratings, averages, reviews, and user counts.

### DLsite Enhanced Sorter
- **File**: [`dlsite-sort-filter.js`](dlsite-sort-filter.js)
- **Description**: Adds custom sorting options (rating, reviews, sales, rating per sale) and toggles for cart/favorite buttons on DLsite.

### F95zone Auto-Continue External Hosts
- **File**: [`f95zone-redirect.js`](f95zone-redirect.js)
- **Description**: Automatically clicks the "Continue to <host>" button on f95zone.to masked links.

### Toggle Romaji Visibility
- **File**: [`mazii-toggle-romaji.js`](mazii-toggle-romaji.js)
- **Description**: Toggles the visibility of Romaji text on Mazii.net with a single button click.

### Inviska ZIP Batch Script
- **File**: [`inviska-zip.bat`](inviska-zip.bat)
- **Description**: Automates the creation of ZIP files for subfolders, including specific file types and folders. Cleans up processed files after zipping.

---