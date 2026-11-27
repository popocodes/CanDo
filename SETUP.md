# CanDo! setup guide

## 1. Run the server

```bash
npm install
npm start            # http://localhost:3000
```

Everything below is optional. It is switched on by a file called `.env`:

```bash
cp .env.example .env
nano .env            # fill in what you need
```

Restart the server after every change to `.env`. Never commit `.env` (git already ignores it).

`PUBLIC_URL` is the address people type to open CanDo!, for example `https://cando.example.com`, without a trailing slash. Email links, Google, Apple and Stripe all need it.

> A free `trycloudflare.com` address changes every time the tunnel restarts. When it does, update `PUBLIC_URL`, the Google/Apple redirect addresses, and the server address in the Android app.

## 2. Email (SMTP)

Used for: forgot password, forgot PIN, and the daily summary.

| Setting | Meaning |
|---|---|
| `SMTP_HOST` | Your provider's mail server |
| `SMTP_PORT` | `587` (STARTTLS, usual) or `465` (TLS) |
| `SMTP_USER`, `SMTP_PASS` | Login for the mail server |
| `SMTP_FROM` | Sender, e.g. `"CanDo! <you@gmail.com>"` |

**Gmail:** turn on 2-Step Verification, then create an *App password* at <https://myaccount.google.com/apppasswords>.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your16letterapppassword
SMTP_FROM="CanDo! <you@gmail.com>"
```

**Other providers** (Brevo, Mailgun, SendGrid, Amazon SES, your web host): copy the SMTP host, port, user and password from their dashboard.

**Check it:** in the app, open *Commander → Settings → Parent account* and create the account. Then lock the app and tap *Forgot PIN?*. A 6-digit code should arrive. Look in the spam folder too. Password reset links also need `PUBLIC_URL`.

If nothing arrives, check the server's terminal output for the error.

## 3. Parent account

- One account per family server.
- If a PIN already exists, creating the account asks for it. This stops a stranger from linking their own email and resetting your PIN.
- Passwords need 8+ characters, 1 number and 1 symbol. Only a salted hash is stored.

## 4. Google sign-in (web version only)

1. Open <https://console.cloud.google.com/> and create a project.
2. *APIs & Services → OAuth consent screen*: choose External, fill in the app name and your email, and add your testers.
3. *Credentials → Create credentials → OAuth client ID → Web application*.
4. Authorised redirect URI: `PUBLIC_URL/api/v2/auth/google/callback`
5. Put the values in `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 5. Sign in with Apple (web version only)

Needs a paid Apple Developer account and an https `PUBLIC_URL` on a real domain.

1. In *Certificates, Identifiers & Profiles*, create an **App ID** with "Sign in with Apple".
2. Create a **Services ID**. This is `APPLE_CLIENT_ID`. Add your domain and the return URL `PUBLIC_URL/api/v2/auth/apple/callback`.
3. Create a **Key** with "Sign in with Apple" and download the `.p8` file.
4. Set `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY` (the file's contents on one line, with `\n` between lines).

Google and Apple buttons appear only when set up, and only in the browser version: Google blocks sign-in inside app web views.

## 6. Family Plus (Stripe)

1. Create a Stripe account and stay in **Test mode** first.
2. Create a product "Family Plus" with two recurring prices in MYR: RM12.90 monthly and RM99 yearly.
3. Set `STRIPE_SECRET_KEY` (`sk_test_…`), `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` (`price_…`), and `PUBLIC_URL`.
4. Set `PAYWALL=on` to lock every room except the Bedroom. With `PAYWALL=off` everything is free.
5. Test with card `4242 4242 4242 4242`, any future date and any CVC.

The server asks Stripe for the subscription status about every 6 hours, so no webhook is needed. The prices shown in the app are fixed text: change them in `public/js/ui/extra.js` if yours differ.

> **Google Play:** apps on the Play Store must use Google Play Billing for digital subscriptions. This Stripe checkout is fine for the website or a privately shared APK, not for a Play Store release.

## 7. Phone notifications (ntfy)

In the app: *Settings → Alerts → Phone notifications*. Install the ntfy app and subscribe to the same secret topic.

The **daily summary** is sent after `SUMMARY_HOUR` (default 19) when it is switched on under *Alerts*. **Gentle reminders** appear on the child's screen up to 10 minutes before a mission that has a time.

## 8. Android app

```bash
CANDO_SERVER=https://your-server-address node scripts/buildWeb.js
npx cap sync android
cd android
JAVA_HOME=$HOME/.jdk-21 ANDROID_HOME=$HOME/Android/Sdk ./gradlew assembleDebug   # needs Java 21; newer Java fails
# result: android/app/build/outputs/apk/debug/app-debug.apk
```

The app needs the server. If the address changes you don't need to rebuild: when the app can't connect it shows an address box, and it is also under *Settings → Server address*.

This is a **debug** APK for testing. A store release needs a signed release build.

## 9. Before real users: security

Parent actions on the new `/api/v2` routes need the parent PIN. But several older routes (for example approving a chore, editing a child, or reading `/api/v2/state` with the family's data) do not, and a 4-digit PIN is easy to guess without a limit on tries. That is acceptable only for short private testing.

- Take the tunnel down when you finish testing.
- Do not share the address publicly.
- Before any wider use, add real sign-in to the whole API.

Cloudflare quick tunnels do not deliver live events, so the app also checks for changes every few seconds.

The translations (Malay, Mandarin, Tamil) were drafted by an AI assistant and need a native speaker's review. Popo's recorded voice clips are English only.
