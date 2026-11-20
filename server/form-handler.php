<?php
/**
 * Receives the site's forms (pre-registration, contact, careers, «خبرم کنید») on a host with PHP 7.4+.
 *
 * Build the site with PUBLIC_FORM_ENDPOINT=/api/form.php and the build puts this file at that address
 * (src/integrations/server-files.mjs), so every upload of dist carries it. Step by step: docs/forms-setup.md.
 *
 * Everything private (where the data is kept, the messenger bot token, the email address) lives in a
 * config file outside the web root, never in this file or in the repository. Copy
 * server/form-config.example.php to the folder above public_html as form-config.php and fill it in
 * (it is looked for in the folders above this file, outside the web root), or point the KM_FORM_CONFIG
 * environment variable at it.
 *
 * For each form it:
 *   - accepts only POST from the site's own address (allowed_origins)
 *   - drops spam without a CAPTCHA: the hidden «website» field filled in, or the form sent faster than
 *     a person can (elapsed_ms); the sender still sees «sent», so a bot learns nothing
 *   - limits how many forms are kept from one internet address in a while
 *   - checks the fields again (the browser check can be skipped) and the résumé file (type and size)
 *   - appends a row to a CSV file per form, outside the web root (Tehran time and the Persian-calendar
 *     date; phone numbers keep their leading zero in Excel), then tells the institute by
 *     messenger bot (Bale) and/or email if they are set up. A failed notice never loses a form:
 *     the CSV row is written first.
 *   - answers JSON to the site's script, or a short page when the browser sent the form without JavaScript
 */

declare(strict_types=1);

