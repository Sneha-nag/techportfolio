# Rootloop

iPhone-first habit tracker for Sneha’s household. Local accounts, custom habit lists, daily check-in, a reporting heatmap, and file-based sharing with family. Completely free. **No cloud database, no Firebase/AWS/Supabase, no paid backend.**

Published as a **sole proprietorship** of **Snehalatha Nagabhairava** (individual / sole proprietor — not an LLC). If it were listed on the App Store later, it would use that individual account.

## What it does

- Multiple **local user profiles** on one phone (name + PIN/password, SHA-256 hashed with a salt)
- Each profile owns **custom lists** and **habits**
- **Today** check-in (the daily reminder opens this screen for that date)
- **Report**: daily / weekly / monthly / yearly color views, streaks, completion rate, totals, and a **winner** among you and imported friends
- **Friends**: import a shared JSON snapshot or compact QR; compare locally
- **Backup**: export JSON via share sheet / download; import a file to restore
- Bottom **ad slot** uses AdMob **test** IDs as a labeled placeholder (no paid ad-network subscription)

All data stays on the device (SQLite on iPhone; the web preview uses an equivalent on-device JSON store so it does not depend on WASM SQLite).

## Run locally

Need Node 20+ and [Expo Go](https://expo.dev/go) on the iPhone.

```bash
npm install
npm start
```

Then scan the QR code in Expo Go (iOS). Notifications, camera QR scan, and the system share sheet work in Expo Go. Ads stay as the labeled test banner.

### Web preview (this Linux VM / desktop)

```bash
npm run web
```

Serves Metro web on **port 47821**. Reminders and live AdMob are not available in the browser; backup uses a file download instead of the iOS share sheet.

## Backup and sharing

- **Settings → Export JSON backup**: full profile (lists, habits, check-ins, imported friends). The hashed PIN is included so you can restore onto the same phone; treat the file like a password.
- **Settings → Import backup file**: replaces this profile’s habits/check-ins with the file.
- **Friends → Share progress JSON**: no PIN. Send via Messages/Mail.
- **Friends → QR**: compact 90-day heatmap. Import by scan (iPhone), file, or paste.

Sharing is **file-based only**. There is no live sync.

## Limits

- Family/friends only for now; the app is free
- Ads are **test / placeholder**, never a billed network
- Daily notification is local, default **9:00 PM**, iPhone only
- Winner uses the **latest imported snapshot**, not a live feed

## Privacy

Rootloop does not create a cloud account. Data stays on the phone unless you export a file or show a QR code.

© Snehalatha Nagabhairava, Sole Proprietorship
