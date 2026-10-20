(() => {
    const menuButton = document.querySelector('.menu');
    const navigation = document.querySelector('header nav');
    const compactNav = window.matchMedia('(max-width: 960px)');
    if (navigation) {
        const servicesLink = Array.from(navigation.children).find((item) => item.matches('a') && item.textContent.trim().toLowerCase() === 'services');
        if (servicesLink) {
            const servicesUrl = new URL(servicesLink.getAttribute('href'), window.location.href);
            const dropdown = document.createElement('div'); dropdown.className = 'nav-dropdown';
            const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'nav-dropdown-toggle'; toggle.setAttribute('aria-expanded', 'false'); toggle.innerHTML = 'Services <span class="nav-chevron" aria-hidden="true">›</span>';
            if (servicesLink.hasAttribute('aria-current')) toggle.setAttribute('aria-current', 'page');
            const dropdownMenu = document.createElement('div'); dropdownMenu.className = 'dropdown-menu';
            const serviceItems = [['Overview', ''],['Patents', 'patents/'],['Registered Designs', 'registered-designs/'],['Trade Secrets', 'trade-secrets/'],['IP Strategy & Opinions', 'ip-strategy-opinions/'],['Fractional Patent Counsel', 'fractional-in-house-support/'],['Engineering & Physical Products', '../mechanical-engineering-patent-attorney/'],['IP Audit', 'ip-audit/'],['Overseas Attorneys', '../overseas-attorneys/']];
            const currentPath = window.location.pathname.replace(/\/+$/, '') + '/';
            serviceItems.forEach(([label, path]) => { const link = document.createElement('a'); const itemUrl = new URL(path, servicesUrl); const itemPath = itemUrl.pathname.replace(/\/+$/, '') + '/'; link.href = itemUrl.href; link.textContent = label; if (currentPath === itemPath) link.setAttribute('aria-current', 'page'); dropdownMenu.appendChild(link); });
            dropdown.append(toggle, dropdownMenu); servicesLink.replaceWith(dropdown);
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
                ['AI Patent Drafting', 'can-i-use-ai-to-draft-my-patent-application/'],
                ['How Much Does a UK Patent Application Cost?', 'how-much-does-a-uk-patent-application-cost/'],
                ['Patent or Trade Secret?', 'patent-or-trade-secret/'],
                ['When Should a Startup File?', 'when-should-a-startup-file-a-patent-application/'],
                ['Patenting for Startups', 'patenting-for-startups/'],
                ['Who Owns the IP?', 'who-owns-the-intellectual-property/'],
                ['Preparing for Investment', 'what-investors-look-for-in-an-ip-portfolio/'],
                ['Fractional In-House IP Support', 'fractional-in-house-ip-support-when-does-it-make-sense/']
            ];
            const currentArticlesPath = window.location.pathname.replace(/\/+$/, '') + '/';
            articleItems.forEach(([label, path]) => { const link = document.createElement('a'); const itemUrl = new URL(path, articlesUrl); const itemPath = itemUrl.pathname.replace(/\/+$/, '') + '/'; link.href = itemUrl.href; link.textContent = label; if (currentArticlesPath === itemPath) link.setAttribute('aria-current', 'page'); articlesMenu.appendChild(link); });
            articlesDropdown.append(articlesToggle, articlesMenu); articlesLink.replaceWith(articlesDropdown);
        }
    }
    const hoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
    const navDropdowns = navigation ? Array.from(navigation.querySelectorAll('.nav-dropdown')) : [];
    const hoverOpenedNav = new WeakSet();
    const setNavDropdown = (dropdown, open) => {
        if (!open) hoverOpenedNav.delete(dropdown);
        dropdown.classList.toggle('open', open);
        dropdown.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', String(open));
    };
    const closeAllNavDropdowns = (except = null) => {
        navDropdowns.forEach((dropdown) => { if (dropdown !== except) setNavDropdown(dropdown, false); });
    };
    const closeNavigation = () => {
        if (navigation) navigation.classList.remove('open');
        document.body.classList.remove('menu-open');
        if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
        closeAllNavDropdowns();
    };
    navDropdowns.forEach((dropdown, index) => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        const panel = dropdown.querySelector('.dropdown-menu');
        panel.id = 'nav-submenu-' + (index + 1);
        toggle.setAttribute('aria-controls', panel.id);
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const open = (event.detail > 0 && hoverOpenedNav.has(dropdown)) || toggle.getAttribute('aria-expanded') !== 'true';
            hoverOpenedNav.delete(dropdown);
            closeAllNavDropdowns(dropdown);
            setNavDropdown(dropdown, open);
        });
        dropdown.addEventListener('mouseenter', () => {
            if (hoverInput.matches && !compactNav.matches) {
                const focusedMenu = document.activeElement && document.activeElement.closest('.dropdown-menu');
                if (focusedMenu && !dropdown.contains(focusedMenu)) return;
                const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
                closeAllNavDropdowns(dropdown);
                setNavDropdown(dropdown, true);
                if (!wasOpen) hoverOpenedNav.add(dropdown);
            }
        });
        dropdown.addEventListener('mouseleave', () => {
            if (hoverInput.matches && !compactNav.matches && !dropdown.contains(document.activeElement)) setNavDropdown(dropdown, false);
        });
        dropdown.addEventListener('focusout', (event) => {
            if (!dropdown.contains(event.relatedTarget)) setNavDropdown(dropdown, false);
        });
        dropdown.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
            event.preventDefault();
            event.stopPropagation();
            setNavDropdown(dropdown, false);
            toggle.focus();
        });
    });
    if (navigation) {
        navigation.addEventListener('click', (event) => {
            if (event.target.closest('a')) closeNavigation();
        });
        document.addEventListener('click', (event) => {
            if (!navigation.contains(event.target) && event.target !== menuButton && !(menuButton && menuButton.contains(event.target))) closeAllNavDropdowns();
        });
    }
    if (menuButton && navigation) menuButton.addEventListener('click', () => {
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        if (!open) { closeNavigation(); return; }
        menuButton.setAttribute('aria-expanded', 'true');
        navigation.classList.add('open');
        document.body.classList.add('menu-open');
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (navigation && navigation.classList.contains('open')) {
            event.preventDefault();
            closeNavigation();
            if (menuButton) menuButton.focus();
        } else if (navDropdowns.some((dropdown) => dropdown.classList.contains('open'))) {
            event.preventDefault();
            closeAllNavDropdowns();
        }
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 960) closeNavigation();
    });
    const header = document.querySelector('header');
    if (header) { const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24); updateHeader(); window.addEventListener('scroll', updateHeader, { passive: true }); }
    // V073.0: return to the linked article summary without adding history entries.
    const articleSummary = document.querySelector('[data-article-summary]');
    const summaryHeading = document.getElementById('article-summary');
    const summaryArticle = articleSummary && articleSummary.closest('article');
    if (articleSummary && summaryHeading && summaryArticle) {
        const summaryReturn = document.createElement('button');
        summaryReturn.type = 'button';
        summaryReturn.className = 'summary-return';
        summaryReturn.hidden = true;
        summaryReturn.innerHTML = '<span aria-hidden="true">↑</span> Back to summary';
        summaryReturn.setAttribute('aria-controls', summaryHeading.id);
        document.body.appendChild(summaryReturn);
        const updateSummaryReturn = () => {
            const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
            summaryReturn.hidden = articleSummary.getBoundingClientRect().bottom > headerBottom ||
                summaryArticle.getBoundingClientRect().bottom <= headerBottom;
        };
        let summaryFrame = 0;
        const queueSummaryUpdate = () => {
            if (summaryFrame) return;
            summaryFrame = window.requestAnimationFrame(() => {
                summaryFrame = 0;
                updateSummaryReturn();
            });
        };
        summaryReturn.addEventListener('click', () => {
            summaryHeading.focus({ preventScroll: true });
            summaryHeading.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                block: 'start'
            });
        });
        window.addEventListener('scroll', queueSummaryUpdate, { passive: true });
        window.addEventListener('resize', queueSummaryUpdate);
        window.addEventListener('pageshow', queueSummaryUpdate);
        if ('ResizeObserver' in window) new ResizeObserver(queueSummaryUpdate).observe(summaryArticle);
        updateSummaryReturn();
    }
    const lifecycleStages = Array.from(document.querySelectorAll('.lifecycle-stage'));
    if (lifecycleStages.length) {
        const hoverOpenedStages = new WeakSet();
        const setStage = (stage, open) => {
            if (!open) hoverOpenedStages.delete(stage);
            stage.classList.toggle('open', open);
            const button = stage.querySelector('.lifecycle-heading');
            if (button) button.setAttribute('aria-expanded', String(open));
            const panel = stage.querySelector('.lifecycle-detail');
            if (panel) panel.hidden = !open;
        };
        const closeStages = (except = null) => {
            lifecycleStages.forEach((stage) => { if (stage !== except) setStage(stage, false); });
        };
        closeStages();
        lifecycleStages.forEach((stage) => {
            const button = stage.querySelector('.lifecycle-heading');
            if (!button) return;
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const open = (event.detail > 0 && hoverOpenedStages.has(stage)) || button.getAttribute('aria-expanded') !== 'true';
                hoverOpenedStages.delete(stage);
                closeStages(stage);
                setStage(stage, open);
            });
            stage.addEventListener('mouseenter', () => {
                if (hoverInput.matches) {
                    const wasOpen = button.getAttribute('aria-expanded') === 'true';
                    closeStages(stage);
                    setStage(stage, true);
                    if (!wasOpen) hoverOpenedStages.add(stage);
                }
            });
            stage.addEventListener('mouseleave', () => {
                if (hoverInput.matches && !stage.contains(document.activeElement)) setStage(stage, false);
            });
            stage.addEventListener('focusout', (event) => {
                if (!stage.contains(event.relatedTarget)) setStage(stage, false);
            });
            stage.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
                event.preventDefault();
                event.stopPropagation();
                setStage(stage, false);
                button.focus();
            });
        });
        document.addEventListener('click', (event) => { if (!event.target.closest('.lifecycle-stage')) closeStages(); });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && lifecycleStages.some((stage) => stage.classList.contains('open'))) {
                event.preventDefault();
                closeStages();
            }
        });
    }
    const footerGrid = document.querySelector('footer .foot');
    if (footerGrid && !footerGrid.querySelector('.footer-accreditations')) {
        const accreditations = document.createElement('div');
        accreditations.className = 'footer-accreditations';
        const footerLogos = [
            ['https://www.cipa.org.uk/', '/assets/cipa-logo-white.webp', "Visit CIPA's website", 'logo-cipa', 512, 122],
            ['https://ipreg.org.uk/', '/assets/ipreg-logo.webp', "Visit IPReg's website", 'logo-ipreg', 490, 122],
            ['https://www.fsb.org.uk/', '/assets/fsb-member-logo-white.png', "visit FSB's website", 'logo-fsb', 2048, 1152]
        ];
        footerLogos.forEach(([href, src, alt, className, width, height]) => {
            const link = document.createElement('a');
            link.href = href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            const logo = document.createElement('img');
            logo.src = src;
            logo.alt = alt;
            logo.className = className;
            logo.width = width;
            logo.height = height;
            link.appendChild(logo);
            accreditations.appendChild(link);
        });
        footerGrid.appendChild(accreditations);
    }
    const form = document.querySelector('form:not([data-resource-request])');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const data = new FormData(form);
            const subject = encodeURIComponent('Website enquiry: ' + data.get('type'));
            const message = encodeURIComponent('Name: ' + data.get('name') + '\nOrganisation: ' + data.get('org') + '\nDeadline / launch: ' + data.get('deadline') + '\n\nHigh-level description:\n' + data.get('message'));
            const status = document.querySelector('.status');
            if (status) status.textContent = 'Your email application will open. Sending an email does not create an attorney-client relationship.';
            window.location.href = 'mailto:info@ridanip.com?subject=' + subject + '&body=' + message;
        });
        const fields = form.querySelector('.enquiry-fields');
        if (fields) fields.disabled = false;
    }
})();
