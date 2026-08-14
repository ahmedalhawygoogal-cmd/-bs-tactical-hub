let selectedMode = 'all';
let selectedStatus = 'all';

document.addEventListener("DOMContentLoaded", () => {
    initVisitorCounter();
    renderModeButtons();
    renderEvents();
    renderGeneralRules();
    renderTopIdeas();
    setupBottomNav();
    setupFilters();
    setupModalEvents();
    setupSidebarAndNotifs();
});

function initVisitorCounter() {
    const visitorEl = document.getElementById("visitors-count");
    let visitCount = parseInt(localStorage.getItem("bs_site_visits") || "0");
    const hasVisitedSession = sessionStorage.getItem("bs_session_active");

    if (!hasVisitedSession) {
        visitCount += 1;
        localStorage.setItem("bs_site_visits", visitCount.toString());
        sessionStorage.setItem("bs_session_active", "true");
    }

    visitorEl.innerText = `+${visitCount}`;
    document.getElementById("total-events").innerText = siteData.events.length;
    const readyCount = siteData.events.filter(e => e.status === 'ready').length;
    document.getElementById("ready-events").innerText = readyCount;
}

// بناء بطاقات الأوضاع بصور الخلفية الجديدة
function renderModeButtons() {
    const container = document.getElementById("modes-container");
    container.innerHTML = "";

    siteData.modes.forEach(mode => {
        const card = document.createElement("div");
        card.className = `mode-card-item ${selectedMode === mode.id ? 'active' : ''}`;
        
        if (mode.image.startsWith("linear-gradient")) {
            card.style.background = mode.image;
        } else {
            card.style.backgroundImage = `url('${mode.image}')`;
        }

        // إدراج النص فقط؛ طبقة التظليل تُدار الآن عبر ::before في الـ CSS
        card.innerHTML = `<span class="mode-card-title">${mode.name}</span>`;

        card.onclick = () => selectMode(mode.id);
        container.appendChild(card);
    });
}

function selectMode(modeId) {
    selectedMode = modeId;
    renderModeButtons();
    renderEvents();
}

