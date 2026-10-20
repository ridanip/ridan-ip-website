/* Prepare an email locally. No submission endpoint, tracking or browser storage. */
(() => {
    'use strict';
    const form = document.querySelector('form[data-resource-request]');
    if (!form) return;
    const fields = form.querySelector('.enquiry-fields');
    const status = document.getElementById('request-status');
    const panel = document.getElementById('request-draft');
    const preview = document.getElementById('request-preview');
    const open = document.getElementById('request-open');
    const copy = document.getElementById('request-copy');
    if (!fields || !status || !panel || !preview || !open || !copy) return;
    const draftHeading = panel.querySelector('h3');

    const recipient = 'info@ridanip.com';
    const subject = 'Investment IP Readiness Checklist request';
    const consentText = 'Yes, email me occasional RIDAN IP articles and information about IP audits, portfolio reviews and related services. I can unsubscribe at any time.';
    const noticeVersion = '20 October 2026 / resource request v1';
    const shortValue = name => form.elements.namedItem(name).value.trim().replace(/[\r\n]+/g, ' ');

    form.addEventListener('submit', event => {
        event.preventDefault();
        ['name', 'org', 'email'].forEach(name => {
            const field = form.elements.namedItem(name);
            field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.');
        });
        if (!form.reportValidity()) return;
        const body = [
            'Please consider my request for the Investment IP Readiness Checklist.',
            '',
            'Name: ' + shortValue('name'),
            'Organisation or planned business: ' + shortValue('org'),
            'Preferred reply address: ' + shortValue('email'),
            '',
            'Website or business context: ' + (form.elements.namedItem('context').value.trim() || 'Not provided'),
            '',
            'Optional email updates: ' + (form.elements.namedItem('updates').checked ? 'YES' : 'NO'),
            'Choice wording: ' + consentText,
            'Privacy / wording version: ' + noticeVersion,
            'Privacy notice: https://www.ridanip.com/privacy/#resource-requests',
            '',
            'I understand that access is subject to review and approval.'
        ].join('\n');
        preview.value = 'To: ' + recipient + '\nSubject: ' + subject + '\n\n' + body;
        panel.hidden = false;
        const mailto = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        // Long mailto URLs are unreliable in some email applications. Keep the full
        // draft available for copying rather than silently dropping any content.
        if (mailto.length > 1800) {
            open.hidden = true;
            open.href = 'mailto:' + recipient;
            status.textContent = 'Your draft is ready. Please copy the request into your email service and send it to info@ridanip.com. Nothing has been submitted through the website.';
        } else {
            open.hidden = false;
            open.href = mailto;
            status.textContent = 'Your draft is ready. Choose an option below to send it. Nothing has been submitted through the website.';
        }
        // Bring the next step into view and move keyboard/screen-reader focus
        // with it. The form remains available above if details need changing.
        if (draftHeading) {
            draftHeading.tabIndex = -1;
            draftHeading.focus({preventScroll: true});
        }
        status.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
        });
    });

    copy.addEventListener('click', async () => {
        if (!preview.value) return;
        try {
            if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(preview.value);
            status.textContent = 'Request copied. Paste it into your email service and send it to info@ridanip.com. Copying the text has not sent the request.';
        } catch (_) {
            preview.focus();
            preview.select();
            status.textContent = 'Please copy the selected request text, paste it into your email service and send it to info@ridanip.com. Nothing has been sent by this page.';
        }
    });

    // Invalidate a prepared draft when fields or marketing preferences change.
    form.addEventListener('input', event => {
        if (event.target && typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
        if (event.target === preview || panel.hidden) return;
        panel.hidden = true;
        preview.value = '';
        open.href = 'mailto:' + recipient;
        status.textContent = 'Your details have changed. Prepare a new email request before sending.';
    });
    fields.disabled = false;
})();