// Field: [label, required, most characters, 'phone'?]. Keep each limit at or above the form's maxlength
// (src/components/Field.astro: text 100, tel 20, email 120, textarea 1500, unless the page sets one).
const FORMS = [
    'register' => ['label' => 'پیش‌ثبت‌نام', 'done' => 'درخواست پیش‌ثبت‌نام شما رسید. همکاران ما برای هماهنگی جلسه مشاوره و بازدید با شما تماس می‌گیرند.', 'fields' => [
        'parent' => ['نام والد', true, 100], 'phone' => ['تلفن', true, 20, 'phone'], 'child' => ['نام کودک', false, 100],
        'age' => ['سن یا پایه', true, 60], 'unit' => ['واحد', true, 60], 'call_time' => ['زمان مناسب تماس', true, 100],
        'source' => ['آشنایی از', true, 100], 'note' => ['پرسش یا توضیح', false, 2000], 'consent' => ['رضایت', true, 10],
    ]],
    'contact' => ['label' => 'تماس', 'done' => 'پیام شما رسید. پاسخ را از همان راهی که نوشتید، تلفن یا ایمیل، می‌گیرید.', 'fields' => [
        'name' => ['نام', true, 100], 'contact' => ['تلفن یا ایمیل', true, 120], 'unit' => ['واحد', true, 60],
        'message' => ['پیام', true, 3000],
    ]],
    'careers' => ['label' => 'همکاری', 'done' => 'درخواست همکاری شما رسید. همکاران ما رزومه شما را می‌خوانند و اگر موقعیت مناسبی باشد، با شما تماس می‌گیرند.', 'fields' => [
        'name' => ['نام', true, 100], 'phone' => ['تلفن', true, 20, 'phone'], 'position' => ['موقعیت', true, 150],
        'background' => ['تحصیلات و سابقه', true, 3000], 'why' => ['چرا کودک ماهر؟', true, 1500],
    ], 'file' => ['resume', 'رزومه', true]],
    'notify' => ['label' => 'خبرم کنید (متوسطه دوم)', 'done' => 'ثبت شد. وقتی ثبت‌نام متوسطه دوم شروع شود، به شما خبر می‌دهیم.', 'fields' => [
        'parent' => ['نام والد', true, 100], 'phone' => ['تلفن', true, 20, 'phone'], 'grade' => ['پایه فعلی', true, 30],
    ]],
];
const META = [
    'page' => 'صفحه فرم', 'landing' => 'اولین صفحه بازدید', 'referrer' => 'آمده از', 'utm_source' => 'utm_source',
    'utm_medium' => 'utm_medium', 'utm_campaign' => 'utm_campaign', 'utm_content' => 'utm_content', 'utm_term' => 'utm_term',
];
const RESUME_TYPES = [
    'pdf' => ['application/pdf'],
    'doc' => ['application/msword', 'application/octet-stream', 'application/x-ole-storage', 'application/CDFV2'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
];

/* ---------- config ---------- */
/** KM_FORM_CONFIG, or the nearest form-config.php in the folders above this file that are outside the web root. */
function find_config(): ?string
{
    $env = getenv('KM_FORM_CONFIG');
    if (is_string($env) && $env !== '') return $env;
    $docRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: null;
    $dir = __DIR__;
    for ($i = 0; $i < 4 && $dir !== dirname($dir); $i++, $dir = dirname($dir)) {
        if ($docRoot !== null && strpos($dir . '/', $docRoot . '/') === 0) continue;
        if (@is_file("$dir/form-config.php")) return "$dir/form-config.php";
    }
    return null;
}
$configFile = find_config();
$config = $configFile !== null && is_file($configFile) ? require $configFile : null;
$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
$doneText = 'فرم شما رسید. همکاران ما با شما تماس می‌گیرند.';

/** The answer: JSON for the site's script, a small page otherwise (the form was sent without JavaScript). */
function reply(int $status, bool $ok, string $message = ''): void
{
    global $wantsJson, $doneText;
    http_response_code($status);
    header('Cache-Control: no-store');
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    header('X-Robots-Tag: noindex');
    $e = function (string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); };
    if ($ok) {
        $body = '<h1>' . $e($doneText) . '</h1><p><a href="/">بازگشت به سایت</a></p>';
    } else {
        // Back to the form page when it is on this site; the browser's back button usually keeps what was typed.
        $back = same_site_referer() ?? '/';
        $body = '<h1>فرم فرستاده نشد</h1><p>' . $e($message) . '</p>'
            . '<p>با دکمه بازگشت مرورگر به فرم برگردید؛ معمولاً نوشته‌هایتان سر جایش است.</p>'
            . '<p><a href="' . $e($back) . '">بازگشت به فرم</a> · <a href="/contact/">تماس با مراکز</a></p>';
    }
    echo '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>کودک ماهر مانا</title><style>'
        . 'body{font-family:Vazirmatn,Tahoma,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1rem;line-height:2;color:#17201c;background:#fbf9f5}'
        . 'h1{font-size:1.25rem;line-height:1.8}a{color:#01237a}</style></head><body>' . $body . '</body></html>';
    exit;
}

/** The path of the page that sent the form, when the browser says it was a page of this site. */
function same_site_referer(): ?string
{
    $ref = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    if ($ref === '') return null;
    $port = parse_url($ref, PHP_URL_PORT);
    $host = (string) parse_url($ref, PHP_URL_HOST) . ($port ? ":$port" : '');
    if (strcasecmp($host, (string) ($_SERVER['HTTP_HOST'] ?? '')) !== 0) return null;
    $path = (string) parse_url($ref, PHP_URL_PATH);
    $query = (string) parse_url($ref, PHP_URL_QUERY);
    return ($path ?: '/') . ($query !== '' ? "?$query" : '');
}

/** A number in Persian digits, for messages. */
function fa_num($n): string
{
    return strtr((string) $n, ['0' => '۰', '1' => '۱', '2' => '۲', '3' => '۳', '4' => '۴', '5' => '۵', '6' => '۶', '7' => '۷', '8' => '۸', '9' => '۹', '.' => '٫']);
}