function renderEvents() {
    const container = document.getElementById("events-container");
    container.innerHTML = "";

    const filtered = siteData.events.filter(event => {
        const matchMode = (selectedMode === 'all') || (event.mode === selectedMode);
        const matchStatus = (selectedStatus === 'all') || (event.status === selectedStatus);
        return matchMode && matchStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#8a8f9e; padding:30px 0;">لا توجد أفكار مطابقة للوضع المحدد حالياً.</p>`;
        return;
    }

    filtered.forEach(event => {
        const card = document.createElement("div");
        card.setAttribute("data-mode", event.mode);

        if (event.status === 'upcoming') {
            card.className = "event-card upcoming-card";
            card.innerHTML = `
                <h3 class="event-card-title">${event.title}</h3>
                <div class="upcoming-notice">🟡 فكرة قادمة قريباً</div>
            `;
        } else {
            card.className = "event-card";
            card.innerHTML = `
                <h3 class="event-card-title">${event.title}</h3>
                <button class="view-details-btn">عرض القوانين والتفاصيل الكاملة ←</button>
            `;
            const btn = card.querySelector(".view-details-btn");
            btn.onclick = () => openEventModal(event);
        }

        container.appendChild(card);
    });
}

function setupSidebarAndNotifs() {
    const menuBtn = document.getElementById("menu-btn");
    const closeSidebarBtn = document.getElementById("close-sidebar");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const notifBtn = document.getElementById("notif-btn");
    const notifModal = document.getElementById("notif-modal");
    const closeNotifBtn = document.getElementById("close-notif-modal");
    const shareBtn = document.getElementById("share-site-btn");

    const toggleSidebar = (state) => {
        sidebar.classList.toggle("active", state);
        overlay.classList.toggle("active", state);
    };

    menuBtn.onclick = () => toggleSidebar(true);
    closeSidebarBtn.onclick = () => toggleSidebar(false);
    overlay.onclick = () => toggleSidebar(false);

    shareBtn.onclick = () => {
        if (navigator.share) {
            navigator.share({ title: 'BS Events Hub', text: 'منصة الفعاليات والأفكار التكتيكية', url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("تم نسخ رابط الموقع بنجاح!");
        }
    };

    notifBtn.onclick = () => {
        const notifContainer = document.getElementById("notif-content");
        notifContainer.innerHTML = siteData.notifications.map(n => `
            <div class="notif-item">
                <h5>${n.title}</h5>
                <p>${n.text}</p>
            </div>
        `).join('');
        notifModal.classList.add("active");
    };

    closeNotifBtn.onclick = () => notifModal.classList.remove("active");
    notifModal.onclick = (e) => { if (e.target === notifModal) notifModal.classList.remove("active"); };
}

function setupModalEvents() {
    const modal = document.getElementById("event-modal");
    const closeBtn = document.getElementById("close-modal");
    closeBtn.onclick = () => modal.classList.remove("active");
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove("active"); };
}

function openEventModal(event) {
    const modal = document.getElementById("event-modal");
    const content = document.getElementById("modal-content");
    if (!event.rules) return;

    content.innerHTML = `
        <div class="modal-badge-row">
            <span class="modal-badge">🎮 ${event.modeName || 'وضع عام'}</span>
            <span class="modal-badge">${event.statusText}</span>
        </div>
        <h2 style="margin-bottom: 8px;">${event.title}</h2>
        <p style="color:#8a8f9e; font-size:0.9rem; margin-bottom: 15px;">${event.details}</p>

        <div class="rules-box allowed">
            <h5>🟢 المسموحات في الروم:</h5>
            <ul>
                ${event.rules.allowed.map(item => `<li>• ${item}</li>`).join('')}
            </ul>
        </div>

        <div class="rules-box prohibited">
            <h5>🔴 الممنوعات والشروط الصارمة:</h5>
            <ul>
                ${event.rules.prohibited.map(item => `<li>• ${item}</li>`).join('')}
            </ul>
        </div>

        <div class="rules-box" style="border-right: 3px solid var(--primary);">
            <h5>⚔️ نظام حساب الفوز:</h5>
            <p style="font-size:0.85rem; color:#b0b5c7;">${event.rules.winCondition}</p>
        </div>
    `;
    modal.classList.add("active");
}

function setupFilters() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            selectedStatus = tab.dataset.filter;
            renderEvents();
        });
    });
}

function setupBottomNav() {
    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".page-view");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetId = item.dataset.target;
            navItems.forEach(n => n.classList.remove("active"));
            views.forEach(v => v.classList.remove("active"));
            item.classList.add("active");
            document.getElementById(targetId).classList.add("active");
        });
    });
}

function renderGeneralRules() {
    const container = document.getElementById("rules-container");
    container.innerHTML = siteData.generalRules.map(r => `
        <div class="rules-card">
            <h4>${r.title}</h4>
            <p style="color:#8a8f9e; font-size:0.88rem; margin-top:6px; line-height:1.5;">${r.text}</p>
        </div>
    `).join('');
}

function renderTopIdeas() {
    const container = document.getElementById("top-ideas-container");
    container.innerHTML = siteData.topIdeas.map(item => `
        <div class="top-idea-card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>#${item.rank} ${item.title}</strong>
                <p style="font-size:0.75rem; color:#8a8f9e; margin-top:2px;">الوضع: ${item.modeName} • ${item.usage}</p>
            </div>
            <span style="color:var(--primary); font-size:0.75rem; font-weight:script.js; background:rgba(255,45,85,0.1); padding:4px 8px; border-radius:6px;">${item.tag}</span>
        </div>
    `).join('');
}

function scrollToEvents() {
    document.getElementById("events-anchor").scrollIntoView({ behavior: "smooth" });
}

