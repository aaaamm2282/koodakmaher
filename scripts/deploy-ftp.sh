#!/usr/bin/env bash
# Uploads the built site (dist/) to a shared host (cPanel, DirectAdmin…) over FTPS, SFTP or FTP, with lftp.
# Used by .github/workflows/deploy.yml. Also works by hand on Linux, macOS or WSL with lftp installed:
#
#   npm run build
#   FTP_HOST=ftp.example.ir FTP_USER=deploy@example.ir LFTP_PASSWORD='…' scripts/deploy-ftp.sh
#
# Settings, as environment variables:
#   FTP_HOST                the host's FTP address (cPanel: FTP Accounts → Configure FTP Client)
#   FTP_USER                the FTP account
#   LFTP_PASSWORD           its password; read from the environment, never put on a command line
#   FTP_PROTOCOL            ftps (default: FTP with TLS) | sftp | ftp (unencrypted: only if the host has nothing else)
#   FTP_PORT                only when the host uses a port of its own
#   FTP_DIR                 the site's folder on the host (default public_html; «.» when the account opens in it)
#   FTP_VERIFY_CERTIFICATE  no = accept a TLS certificate that does not match FTP_HOST (some shared hosts)
#   SFTP_KNOWN_HOSTS        sftp: the host's key line(s) from `ssh-keyscan host`; without it the key is accepted unseen
#   FTP_DELETE              true = also remove files on the host that are no longer part of the site (a deleted
#                           article or page). The host's own files (KEEP below) are never touched.
#
# The order keeps the live site whole while it uploads:
#   1. new files in _astro/ (their names carry a content hash, so the old ones stay for pages already open)
#   2. everything else: pages, images, .htaccess …; each file is written under a temporary name and then
#      renamed, so a visitor never gets half a page
#   3. files in _astro/ that no page uses any more
# Guide: docs/deploy.md
set -euo pipefail

cd "$(dirname "$0")/.."
DIST=dist
PROTOCOL="${FTP_PROTOCOL:-ftps}"
REMOTE="${FTP_DIR:-public_html}"
REMOTE="${REMOTE%/}"
[ -n "$REMOTE" ] || REMOTE=.

fail() { echo "✗ $*" >&2; exit 1; }

[ -n "${FTP_HOST:-}" ] || fail "FTP_HOST خالی است (نشانی FTP هاست)."
[ -n "${FTP_USER:-}" ] || fail "FTP_USER خالی است (نام کاربری FTP)."
[ -n "${LFTP_PASSWORD:-}" ] || fail "LFTP_PASSWORD خالی است (رمز FTP)."
command -v lftp >/dev/null || fail "lftp نصب نیست (Ubuntu: sudo apt-get install lftp، macOS: brew install lftp)."

# The build must be a normal one: complete, and not a review copy (those are noindex everywhere)
[ -f "$DIST/index.html" ] && [ -f "$DIST/404.html" ] || fail "dist/ کامل نیست: اول npm run build را اجرا کنید."
if grep -Eq '<meta name="robots" content="[^"]*noindex' "$DIST/index.html"; then
  fail "این نسخه برای بازبینی ساخته شده (SHOW_DRAFTS یا PREVIEW_PHOTOS) و همه صفحه‌هایش noindex است؛ بدون آن‌ها دوباره بسازید."
fi
[ -f "$DIST/.htaccess" ] || echo "! dist/.htaccess نیست؛ ریدایرکت‌ها و صفحه ۴۰۴ روی هاست Apache کار نمی‌کنند." >&2

# What the host keeps in the site folder by itself, never deleted (lftp regexes on paths relative to FTP_DIR)
KEEP=(
  '^\.well-known/'   # SSL certificate checks (AutoSSL, Let's Encrypt)
  '^cgi-bin/'
  '^\.user\.ini$' '^php\.ini$' '^error_log$' '^\.ftpquota$'
)
keep_args=""
for k in "${KEEP[@]}"; do keep_args+=" --exclude '$k'"; done
delete_args=""
if [ "${FTP_DELETE:-}" = "true" ]; then delete_args="--delete$keep_args"; fi

case "$PROTOCOL" in
  ftps)
    url="ftp://$FTP_HOST"
    connection="set ftp:ssl-force true; set ftp:ssl-protect-data true; set ftp:ssl-protect-list true"
    ;;
  ftp)
    url="ftp://$FTP_HOST"
    connection="set ftp:ssl-allow false"
    echo "! FTP بدون رمزنگاری: رمز و فایل‌ها خوانا از اینترنت می‌گذرند. اگر هاست FTPS یا SFTP دارد، از آن استفاده کنید." >&2
    ;;
  sftp)
    url="sftp://$FTP_HOST"
    if [ -n "${SFTP_KNOWN_HOSTS:-}" ]; then
      mkdir -p ~/.ssh && chmod 700 ~/.ssh
      printf '%s\n' "$SFTP_KNOWN_HOSTS" >> ~/.ssh/known_hosts
      connection="set sftp:connect-program 'ssh -a -x -o StrictHostKeyChecking=yes'"
    else
      connection="set sftp:auto-confirm yes"
      echo "! کلید SSH هاست بررسی نمی‌شود؛ برای امنیت بیشتر SFTP_KNOWN_HOSTS را بدهید (docs/deploy.md)." >&2
    fi
    ;;
  *) fail "FTP_PROTOCOL باید ftps، sftp یا ftp باشد، نه «$PROTOCOL»." ;;
esac
port_arg=""
if [ -n "${FTP_PORT:-}" ]; then port_arg="-p $FTP_PORT"; fi
verify=yes
if [ "${FTP_VERIFY_CERTIFICATE:-yes}" = "no" ]; then verify=no; fi

mirror="mirror --reverse --no-perms --parallel=4 --verbose=1"
echo "→ بارگذاری dist/ در $REMOTE روی $FTP_HOST ($PROTOCOL)$([ -n "$delete_args" ] && echo '، با حذف فایل‌های اضافه')"

lftp --norc -c "
set cmd:fail-exit yes
set net:max-retries 5
set net:reconnect-interval-base 5
set net:timeout 30
set ssl:verify-certificate $verify
set xfer:use-temp-file yes
set xfer:temp-file-name .in.*
$connection
open --env-password -u \"$FTP_USER\" $port_arg $url
mkdir -pf \"$REMOTE/_astro\"
$mirror $DIST/_astro \"$REMOTE/_astro\"
$mirror --exclude '^_astro/' $delete_args $DIST \"$REMOTE\"
$mirror --delete $DIST/_astro \"$REMOTE/_astro\"
"
echo "✓ بارگذاری کامل شد. بررسی: npm run migrate:check -- \$SITE_URL"
