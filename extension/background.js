// Default app URL - can be changed in settings
const DEFAULT_APP_URL = 'http://127.0.0.1:4321';

// URL patterns that can be imported
const IMPORT_URL_PATTERNS = [
  /^https?:\/\/(open\.)?spotify\.com\//i,
  /^https?:\/\/music\.apple\.com\//i,
  /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i,
  /^https?:\/\/tidal\.com\//i,
  /^https?:\/\/deezer\.com\//i,
  /^https?:\/\/soundcloud\.com\//i,
];

function isImportableUrl(url) {
  return IMPORT_URL_PATTERNS.some(pattern => pattern.test(url));
}

// Create context menus on install
chrome.runtime.onInstalled.addListener(() => {
  // Search for selected text
  chrome.contextMenus.create({
    id: 'spillover-search',
    title: 'Search "%s" on Spillover',
    contexts: ['selection']
  });

  // Import a link (only shown for music service links)
  chrome.contextMenus.create({
    id: 'spillover-import',
    title: 'Import to Spillover',
    contexts: ['link']
  });

  // Search from page (when nothing is selected)
  chrome.contextMenus.create({
    id: 'spillover-page',
    title: 'Search page title on Spillover',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { appUrl } = await chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL });

  if (info.menuItemId === 'spillover-search' && info.selectionText) {
    // Open app with search query
    const searchUrl = `${appUrl}?q=${encodeURIComponent(info.selectionText.trim())}`;
    chrome.tabs.create({ url: searchUrl });
  }

  if (info.menuItemId === 'spillover-import' && info.linkUrl) {
    // Check if it's an importable URL
    if (isImportableUrl(info.linkUrl)) {
      const importUrl = `${appUrl}?url=${encodeURIComponent(info.linkUrl)}`;
      chrome.tabs.create({ url: importUrl });
    } else {
      // Try to extract text from the link and search instead
      // Fall back to using the URL itself as search
      const searchUrl = `${appUrl}?q=${encodeURIComponent(info.linkUrl)}`;
      chrome.tabs.create({ url: searchUrl });
    }
  }

  if (info.menuItemId === 'spillover-page' && tab) {
    // Use page title for search, or URL if title is empty
    const searchQuery = tab.title || tab.url;
    const searchUrl = `${appUrl}?q=${encodeURIComponent(searchQuery)}`;
    chrome.tabs.create({ url: searchUrl });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAppUrl') {
    chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL }, (result) => {
      sendResponse({ appUrl: result.appUrl });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'setAppUrl') {
    chrome.storage.sync.set({ appUrl: request.appUrl }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
