<?php
/**
 * Settings for the form handler (server/form-handler.php, published by the build at PUBLIC_FORM_ENDPOINT,
 * for example public_html/api/form.php). Copy this file OUTSIDE the web root, to the folder that holds
 * public_html, as form-config.php, and fill it in there. The handler looks for it in the folders above
 * itself that are outside the web root; or point the KM_FORM_CONFIG environment variable at it.
 * Never commit the filled-in copy: it holds the bot token. Guide: docs/forms-setup.md
 */
return [
    // The site's own addresses, exactly: https, no slash at the end. Forms from anywhere else are refused.
    'allowed_origins' => ['https://mahermana.com', 'https://www.mahermana.com'],

    // Where forms and résumés are kept: a folder OUTSIDE public_html (the handler refuses one inside it).
    'storage_dir' => '/home/USERNAME/form-data',

    // Any long random text; it only scrambles visitors' internet addresses for the rate limit.
    'salt' => 'CHANGE-ME-to-a-long-random-text',

    // Clock for the saved forms and messages (the Persian-calendar date needs PHP's intl extension).
    'timezone' => 'Asia/Tehran',

    // Spam: a form filled in faster than this many seconds is dropped quietly.
    'min_seconds' => 3,

    // At most this many kept forms from one internet address in this many seconds. Keep it generous:
    // mobile operators put many phones behind one address.
    'rate_limit' => ['max' => 20, 'seconds' => 600],

    // Résumé size limit (careers form), in megabytes. Change maxMb in src/pages/careers/index.astro with it.
    'max_upload_mb' => 5,

    // Optional: a message for every new form, in Bale. Make a bot with @botfather in Bale; the person who
    // should get the forms sends the bot a message; https://tapi.bale.ai/bot<token>/getUpdates then shows
    // the chat id ("chat":{"id":…}). The message holds the parent's name and phone: only staff responsible.
    'messenger' => [
        'api' => 'https://tapi.bale.ai',
        'token' => '',
        'chat_id' => '',
    ],

    // Optional: an email for every new form (needs mail() working on the host). Use a "from" address on the
    // site's own domain, like form@mahermana.com, so it does not land in spam.
    'email' => [
        'to' => '',
        'from' => '',
    ],
];