function fail_quietly(string $why): void
{
    error_log("form-handler: $why");
    reply(500, false, 'ارسال انجام نشد. لطفاً چند دقیقه بعد دوباره بفرستید.');
}

/** The time in the Persian calendar, or '' when the host's PHP has no intl extension. */
function jalali(int $time, bool $persianDigits): string
{
    if (!class_exists('IntlDateFormatter')) return '';
    $f = new IntlDateFormatter(($persianDigits ? 'fa_IR' : 'en_US') . '@calendar=persian', IntlDateFormatter::NONE, IntlDateFormatter::NONE,
        date_default_timezone_get(), IntlDateFormatter::TRADITIONAL, 'yyyy/MM/dd HH:mm');
    return (string) $f->format($time);
}

if (!is_array($config)) fail_quietly($configFile === null
    ? 'form-config.php not found: put it in the folder above the web root, or set KM_FORM_CONFIG'
    : "form-config.php at $configFile does not return the settings array");

$tz = (string) ($config['timezone'] ?? 'Asia/Tehran');
date_default_timezone_set(in_array($tz, timezone_identifiers_list(), true) ? $tz : 'Asia/Tehran');

/* ---------- request ---------- */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = $config['allowed_origins'] ?? [];
if ($origin !== '' && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(405, false, 'این نشانی فقط فرم‌های سایت را می‌پذیرد.');
if ($origin !== '' && !in_array($origin, $allowed, true)) reply(403, false, 'این فرم از نشانی دیگری فرستاده شده است.');

// A body larger than PHP's post_max_size arrives empty: say so instead of «فرم شناخته نشد».
if ($_POST === [] && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    reply(413, false, 'حجم فرم بیش از اندازه است؛ اگر فایلی گذاشته‌اید، فایل کوچک‌تری (حداکثر ' . fa_num($config['max_upload_mb'] ?? 5) . ' مگابایت) بفرستید.');
}

$kind = (string) ($_POST['form'] ?? '');
if (!isset(FORMS[$kind])) reply(400, false, 'فرم شناخته نشد.');
$form = FORMS[$kind];
$doneText = $form['done'];

/* ---------- spam ---------- */
// Filled-in hidden field, or sent faster than a person can: say «sent», keep nothing.
$elapsed = isset($_POST['elapsed_ms']) && $_POST['elapsed_ms'] !== '' ? (int) $_POST['elapsed_ms'] : null;
if (trim((string) ($_POST['website'] ?? '')) !== '') reply(200, true);
if ($elapsed !== null && $elapsed < (int) (($config['min_seconds'] ?? 3) * 1000)) reply(200, true);

/* ---------- storage ---------- */
$dir = rtrim((string) ($config['storage_dir'] ?? ''), '/');
if ($dir === '') fail_quietly('storage_dir is not set');
if (!is_dir($dir) && !mkdir($dir, 0750, true)) fail_quietly("cannot create $dir");
$docRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: null;
if ($docRoot !== null && strpos(realpath($dir) . '/', $docRoot . '/') === 0) fail_quietly('storage_dir is inside the web root; move it out');

/* ---------- rate limit: forms kept from one address in a while ----------
 * Mobile operators put many phones behind one address, so the limit is generous and counts only forms
 * that were kept; a parent fixing a typo does not use it up. */
$limit = $config['rate_limit'] ?? ['max' => 20, 'seconds' => 600];
$ipKey = hash('sha256', ($config['salt'] ?? '') . ($_SERVER['REMOTE_ADDR'] ?? ''));
$rateFile = "$dir/.rate-" . substr($ipKey, 0, 32);
$now = time();
$hits = is_file($rateFile) ? array_values(array_filter(array_map('intval', explode(',', (string) file_get_contents($rateFile))), function ($t) use ($now, $limit) { return $t > $now - (int) $limit['seconds']; })) : [];
if (count($hits) >= (int) $limit['max']) reply(429, false, 'از این نشانی اینترنت چند فرم پشت سر هم رسیده است. لطفاً چند دقیقه بعد دوباره بفرستید.');

/* ---------- fields ---------- */
$digits = ['۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
    '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9'];
$values = [];
foreach ($form['fields'] as $name => $spec) {
    [$label, $required, $max] = $spec;
    $value = trim(str_replace("\0", '', (string) ($_POST[$name] ?? '')));
    if (($spec[3] ?? '') === 'phone') {
        $value = strtr($value, $digits);
        if ($value !== '' && !preg_match('/^\+?[0-9][0-9 \-]{6,18}$/', $value)) reply(422, false, "«{$label}» درست نیست؛ فقط رقم بنویسید.");
    }
    if ($required && $value === '') reply(422, false, "«{$label}» خالی است.");
    if (mb_strlen($value) > $max) reply(422, false, "«{$label}» بیش از اندازه بلند است.");
    $values[$name] = $value;
}
$meta = [];
foreach (META as $name => $label) $meta[$name] = mb_substr(trim((string) ($_POST[$name] ?? '')), 0, 200);
// Sent without JavaScript: the browser still says which page of the site the form was on.
if ($meta['page'] === '') $meta['page'] = mb_substr(same_site_referer() ?? '', 0, 200);
$meta['elapsed'] = $elapsed === null ? 'بدون جاوااسکریپت' : (string) round($elapsed / 1000);

/* ---------- résumé ---------- */
$fileName = '';
if (isset($form['file'])) {
    [$field, $label, $required] = $form['file'];
    $upload = $_FILES[$field] ?? null;
    $maxBytes = (int) (($config['max_upload_mb'] ?? 5) * 1024 * 1024);
    if (!$upload || $upload['error'] === UPLOAD_ERR_NO_FILE) {
        if ($required) reply(422, false, "«{$label}» را بارگذاری کنید.");
    } else {
        if ($upload['error'] !== UPLOAD_ERR_OK || $upload['size'] > $maxBytes) reply(422, false, "حجم «{$label}» بیش از " . fa_num($config['max_upload_mb'] ?? 5) . ' مگابایت است یا فایل کامل نرسید.');
        $ext = strtolower(pathinfo((string) $upload['name'], PATHINFO_EXTENSION));
        $mime = function_exists('finfo_open') ? (string) finfo_file(finfo_open(FILEINFO_MIME_TYPE), $upload['tmp_name']) : '';
        if (!isset(RESUME_TYPES[$ext]) || ($mime !== '' && !in_array($mime, RESUME_TYPES[$ext], true))) reply(422, false, "«{$label}» باید PDF یا Word باشد.");
        if (!is_dir("$dir/uploads") && !mkdir("$dir/uploads", 0750, true)) fail_quietly('cannot create uploads');
        $fileName = date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . ".$ext";
        if (!move_uploaded_file($upload['tmp_name'], "$dir/uploads/$fileName")) fail_quietly('cannot store the résumé');
        chmod("$dir/uploads/$fileName", 0640);
    }
}

/* ---------- save: one CSV per form, opens in Excel (UTF-8 with BOM) ---------- */
/** A cell that starts like a formula is kept as text, so opening the file in Excel runs nothing. */
function cell(string $v): string
{
    return preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v;
}
/** A phone number as ="0912…", so Excel keeps its leading zero; safe because the value is only digits, spaces, dashes and +. */
function phone_cell(string $v): string
{
    return preg_match('/^\+?[0-9][0-9 \-]{6,18}$/', $v) ? '="' . $v . '"' : cell($v);
}
$csv = "$dir/$kind.csv";
$header = array_merge(['زمان', 'تاریخ شمسی'], array_map(function ($s) { return $s[0]; }, $form['fields']), isset($form['file']) ? [$form['file'][1]] : [], array_values(META), ['زمان پر کردن (ثانیه)']);
$cells = [];
foreach ($form['fields'] as $name => $spec) {
    // The contact form's «تلفن یا ایمیل» is often a phone number too.
    $cells[] = ($spec[3] ?? '') === 'phone' || $name === 'contact' ? phone_cell($values[$name]) : cell($values[$name]);
}
$row = array_merge([date('Y-m-d H:i:s', $now), jalali($now, false)], $cells, isset($form['file']) ? [cell($fileName)] : [],
    array_map('cell', array_values(array_slice($meta, 0, count(META)))), [cell($meta['elapsed'])]);
$fh = fopen($csv, 'ab');
if ($fh === false || !flock($fh, LOCK_EX)) fail_quietly("cannot write $csv");
if ((fstat($fh)['size'] ?? 0) === 0) {
    fwrite($fh, "\xEF\xBB\xBF");
    fputcsv($fh, $header);
}
fputcsv($fh, $row);
flock($fh, LOCK_UN);
fclose($fh);
@chmod($csv, 0640);
$hits[] = $now;
file_put_contents($rateFile, implode(',', $hits), LOCK_EX);
@chmod($rateFile, 0640);

/* ---------- tell the institute ---------- */
$when = jalali($now, true);
$lines = ["فرم تازه: {$form['label']}", ...($when !== '' ? ["زمان: $when"] : []), ''];
foreach ($form['fields'] as $name => $spec) if ($values[$name] !== '' && $name !== 'consent') $lines[] = "{$spec[0]}: " . mb_substr($values[$name], 0, 500);
if ($fileName !== '') $lines[] = "{$form['file'][1]}: $fileName";
$lines[] = '';
foreach (['page', 'landing', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign'] as $k) if ($meta[$k] !== '') $lines[] = META[$k] . ': ' . $meta[$k];
$text = implode("\n", $lines);

/** POST JSON; the HTTP status, or 0 when the host could not connect. curl first: many shared hosts turn off allow_url_fopen. */
function post_json(string $url, string $json): int
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true, CURLOPT_POSTFIELDS => $json, CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 8,
        ]);
        return curl_exec($ch) === false ? 0 : (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    }
    if (!filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) return 0;
    $context = stream_context_create(['http' => [
        'method' => 'POST', 'timeout' => 8, 'ignore_errors' => true,
        'header' => "Content-Type: application/json\r\n", 'content' => $json,
    ]]);
    if (@file_get_contents($url, false, $context) === false) return 0;
    // PHP 8.4+ has a function for the answer's headers; the older variable is on its way out.
    $headers = function_exists('http_get_last_response_headers') ? (http_get_last_response_headers() ?? []) : ($http_response_header ?? []);
    return preg_match('#^HTTP/\S+\s+(\d{3})#', $headers[0] ?? '', $m) ? (int) $m[1] : 0;
}

$bot = $config['messenger'] ?? null;
if (is_array($bot) && !empty($bot['token']) && !empty($bot['chat_id'])) {
    $url = rtrim((string) ($bot['api'] ?? 'https://tapi.bale.ai'), '/') . '/bot' . $bot['token'] . '/sendMessage';
    $status = post_json($url, (string) json_encode(['chat_id' => $bot['chat_id'], 'text' => $text], JSON_UNESCAPED_UNICODE));
    // 401 or 404: wrong token; 400 or 403: wrong chat_id or the bot is not in that chat; 0: the host cannot reach the messenger.
    if ($status < 200 || $status > 299) error_log("form-handler: messenger notice failed with status $status (the form is saved in the CSV)");
}
$mail = $config['email'] ?? null;
if (is_array($mail) && !empty($mail['to'])) {
    $subject = '=?UTF-8?B?' . base64_encode("فرم تازه: {$form['label']}") . '?=';
    $headers = "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n"
        . (!empty($mail['from']) ? "From: {$mail['from']}\r\n" : '');
    if (!@mail((string) $mail['to'], $subject, $text, $headers)) error_log('form-handler: email notice failed (the form is saved in the CSV)');
}

reply(200, true);
