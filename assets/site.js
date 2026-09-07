(() => {
    const menuButton = document.querySelector('.menu');
    const navigation = document.querySelector('header nav');
    if (navigation) {
        const servicesLink = Array.from(navigation.children).find((item) => item.matches('a') && item.textContent.trim().toLowerCase() === 'services');
        if (servicesLink) {
            const servicesUrl = new URL(servicesLink.getAttribute('href'), window.location.href);
            const dropdown = document.createElement('div'); dropdown.className = 'nav-dropdown';
            const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'nav-dropdown-toggle'; toggle.setAttribute('aria-expanded', 'false'); toggle.innerHTML = 'Services <span class="nav-chevron" aria-hidden="true">›</span>';
            if (servicesLink.hasAttribute('aria-current')) toggle.setAttribute('aria-current', 'page');
            const dropdownMenu = document.createElement('div'); dropdownMenu.className = 'dropdown-menu';
            const serviceItems = [['Overview', ''],['Patents', 'patents/'],['Registered Designs', 'registered-designs/'],['Trade Secrets', 'trade-secrets/'],['IP Strategy & Opinions', 'ip-strategy-opinions/'],['Fractional In-House Support', 'fractional-in-house-support/'],['IP Audit', 'ip-audit/']];
            const currentPath = window.location.pathname.replace(/\/+$/, '') + '/';
            serviceItems.forEach(([label, path]) => { const link = document.createElement('a'); const itemUrl = new URL(path, servicesUrl); const itemPath = itemUrl.pathname.replace(/\/+$/, '') + '/'; link.href = itemUrl.href; link.textContent = label; if (currentPath === itemPath) link.setAttribute('aria-current', 'page'); dropdownMenu.appendChild(link); });
            const hoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
            const closeDropdown = () => { dropdown.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
            toggle.addEventListener('click', (event) => { if (hoverInput.matches) { event.preventDefault(); closeDropdown(); return; } event.stopPropagation(); const isOpen = dropdown.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(isOpen)); });
            dropdown.addEventListener('mouseenter', () => { if (hoverInput.matches) toggle.setAttribute('aria-expanded', 'true'); });
            dropdown.addEventListener('mouseleave', () => { if (hoverInput.matches) closeDropdown(); });
            document.addEventListener('click', (event) => { if (!dropdown.contains(event.target)) closeDropdown(); });
            dropdown.append(toggle, dropdownMenu); servicesLink.replaceWith(dropdown);
            if (!document.querySelector('style[data-dropdown-input-fix]')) { const dropdownStyle = document.createElement('style'); dropdownStyle.dataset.dropdownInputFix = 'true'; dropdownStyle.textContent = `.nav-chevron{transform:rotate(0deg)}.nav-dropdown.open .nav-chevron{transform:rotate(90deg)}@media (hover:hover) and (pointer:fine){.nav-dropdown:hover .nav-chevron,.nav-dropdown:focus-within .nav-chevron{transform:rotate(90deg)}}@media (hover:none),(pointer:coarse){.nav-dropdown:hover>.dropdown-menu,.nav-dropdown:focus-within>.dropdown-menu{display:none}.nav-dropdown.open>.dropdown-menu{display:block}}`; document.head.appendChild(dropdownStyle); }
        }
        const iprsLink = Array.from(navigation.children).find((item) => item.matches('a') && item.textContent.trim().toLowerCase() === 'iprs');
        if (iprsLink) {
            const iprsUrl = new URL(iprsLink.getAttribute('href'), window.location.href);
            const iprsDropdown = document.createElement('div'); iprsDropdown.className = 'nav-dropdown';
            const iprsToggle = document.createElement('button'); iprsToggle.type = 'button'; iprsToggle.className = 'nav-dropdown-toggle'; iprsToggle.setAttribute('aria-expanded', 'false'); iprsToggle.innerHTML = 'IPRs <span class="nav-chevron" aria-hidden="true">›</span>';
            if (iprsLink.hasAttribute('aria-current')) iprsToggle.setAttribute('aria-current', 'page');
            const iprsMenu = document.createElement('div'); iprsMenu.className = 'dropdown-menu';
            const iprsItems = [['Overview', ''],['Patents', 'patents/'],['Trade Marks', 'trade-marks/'],['Registered Designs', 'registered-designs/'],['Copyright', 'copyright/'],['Trade Secrets', 'trade-secrets/']];
            const currentIprsPath = window.location.pathname.replace(/\/+$/, '') + '/';
            iprsItems.forEach(([label, path]) => { const link = document.createElement('a'); const itemUrl = new URL(path, iprsUrl); const itemPath = itemUrl.pathname.replace(/\/+$/, '') + '/'; link.href = itemUrl.href; link.textContent = label; if (currentIprsPath === itemPath) link.setAttribute('aria-current', 'page'); iprsMenu.appendChild(link); });
            const iprsHoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
            const closeIprsDropdown = () => { iprsDropdown.classList.remove('open'); iprsToggle.setAttribute('aria-expanded', 'false'); };
            iprsToggle.addEventListener('click', (event) => { if (iprsHoverInput.matches) { event.preventDefault(); closeIprsDropdown(); return; } event.stopPropagation(); const isOpen = iprsDropdown.classList.toggle('open'); iprsToggle.setAttribute('aria-expanded', String(isOpen)); });
            iprsDropdown.addEventListener('mouseenter', () => { if (iprsHoverInput.matches) iprsToggle.setAttribute('aria-expanded', 'true'); });
            iprsDropdown.addEventListener('mouseleave', () => { if (iprsHoverInput.matches) closeIprsDropdown(); });
            document.addEventListener('click', (event) => { if (!iprsDropdown.contains(event.target)) closeIprsDropdown(); });
            iprsDropdown.append(iprsToggle, iprsMenu); iprsLink.replaceWith(iprsDropdown);
        }
    }
    if (menuButton && navigation) menuButton.addEventListener('click', () => { const isOpen = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!isOpen)); navigation.classList.toggle('open', !isOpen); });
    const header = document.querySelector('header');
    if (header) { const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24); updateHeader(); window.addEventListener('scroll', updateHeader, { passive: true }); }
    const lifecycleStages = Array.from(document.querySelectorAll('.lifecycle-stage'));
    if (lifecycleStages.length) {
        const hoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
        const closeStage = (stage) => { stage.classList.remove('open'); const button = stage.querySelector('.lifecycle-heading'); if (button) button.setAttribute('aria-expanded', 'false'); };
        lifecycleStages.forEach((stage) => {
            const button = stage.querySelector('.lifecycle-heading');
            if (!button) return;
            button.addEventListener('click', (event) => {
                if (hoverInput.matches) return;
                event.stopPropagation();
                const isOpen = stage.classList.contains('open');
                lifecycleStages.forEach(closeStage);
                if (!isOpen) { stage.classList.add('open'); button.setAttribute('aria-expanded', 'true'); }
            });
            stage.addEventListener('mouseenter', () => { if (hoverInput.matches) button.setAttribute('aria-expanded', 'true'); });
            stage.addEventListener('mouseleave', () => { if (hoverInput.matches) button.setAttribute('aria-expanded', 'false'); });
        });
        document.addEventListener('click', (event) => { if (!hoverInput.matches && !event.target.closest('.lifecycle-stage')) lifecycleStages.forEach(closeStage); });
    }
    const form = document.querySelector('form');
    if (form) form.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(form); const subject = encodeURIComponent('Website enquiry: ' + data.get('type')); const message = encodeURIComponent('Name: ' + data.get('name') + '\nOrganisation: ' + data.get('org') + '\nDeadline / launch: ' + data.get('deadline') + '\n\nHigh-level description:\n' + data.get('message')); const status = document.querySelector('.status'); if (status) status.textContent = 'Your email application will open. Sending an email does not create an attorney-client relationship.'; window.location.href = 'mailto:info@ridanip.com?subject=' + subject + '&body=' + message; });
})();
