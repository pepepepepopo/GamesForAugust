const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const username = localStorage.getItem("chatUsername");

const badWords = ["badword1", "badword2", "ass", "fuck", "shit", "bitch"];
function filterBadWords(text) {
  return text.replace(new RegExp(badWords.join("|"), "gi"), "***");
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  const filtered = filterBadWords(message);

  fetch("https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_URL/exec", {
    method: "POST",
    body: JSON.stringify({ username, message: filtered }),
    headers: { "Content-Type": "application/json" },
  });

  messageInput.value = "";
}

function loadMessages() {
  fetch("https://script.google.com/macros/s/AKfycbwxlJRiZkduOemZjqBFfBhsiglSvQnmVPC6N-XuFlqsZBIFU13fBMj7gOMAP8ohYjcAGA/exec")
    .then((res) => res.json())
    .then((data) => {
      messagesDiv.innerHTML = "";
      data.messages.forEach(msg => {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${msg.username}</strong>: ${msg.message}`;
        messagesDiv.appendChild(p);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

setInterval(loadMessages, 1000);
loadMessages();
