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
        const articlesLink = Array.from(navigation.children).find((item) => item.matches('a') && item.textContent.trim().toLowerCase() === 'articles');
        if (articlesLink) {
            const articlesUrl = new URL(articlesLink.getAttribute('href'), window.location.href);
            const articlesDropdown = document.createElement('div'); articlesDropdown.className = 'nav-dropdown';
            const articlesToggle = document.createElement('button'); articlesToggle.type = 'button'; articlesToggle.className = 'nav-dropdown-toggle'; articlesToggle.setAttribute('aria-expanded', 'false'); articlesToggle.innerHTML = 'Articles <span class="nav-chevron" aria-hidden="true">›</span>';
            if (articlesLink.hasAttribute('aria-current')) articlesToggle.setAttribute('aria-current', 'page');
            const articlesMenu = document.createElement('div'); articlesMenu.className = 'dropdown-menu';
            const articleItems = [
                ['Overview', ''],
                ['Patent or Trade Secret?', 'patent-or-trade-secret/'],
                ['When Should a Startup File?', 'when-should-a-startup-file-a-patent-application/'],
                ['Patenting for Startups', 'patenting-for-startups/'],
                ['Who Owns the IP?', 'who-owns-the-intellectual-property/'],
                ['What Investors Look For', 'what-investors-look-for-in-an-ip-portfolio/'],
                ['Fractional In-House IP Support', 'fractional-in-house-ip-support-when-does-it-make-sense/']
            ];
            const currentArticlesPath = window.location.pathname.replace(/\/+$/, '') + '/';
            articleItems.forEach(([label, path]) => { const link = document.createElement('a'); const itemUrl = new URL(path, articlesUrl); const itemPath = itemUrl.pathname.replace(/\/+$/, '') + '/'; link.href = itemUrl.href; link.textContent = label; if (currentArticlesPath === itemPath) link.setAttribute('aria-current', 'page'); articlesMenu.appendChild(link); });
            const articlesHoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
            const closeArticlesDropdown = () => { articlesDropdown.classList.remove('open'); articlesToggle.setAttribute('aria-expanded', 'false'); };
            articlesToggle.addEventListener('click', (event) => { if (articlesHoverInput.matches) { event.preventDefault(); closeArticlesDropdown(); return; } event.stopPropagation(); const isOpen = articlesDropdown.classList.toggle('open'); articlesToggle.setAttribute('aria-expanded', String(isOpen)); });
            articlesDropdown.addEventListener('mouseenter', () => { if (articlesHoverInput.matches) articlesToggle.setAttribute('aria-expanded', 'true'); });
            articlesDropdown.addEventListener('mouseleave', () => { if (articlesHoverInput.matches) closeArticlesDropdown(); });
            document.addEventListener('click', (event) => { if (!articlesDropdown.contains(event.target)) closeArticlesDropdown(); });
            articlesDropdown.append(articlesToggle, articlesMenu); articlesLink.replaceWith(articlesDropdown);
        }
    }
    const touchLikeInput = window.matchMedia('(hover: none), (pointer: coarse)');
    const closeAllNavDropdowns = (except = null) => {
        if (!navigation) return;
        navigation.querySelectorAll('.nav-dropdown').forEach((item) => {
            if (item === except) return;
            item.classList.remove('open');
            const button = item.querySelector(':scope > .nav-dropdown-toggle');
            if (button) button.setAttribute('aria-expanded', 'false');
        });
    };
    if (navigation) {
        navigation.addEventListener('click', (event) => {
            const toggle = event.target.closest('.nav-dropdown-toggle');
            if (toggle && touchLikeInput.matches) {
                const current = toggle.closest('.nav-dropdown');
                closeAllNavDropdowns(current);
                return;
            }
            const link = event.target.closest('a');
            if (link && navigation.classList.contains('open')) {
                navigation.classList.remove('open');
                document.body.classList.remove('menu-open');
                if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
                closeAllNavDropdowns();
            }
        }, true);
    }
    if (menuButton && navigation) menuButton.addEventListener('click', () => {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
        const nextOpen = !isOpen;
        menuButton.setAttribute('aria-expanded', String(nextOpen));
        navigation.classList.toggle('open', nextOpen);
        document.body.classList.toggle('menu-open', nextOpen);
        if (!nextOpen) closeAllNavDropdowns();
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navigation && navigation.classList.contains('open')) {
            navigation.classList.remove('open');
            document.body.classList.remove('menu-open');
            if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
            closeAllNavDropdowns();
        }
    });
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
