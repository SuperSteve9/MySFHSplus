// these buttons do jackshit yet, so WIP
document.getElementById("WIPc").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "darken" });
    });
});
document.getElementById("WIPs").addEventListener("click", () => {
    alert("WIP");
})
document.getElementById("SC").addEventListener("click", () => {
    window.location.href = "../spartancraft/game.html";
})
document.getElementById("SCt").addEventListener("click", () => {
    window.location.href = "../spartancraft/travis.html";
})