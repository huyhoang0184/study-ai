let currentSubject = 'Đa Môn / Tổng Hợp';
let apiKey = localStorage.getItem('gemini_api_key') || '';

if (apiKey) {
    const inputKey = document.getElementById('api-key-input');
    if (inputKey) inputKey.value = apiKey;
}

function changeSubject(val) {
    currentSubject = val;
    const badge = document.getElementById('subject-badge');
    if (badge) badge.innerText = val;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('-ml-72');
}

function startNewChat() {
    document.getElementById('welcome-view')?.classList.remove('hidden');
    const list = document.getElementById('messages-list');
    if (list) {
        list.classList.add('hidden');
        list.innerHTML = '';
    }
}

function loadHistory(title) {
    document.getElementById('welcome-view')?.classList.add('hidden');
    const list = document.getElementById('messages-list');
    if (!list) return;
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
                Lịch sử trò chuyện về <b>"${title}"</b>. Bạn có thể tiếp tục đặt câu hỏi bên dưới nhé! ✨
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
    const input = document.getElementById('user-input');
    if (input) {
        input.value = promptText;
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    document.getElementById('welcome-view')?.classList.add('hidden');
    const list = document.getElementById('messages-list');
    if (!list) return;
    list.classList.remove('hidden');

    // Tin nhắn người dùng
    list.innerHTML += `
        <div class="flex gap-4 justify-start">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0">H</div>
            <div class="text-sm text-gray-200 font-medium pt-1 whitespace-pre-wrap">${escapeHtml(text)}</div>
        </div>
    `;
    input.value = '';
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;

    // Loading
    const loadingId = 'loading-' + Date.now();
    list.innerHTML += `
        <div id="${loadingId}" class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0 animate-pulse">
                <i class="fa-solid fa-sparkles"></i>
            </div>
            <div class="text-sm text-gray-400 flex items-center gap-2 pt-1">
                <i class="fa-solid fa-circle-notch fa-spin"></i> StudyAI đang phản hồi...
            </div>
        </div>
    `;
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;

    const mode = document.getElementById('ai-mode-select')?.value || 'chat';

    if (mode === 'image') {
        setTimeout(() => {
            document.getElementById(loadingId)?.remove();
            const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(text)}?width=800&height=600&seed=${Math.floor(Math.random()*1000)}`;
            list.innerHTML += `
                <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs shrink-0">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div class="space-y-2 pt-1 max-w-lg">
                        <img src="${imgUrl}" alt="AI Image" class="w-full rounded-2xl border border-[#37393b] shadow-lg">
                        <p class="text-xs text-gray-400">Hình ảnh theo mô tả: "${escapeHtml(text)}"</p>
                    </div>
                </div>
            `;
            if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 800);
    } else {
        const activeKey = apiKey || localStorage.getItem('gemini_api_key');

        if (!activeKey) {
            document.getElementById(loadingId)?.remove();
            list.innerHTML += `
                <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs shrink-0">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div class="text-sm text-yellow-400 pt-1">
                        Chưa tìm thấy API Key! Hãy bấm vào <b>Bánh răng ⚙️</b> ở góc dưới bên trái để dán mã vào nhé.
                    </div>
                </div>
            `;
            if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
            return;
        }

        try {
            // Thử gọi model gemini-1.5-flash chuẩn tương thích web
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Bạn là trợ lý học tập StudyAI chuyên môn ${currentSubject}. Hãy trả lời rõ ràng, chính xác bài tập sau cho học sinh: ${text}` }]
                    }]
                })
            });

            const data = await response.json();
            document.getElementById(loadingId)?.remove();

            if (data.error) {
                list.innerHTML += `
                    <div class="flex gap-4">
                        <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs shrink-0">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                        <div class="text-sm text-red-400 pt-1">
                            <b>Lỗi từ Google API:</b> ${data.error.message || 'API Key không hợp lệ.'}
                        </div>
                    </div>
                `;
            } else {
                const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không tìm thấy nội dung phản hồi.";
                const formattedHtml = typeof marked !== 'undefined' ? marked.parse(aiReply) : aiReply;

                list.innerHTML += `
                    <div class="flex gap-4">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0">
                            <i class="fa-solid fa-sparkles"></i>
                        </div>
                        <div class="text-sm text-gray-200 leading-relaxed space-y-2 pt-1 markdown-body">${formattedHtml}</div>
                    </div>
                `;
            }
        } catch (err) {
            document.getElementById(loadingId)?.remove();
            list.innerHTML += `
                <div class="flex gap-4">
                    <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs shrink-0">
                        <i class="fa-solid fa-wifi"></i>
                    </div>
                    <div class="text-sm text-red-400 pt-1">
                        <b>Lỗi kết nối mạng hoặc trình duyệt chặn (CORS):</b> Đảm bảo tắt tính năng chặn quảng cáo (Brave Shields) trên trang này.
                    </div>
                </div>
            `;
        }
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function openApiKeyModal() {
    document.getElementById('api-modal')?.classList.remove('hidden');
}

function closeApiKeyModal() {
    document.getElementById('api-modal')?.classList.add('hidden');
}

function saveApiKey() {
    const inputVal = document.getElementById('api-key-input')?.value.trim();
    if (inputVal) {
        apiKey = inputVal;
        localStorage.setItem('gemini_api_key', apiKey);
        closeApiKeyModal();
        alert("Đã lưu API Key thành công!");
    } else {
        alert("Vui lòng nhập API Key!");
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
