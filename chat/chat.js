const API_URL = "https://script.google.com/macros/s/AKfycbwHimJXM4MZCnJKr0t5Lu6IXbEymBGKAGMI5X6vO9S0J4B_dA1H9JXkDCiEqcCht5Q/exec";
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
        div.textContent = `[${new Date(msg.time).toLocaleTimeString()}] ${msg.user}: ${msg.text}`;
        messagesDiv.appendChild(div);
      });

      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = sanitize(input.value.trim());
  const user = localStorage.getItem("chatUsername");

  if (text) {
    fetch(`${API_URL}?action=send&user=${encodeURIComponent(user)}&msg=${encodeURIComponent(text)}`)
      .then(() => {
        input.value = "";
        fetchMessages();
      });
  }
}

setInterval(fetchMessages, 1000);
fetchMessages();
