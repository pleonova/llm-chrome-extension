chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    chrome.omnibox.setDefaultSuggestion({
        description: `Enter standards to search for on DE Experience's Knowledge Base`,
    });
});