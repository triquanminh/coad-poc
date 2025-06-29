document.addEventListener('DOMContentLoaded', function() {
    const homeMenuItem = document.querySelector('.menu .menu-item');
    const featuresMenuItem = document.querySelectorAll('.menu .menu-item')[1];
    const aboutMenuItem = document.querySelectorAll('.menu .menu-item')[2];
    const heroSection = document.getElementById('hero');
    const featuresSection = document.getElementById('features-section');
    const aboutSection = document.getElementById('about-section');
    if (homeMenuItem && heroSection) {
        homeMenuItem.addEventListener('click', function() {
            heroSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (featuresMenuItem && featuresSection) {
        featuresMenuItem.addEventListener('click', function() {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (aboutMenuItem && aboutSection) {
        aboutMenuItem.addEventListener('click', function() {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Language switcher
    const langMenu = document.querySelector('.menu-item.lang');
    function updateI18nTexts(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = 'data-' + lang.toLowerCase();
            if (el.hasAttribute(key)) {
                el.textContent = el.getAttribute(key);
            }
        });
    }
    if (langMenu) {
        const langSpans = langMenu.querySelectorAll('span[data-lang]');
        langSpans.forEach(span => {
            span.style.cursor = 'pointer';
            span.addEventListener('click', function() {
                langSpans.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                let lang = this.getAttribute('data-lang');
                localStorage.setItem('selectedLang', lang);
                updateI18nTexts(lang);
            });
        });
        // On load, restore language
        const savedLang = localStorage.getItem('selectedLang') || 'EN';
        langSpans.forEach(s => {
            if (s.getAttribute('data-lang') === savedLang) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
        updateI18nTexts(savedLang);
    }
});

    const name = document.getElementById('name');
    const phone = document.getElementById('phone');
    const email = document.getElementById('email');
    const job = document.getElementById('job');
    const company = document.getElementById('company');
    const industry = document.getElementById('industry');
    const business = document.getElementById('business');
    const meeting = document.getElementById('meeting');
    const button = document.getElementById('submit');

    function showToast({ 
        type = 'error', // 'success' | 'error'
        title = '',
        message = '',
        linkText = '',
        linkHref = '',
        duration = 3500
    }) {
        // Remove old toast if exists
        const old = document.querySelector('.custom-toast-v2');
        if (old) old.remove();

        // Toast container
        const toast = document.createElement('div');
        toast.className = `custom-toast-v2 ${type}`;

        // Icon SVG
        const icon = type === 'success'
            ? `<svg width="32" height="32" fill="none"><circle cx="16" cy="16" r="16" fill="#4BB543"/><path d="M10 17l4 4 8-8" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            : `<svg width="32" height="32" fill="none"><circle cx="16" cy="16" r="16" fill="#FF5252"/><path d="M12 12l8 8M20 12l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => toast.remove();

        // Toast content
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message} 
                    ${linkText && linkHref ? `<a href="${linkHref}" target="_blank">${linkText}</a>` : ''}
                </div>
            </div>
        `;
        toast.appendChild(closeBtn);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // Add styles if not present
    if (!document.getElementById('custom-toast-v2-style')) {
        const style = document.createElement('style');
        style.id = 'custom-toast-v2-style';
        style.innerHTML = `
        .custom-toast-v2 {
            display: flex; align-items: flex-start; gap: 16px;
            position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%) scale(0.97);
            min-width: 320px; max-width: 95vw; background: #fff;
            color: #222; padding: 20px 32px 20px 20px; border-radius: 16px;
            font-size: 16px; z-index: 9999; box-shadow: 0 4px 24px rgba(0,0,0,0.13);
            opacity: 0; pointer-events: none; border: 1.5px solid #eee;
            transition: opacity 0.4s, transform 0.4s, border-color 0.3s;
        }
        .custom-toast-v2.show { opacity: 1; pointer-events: auto; transform: translateX(-50%) scale(1);}
        .custom-toast-v2.success { border-color: #4BB543; }
        .custom-toast-v2.error { border-color: #FF5252; }
        .custom-toast-v2 .toast-icon { flex-shrink: 0; margin-top: 2px;}
        .custom-toast-v2 .toast-title { font-weight: bold; font-size: 18px; margin-bottom: 2px;}
        .custom-toast-v2 .toast-message { font-size: 15px; color: #444;}
        .custom-toast-v2 .toast-message a { color: #1978ef; text-decoration: underline; margin-left: 4px;}
        .custom-toast-v2 .toast-close-btn {
            background: none; border: none; color: #888; font-size: 22px; font-weight: bold;
            position: absolute; top: 10px; right: 18px; cursor: pointer; line-height: 1;
            transition: color 0.2s;
        }
        .custom-toast-v2 .toast-close-btn:hover { color: #222; }
        `;
        document.head.appendChild(style);
    }

    button.addEventListener("click", (e)=> {
        e.preventDefault();
        // Validate all fields
        if (!name.value.trim()) {
            showToast({
                type: 'error',
                title: 'Missing field!',
                message: 'Please enter your name.'
            });
            return;
        }
        if (!phone.value.trim()) {
            showToast({
                type: 'error',
                title: 'Missing field!',
                message: 'Please enter your phone number.'
            });
            return;
        }
        if (!email.value.trim()) {
            showToast({
                type: 'error',
                title: 'Missing field!',
                message: 'Please enter your email.'
            });
            return;
        }
        if (!job.value.trim()) {
            showToast({
                type: 'error',
                title: 'Missing field!',
                message: 'Please enter your job title.'
            });
            return;
        }
        if (!company.value.trim()) {
            showToast({
                type: 'error',
                title: 'Missing field!',
                message: 'Please enter your company.'
            });
            return;
        }
        if (!industry.value.trim()) {
            showToast({
                type: 'error',
                title: 'Missing field!',
                message: 'Please enter your industry.'
            });
            return;
        }
        if (!business.value.trim()) {
            showToast({
                type: 'error',
                title: 'Missing field!',
                message: 'Please enter your business need.'
            });
            return;
        }
        // All fields valid, proceed
        const data = {
            name: name.value,
            phone: phone.value,
            email: email.value,
            job: job.value,
            company: company.value,
            industry: industry.value,
            business: business.value,
            meeting: meeting.checked ? 'Yes' : 'No'
        }
        postData(data)
    })
    async function postData(data) {
        const formData = new FormData();
        formData.append("entry.1602654200", data.name);
        formData.append("entry.509202446", data.phone);
        formData.append("entry.1010441430", data.email);
        formData.append("entry.1935210942", data.job);
        formData.append("entry.1400751405", data.company);
        formData.append("entry.2000715319", data.industry);
        formData.append("entry.1289047909", data.business);
        formData.append("entry.1981665087", data.meeting);

        try {
            await fetch("https://docs.google.com/forms/u/0/d/e/1FAIpQLSe1hlKDkMZtFy6cQT7qqZ311zPWN-xkW2AGBQTHN2lB_AjWsA/formResponse", {
                method: "POST",
                body: formData,
                mode: "no-cors",
            });
            showToast({
                type: 'success',
                title: 'Success!',
                message: 'Your information has been submitted successfully!'
            });
            // Reset form fields
            name.value = '';
            phone.value = '';
            email.value = '';
            job.value = '';
            company.value = '';
            industry.value = '';
            business.value = '';
            meeting.checked = false;
        } catch (error) {
            showToast({
                type: 'error',
                title: 'An error occurred',
                message: 'Please try again later.',
                linkText: 'Send report',
                linkHref: '#'
            });
        }
    }
