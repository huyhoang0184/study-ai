let currentSubject = 'Đa Môn / Tổng Hợp';
let apiKey = localStorage.getItem('gemini_api_key') || '';

if (apiKey) {
    document.getElementById('api-key-input').value = apiKey;
}

function changeSubject(val) {
    currentSubject = val;
    document.getElementById('subject-badge').innerText = val;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-ml-72');
}

function startNewChat() {
    document.getElementById('welcome-view').classList.remove('hidden');
    document.getElementById('messages-list').classList.add('hidden');
    document.getElementById('messages-list').innerHTML = '';
}

function loadHistory(title) {
    document.getElementById('welcome-view').classList.add('hidden');
    const list = document.getElementById('messages-list');
    list.classList.remove('hidden');
    list.innerHTML = `
        <div class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0">H</div>
            <div class="text-sm text-gray-200 font-medium pt-1">${title}</div>
        </div>
        <div class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0">
                <i class="fa-solid fa-sparkles"></i>
            </div>
            <div class="text-sm text-gray-300 leading-relaxed space-y-2 pt-1">
                Đây là đoạn lịch sử trò chuyện về <b>"${title}"</b>. Hoàng có thể tiếp tục trao đổi với StudyAI bên dưới nhé! ✨
            </div>
        </div>
    `;
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function sendQuickPrompt(promptText) {
    document.getElementById('user-input').value = promptText;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    document.getElementById('welcome-view').classList.add('hidden');
    const list = document.getElementById('messages-list');
    list.classList.remove('hidden');

    // User message
    list.innerHTML += `
        <div class="flex gap-4 justify-start">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0">H</div>
            <div class="text-sm text-gray-200 font-medium pt-1 whitespace-pre-wrap">${escapeHtml(text)}</div>
        </div>
    `;
    input.value = '';
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Loading indicator
    const loadingId = 'loading-' + Date.now();
    list.innerHTML += `
        <div id="${loadingId}" class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0 animate-pulse">
                <i class="fa-solid fa-sparkles"></i>
            </div>
            <div class="text-sm text-gray-400 flex items-center gap-2 pt-1">
                <i class="fa-solid fa-circle-notch fa-spin"></i> StudyAI đang soạn câu trả lời...
            </div>
        </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const mode = document.getElementById('ai-mode-select').value;

    setTimeout(async () => {
        document.getElementById(loadingId).remove();

        if (mode === 'image') {
            const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(text)}?width=800&height=600&seed=${Math.floor(Math.random()*1000)}`;
            list.innerHTML += `
                <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs shrink-0">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div class="space-y-2 pt-1 max-w-lg">
                        <img src="${imgUrl}" alt="AI Image" class="w-full rounded-2xl border border-[#37393b] shadow-lg">
                        <p class="text-xs text-gray-400">Ảnh tạo theo mô tả: "${escapeHtml(text)}"</p>
                    </div>
                </div>
            `;
        } else {
            let aiResponse = "";
            if (apiKey) {
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `Bạn là trợ lý AI học tập StudyAI chuyên môn ${currentSubject}. Hãy trả lời rõ ràng, chi tiết cho học sinh: ${text}` }] }]
                        })
                    });
                    const data = await res.json();
                    aiResponse = data.candidates[0].content.parts[0].text;
                } catch (e) {
                    aiResponse = "⚠️ **Lỗi API Key:** Vui lòng kiểm tra lại cấu hình Gemini API Key!";
                }
            } else {
                aiResponse = `### 📚 [StudyAI - Môn: ${currentSubject}]\n\nCảm ơn bạn đã hỏi: **"${text}"**.\n\nHướng dẫn giải mẫu chi tiết từng bước theo chương trình môn **${currentSubject}** để nắm vững kiến thức trọng tâm.\n\n*(Mẹo: Bấm vào bánh răng ⚙️ ở góc dưới bên trái để nhập API Key dùng AI thật nhé!)* ✨`;
            }

            const formattedHtml = marked.parse(aiResponse);
            list.innerHTML += `
                <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0">
                        <i class="fa-solid fa-sparkles"></i>
                    </div>
                    <div class="text-sm text-gray-200 leading-relaxed space-y-2 pt-1 markdown-body">${formattedHtml}</div>
                </div>
            `;
        }
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 1000);
}

function openApiKeyModal() {
    document.getElementById('api-modal').classList.remove('hidden');
}

function closeApiKeyModal() {
    document.getElementById('api-modal').classList.add('hidden');
}

function saveApiKey() {
    apiKey = document.getElementById('api-key-input').value.trim();
    localStorage.setItem('gemini_api_key', apiKey);
    closeApiKeyModal();
    alert("Đã lưu API Key thành công!");
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
