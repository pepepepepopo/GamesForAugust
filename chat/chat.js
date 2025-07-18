const API_URL = "https://script.google.com/macros/s/AKfycbwxlJRiZkduOemZjqBFfBhsiglSvQnmVPC6N-XuFlqsZBIFU13fBMj7gOMAP8ohYjcAGA/exec";
const badWords = ["fuck", "shit", "bitch", "ass", "cunt", "nigger", "nigga", "whore", "slut", "dick", "fag"]; // customize this

function sanitize(text) {
  let regex = new RegExp(`\\b(${badWords.join("|")})\\b`, "gi");
  return text.replace(regex, "***");
}

function fetchMessages() {
  fetch(`${API_URL}?action=get`)
    .then(res => res.json())
    .then(data => {
      const messages = data.messages;
      const messagesDiv = document.getElementById("messages");
      messagesDiv.innerHTML = "";

      messages.forEach(msg => {
        const div = document.createElement("div");
        const time = new Date(msg.time).toLocaleTimeString();
        div.textContent = `[${time}] ${msg.user}: ${msg.text}`;
        messagesDiv.appendChild(div);
      });

      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    })
    .catch(err => {
      console.error("Failed to load messages:", err);
    });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const user = localStorage.getItem("chatUsername");
  const raw = input.value.trim();

  if (!user) {
    alert("Please set a username first.");
    window.location.href = "username.html";
    return;
  }
  if (!raw) return;

  const text = sanitize(raw);

  fetch(`${API_URL}?action=send&user=${encodeURIComponent(user)}&msg=${encodeURIComponent(text)}`)
    .then(res => {
      if (!res.ok) throw new Error("Network error");
      return res.text();
    })
    .then(responseText => {
      if (responseText === "ok") {
        input.value = "";
        fetchMessages();
      } else {
        console.error("Unexpected response:", responseText);
        alert("Error sending message.");
      }
    })
    .catch(err => {
      console.error("Send failed:", err);
      alert("Failed to send message.");
    });
}

setInterval(fetchMessages, 1000);
fetchMessages();
