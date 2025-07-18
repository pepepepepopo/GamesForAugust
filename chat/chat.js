const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const username = localStorage.getItem("chatUsername");

const ENDPOINT = "https://script.google.com/macros/s/AKfycbwxlJRiZkduOemZjqBFfBhsiglSvQnmVPC6N-XuFlqsZBIFU13fBMj7gOMAP8ohYjcAGA/exec"; // Replace this

const badWords = ["fuck", "shit", "bitch", "ass", "dick", "cunt", "fag", "nigga", "nigger", "whore", "slut", "retard"];
function filterBadWords(text) {
  return text.replace(new RegExp(`\\b(${badWords.join("|")})\\b`, "gi"), "***");
}

function sendMessage() {
  const raw = messageInput.value.trim();
  if (!raw) return;

  const filtered = filterBadWords(raw);
  const params = new URLSearchParams({
    action: "send",
    user: username,
    msg: filtered,
  });

  fetch(`${ENDPOINT}?${params.toString()}`).then(() => {
    messageInput.value = "";
  });
}

function loadMessages() {
  fetch(`${ENDPOINT}?action=get`)
    .then((res) => res.json())
    .then((data) => {
      messagesDiv.innerHTML = "";
      data.messages.forEach(msg => {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${msg.user}</strong>: ${msg.text}`;
        messagesDiv.appendChild(p);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

setInterval(loadMessages, 1000);
loadMessages();
