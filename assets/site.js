(() => {
    const menuButton = document.querySelector('.menu');
    const navigation = document.querySelector('header nav');

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