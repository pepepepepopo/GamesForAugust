// Replace with your deployed Google Apps Script Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwxlJRiZkduOemZjqBFfBhsiglSvQnmVPC6N-XuFlqsZBIFU13fBMj7gOMAP8ohYjcAGA/exec';

// Send a new message to the backend
function sendMessage() {
  const username = document.getElementById("username").value.trim();
  const message = document.getElementById("messageInput").value.trim();

  if (!username || !message) return;

  fetch(`${GAS_URL}?action=send&user=${encodeURIComponent(username)}&msg=${encodeURIComponent(message)}`)
    .then(() => {
      document.getElementById("messageInput").value = '';
      loadMessages();
    })
    .catch(err => {
      console.error("Failed to send message:", err);
    });
}

// Load messages from the backend
function loadMessages() {
  fetch(`${GAS_URL}?action=get`)
    .then(res => res.json())
    .then(data => {
      const messagesDiv = document.getElementById("messages");
      messagesDiv.innerHTML = '';

      data.messages.forEach(msg => {
        const el = document.createElement("div");
        el.innerHTML = `<strong>${escapeHTML(msg.user)}:</strong> ${escapeHTML(msg.text)}`;
        messagesDiv.appendChild(el);
      });

      // Auto-scroll to bottom
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    })
    .catch(err => {
      console.error("Failed to load messages:", err);
    });
}

// Simple escape to avoid HTML injection
function escapeHTML(text) {
  return text.replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    "'": '&#39;', '"': '&quot;'
  }[c]));
}

// Refresh every 2 seconds
setInterval(loadMessages, 2000);
window.onload = loadMessages;
