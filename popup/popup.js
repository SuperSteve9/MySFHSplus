// these buttons do jackshit yet, so WIP
document.getElementById("WIPc").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "darken" });
    });
});
document.getElementById("WIPs").addEventListener("click", () => {
    alert("WIP");
})