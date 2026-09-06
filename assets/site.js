(() => {
    const menuButton = document.querySelector('.menu');
    const navigation = document.querySelector('header nav');

    if (navigation) {
        const servicesLink = Array.from(navigation.children).find((item) =>
            item.matches('a') && item.textContent.trim().toLowerCase() === 'services'
        );

        if (servicesLink) {
            const servicesUrl = new URL(servicesLink.getAttribute('href'), window.location.href);
            const dropdown = document.createElement('div');
            dropdown.className = 'nav-dropdown';

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'nav-dropdown-toggle';
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = 'Services <span class="nav-chevron" aria-hidden="true">˅</span>';

            if (servicesLink.hasAttribute('aria-current')) {
                toggle.setAttribute('aria-current', 'page');
            }

            const dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'dropdown-menu';

            const serviceItems = [
                ['Overview', ''],
                ['Patents', 'patents/'],
                ['Registered Designs', 'registered-designs/'],
                ['Trade Secrets', 'trade-secrets/'],
                ['IP Strategy & Opinions', 'ip-strategy-opinions/'],
                ['Fractional In-House Support', 'fractional-in-house-support/'],
                ['IP Audit', 'ip-audit/']
            ];

            const currentPath = window.location.pathname.replace(/\/+$/, '') + '/';

            serviceItems.forEach(([label, path]) => {
                const link = document.createElement('a');
                const itemUrl = new URL(path, servicesUrl);
                const itemPath = itemUrl.pathname.replace(/\/+$/, '') + '/';
                link.href = itemUrl.href;
                link.textContent = label;

                if (currentPath === itemPath) {
                    link.setAttribute('aria-current', 'page');
                }

                dropdownMenu.appendChild(link);
            });

            toggle.addEventListener('click', () => {
                const isOpen = dropdown.classList.toggle('open');
                toggle.setAttribute('aria-expanded', String(isOpen));
            });

            document.addEventListener('click', (event) => {
                if (!dropdown.contains(event.target)) {
                    dropdown.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });

            dropdown.append(toggle, dropdownMenu);
            servicesLink.replaceWith(dropdown);
        }
    }

    if (menuButton && navigation) {
        menuButton.addEventListener('click', () => {
            const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
            menuButton.setAttribute('aria-expanded', String(!isOpen));
            navigation.classList.toggle('open', !isOpen);
        });
    }

    const header = document.querySelector('header');

    if (header) {
        const updateHeader = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 24);
        };

        updateHeader();
        window.addEventListener('scroll', updateHeader, { passive: true });
    }

    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const data = new FormData(form);

            const subject = encodeURIComponent(
                'Website enquiry: ' + data.get('type')
            );

            const message = encodeURIComponent(
                'Name: ' + data.get('name') +
                '\nOrganisation: ' + data.get('org') +
                '\nDeadline / launch: ' + data.get('deadline') +
                '\n\nHigh-level description:\n' + data.get('message')
            );

            const status = document.querySelector('.status');

            if (status) {
                status.textContent =
                    'Your email application will open. Sending an email does not create an attorney-client relationship.';
            }

            window.location.href =
                'mailto:info@ridanip.com?subject=' +
                subject +
                '&body=' +
                message;
        });
    }
})();