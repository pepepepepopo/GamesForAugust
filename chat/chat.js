const GAS_URL = 'https://script.google.com/macros/s/AKfycbwxlJRiZkduOemZjqBFfBhsiglSvQnmVPC6N-XuFlqsZBIFU13fBMj7gOMAP8ohYjcAGA/exec'; // Replace with your GAS link

// List of banned words (add more if needed)
const bannedWords = ['fuck', 'shit', 'bitch', 'ass', 'dick', 'piss', 'cum', 'nigga', 'nigger'];

// Replace bad words with ***
function filterBadWords(text) {
  const wordRegex = new RegExp(`\\b(${bannedWords.join('|')})\\b`, 'gi');
  return text.replace(wordRegex, '***');
}

// Save username to localStorage
function saveUsername(name) {
  localStorage.setItem('chatUsername', name);
}

function getUsername() {
  return localStorage.getItem('chatUsername') || '';
}

function sendMessage() {
  const usernameInput = document.getElementById("username");
  const messageInput = document.getElementById("messageInput");

  const username = usernameInput.value.trim();
  const rawMessage = messageInput.value.trim();

  if (!username || !rawMessage) return;

  saveUsername(username);

  const message = filterBadWords(rawMessage);

  fetch(`${GAS_URL}?action=send&user=${encodeURIComponent(username)}&msg=${encodeURIComponent(message)}`)
    .then(() => {
      messageInput.value = '';
      loadMessages();
    });
}

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
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

function escapeHTML(text) {
  return text.replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    "'": '&#39;', '"': '&quot;'
  }[c]));
}

window.onload = () => {
  document.getElementById("username").value = getUsername();
  loadMessages();
};

setInterval(loadMessages, 1000);
