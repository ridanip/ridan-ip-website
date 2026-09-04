(() => {
    const menuButton = document.querySelector('.menu');
    const navigation = document.querySelector('header nav');

    if (navigation && !navigation.querySelector('a[data-testimonials-link]')) {
        const contactLink = Array.from(navigation.querySelectorAll('a')).find((link) =>
            link.textContent.trim().toLowerCase() === 'contact'
        );

        if (contactLink) {
            const scriptUrl = new URL(document.currentScript.src);
            const testimonialsUrl = new URL('../testimonials/', scriptUrl);
            const testimonialsLink = document.createElement('a');

            testimonialsLink.href = testimonialsUrl.href;
            testimonialsLink.textContent = 'Testimonials';
            testimonialsLink.dataset.testimonialsLink = 'true';

            const currentPath = window.location.pathname.replace(/\/+$/, '') + '/';
            const testimonialsPath = testimonialsUrl.pathname.replace(/\/+$/, '') + '/';

            if (currentPath === testimonialsPath) {
                testimonialsLink.setAttribute('aria-current', 'page');
            }

            navigation.insertBefore(testimonialsLink, contactLink);
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
            const subject = encodeURIComponent('Website enquiry: ' + data.get('type'));
            const message = encodeURIComponent(
                'Name: ' + data.get('name') +
                '\nOrganisation: ' + data.get('org') +
                '\nDeadline / launch: ' + data.get('deadline') +
                '\n\nHigh-level description:\n' + data.get('message')
            );
            const status = document.querySelector('.status');

            if (status) {
                status.textContent = 'Your email application will open. Sending an email does not create an attorney-client relationship.';
            }

            window.location.href = 'mailto:info@ridanip.com?subject=' + subject + '&body=' + message;
        });
    }
})();
