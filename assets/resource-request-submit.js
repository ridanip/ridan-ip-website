/* Submit only on request. No tracking, external scripts or browser storage. */
(() => {
    'use strict';
    const form = document.querySelector('form[data-resource-request]');
    if (!form) return;
    const fields = form.querySelector('.enquiry-fields');
    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById('request-status');
    const receipt = document.getElementById('request-receipt');
    const heading = document.getElementById('request-receipt-heading');
    if (!fields || !button || !status || !receipt || !heading) return;

    const endpoint = form.getAttribute('action') || '';
    // The public form ID is configured at release time. Never pretend that an
    // unconnected form has received a request or send data to another host.
    if (!/^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(endpoint)) {
        status.textContent = 'Please email info@ridanip.com to request the checklist. The online request form is temporarily unavailable.';
        return;
    }
    const consentText = 'Yes, email me occasional RIDAN IP articles and information about IP audits, portfolio reviews and related services. I can unsubscribe at any time.';
    const singleLine = name => form.elements.namedItem(name).value.trim().replace(/[\r\n]+/g, ' ');
    const reveal = element => element.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
    });
    let sending = false;
    let received = false;

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (sending || received) return;
        ['name', 'org', 'email'].forEach(name => {
            const field = form.elements.namedItem(name);
            field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.');
        });
        if (!form.reportValidity()) return;

        const data = new FormData();
        Object.entries({
            subject: 'Investment IP Readiness Checklist request',
            name: singleLine('name'),
            email: singleLine('email'),
            company: singleLine('org'),
            message: form.elements.namedItem('context').value.trim() || 'Not provided',
            resource: 'Investment IP Readiness Checklist',
            email_updates: form.elements.namedItem('updates').checked ? 'YES' : 'NO',
            choice_wording: consentText,
            privacy_wording_version: '20 October 2026 / resource request v2',
            privacy_notice: 'https://www.ridanip.com/privacy/#resource-requests',
            access_review: 'Access is subject to review and approval.'
        }).forEach(([key, value]) => data.append(key, value));

        sending = true;
        fields.disabled = true;
        button.textContent = 'Sending request…';
        form.setAttribute('aria-busy', 'true');
        status.textContent = 'Sending your request…';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: data,
                headers: {Accept: 'application/json'},
                credentials: 'omit',
                redirect: 'error',
                signal: controller.signal
            });
            if (!response.ok) {
                const failure = new Error('Request not accepted');
                failure.rateLimited = response.status === 429;
                throw failure;
            }
            // A redirect/login/CAPTCHA page is not a receipt. Confirm a JSON
            // acknowledgement before replacing the form with the receipt.
            const result = await response.json();
            if (!result || typeof result !== 'object' || Array.isArray(result) ||
                result.ok !== true || result.error ||
                (Array.isArray(result.errors) && result.errors.length)) {
                throw new Error('No acknowledgement');
            }
            received = true;
            status.textContent = '';
            form.hidden = true;
            receipt.hidden = false;
            heading.focus({preventScroll: true});
            reveal(receipt);
        } catch (error) {
            fields.disabled = false;
            button.textContent = 'Request the checklist';
            status.textContent = error && error.rateLimited
                ? 'Requests cannot be submitted just now. Please try again later, or email info@ridanip.com using the link below.'
                : 'We could not confirm receipt of your request. Your details are still here. Please try again, or email info@ridanip.com using the link below.';
            status.focus({preventScroll: true});
            reveal(status);
        } finally {
            clearTimeout(timeout);
            sending = false;
            form.removeAttribute('aria-busy');
        }
    });

    form.addEventListener('input', event => {
        if (event.target && typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
        if (!sending) status.textContent = '';
    });
    fields.disabled = false;
})();
