# CanDo! — ADHD-Friendly Visual Chore Companion 🐱✨

A gamified, ADHD-first visual chore companion designed for children (ages 5–12) to overcome task paralysis, executive dysfunction, and overwhelm. Featuring **Popo**, the cosmic cat alien guide and digital body double!

---

## 🌟 Key Features & ADHD Psychology

- 🚀 **No Ticking Numbers**: Visual progress bar featuring an animated spaceship cruising toward a planetary goal, eliminating time anxiety.
- 🧩 **Chunking (1 Step at a Time)**: Prevents cognitive overload by displaying only a single micro-task card at any moment.
- 🔊 **Audio First**: Built-in voiceover (Web Speech API) and gentle audio synthesizer cues (Web Audio API) so children can set the device down and clean with both hands.
- ⚖️ **Asymmetric Gamification**: No punishing streak breaks or penalties for missed days. Massive celebratory confetti and star rewards for completed missions!
- 🔋 **Low Battery Mode**: A one-tap toggle for low-energy or sensory overload days that collapses complex chores into 1–2 "Good Enough" micro-tasks.
- 🎡 **Mission Roulette ("Decide For Me!")**: An interactive spinning wheel that chooses a chore when task paralysis makes deciding impossible.
- 🔍 **2D AR "Magic Lens" Visual Prompting**: Device camera overlay with Popo and holographic target frames showing where items belong.
- 📸 **Mission Shutter & Celebration**: Proof photo capture with full-screen HTML5 confetti explosion and fanfare sound.
- 🕹️ **Cosmic Arcade ("Cosmic Bubble Pop")**: A relaxing, no-lose bubble popping minigame that serves as an exit strategy and waiting lounge while parents review work.
- 🚨 **SoftLock Distraction Monitor**: Detects when a child navigates away from CanDo! during an active chore, pauses the task, gently welcomes them back, and alerts the parent dashboard in real time.
- 🏮 **Space Base Customizer**: Children can spend their earned stars on cosmic room decorations (Lava Lamp, Galaxy Projector, Alien Succulents, Mini Mars Rover, Disco Orb).
- 🔔 **ntfy phone notifications** for completed missions, left-app events, reward claims and help requests.
- 🧭 **Guided setup page** (family, PIN, explorers, notifications).
- 🔒 **Parent Command Center (PIN protected)**:
  - **Approvals Inbox**: View photo proof submissions with timestamps and approve (+stars) or send gentle redo notes.
  - **Task Assigner**: Preloaded with all 10 household room routines and 50 micro-steps from `ADHD-Friendly 5-Step Chores by Room.txt`.
  - **Reward Maker**: Create real-world rewards (screen time, ice cream, movie night) and approve redemptions.
  - **Distraction & Mission Alerts Feed**: Real-time push feed of task pauses, proof submissions, and star awards.
  - **Cadet Profiles & PIN Settings**: Add children, customize avatar colors, and change the parent PIN.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Server**: Express
- **Database**: SQLite (`sqlite3`) with automatic schema initialization & seeding
- **Real-Time Push**: Server-Sent Events (SSE)
- **Frontend**: Pure modern JavaScript (ES6+), custom cosmic CSS, HTML5 Canvas, Web Audio API, Web Speech API, and HTML5 Camera API (`getUserMedia`).

---

## 🚀 Running the App

```bash
npm install
npm start          # http://localhost:3000
```

Requires Node.js 18+. The SQLite database (`cando.db`) is created automatically on first run.

On first launch you are redirected to the **Setup page** (`/setup.html`), a 4-step wizard:

1. **Family & parent PIN** (4 digits)
2. **Add your explorers** (name, colour, Popo avatar)
3. **Parent notifications (ntfy)** – optional, can be done later
4. **Review & launch**

You can reopen it any time at `http://localhost:3000/setup.html` (asks for the current PIN once set up), or edit notifications in **Parent → 🔔 Notifications**.

> Opening CanDo! from a phone/tablet: use your computer's LAN address (the setup page lists it, e.g. `http://192.168.1.20:3000`). Browsers only allow the **camera** on `https://` or `localhost`; without it, kids can still choose a photo from their gallery/camera app via **“Choose a photo”**.

---

## 🔔 Parent notifications with ntfy

[ntfy](https://ntfy.sh) sends push notifications to your phone through simple HTTP – free, no account needed.

### Setup

1. Install the **ntfy** app ([Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy) / [iOS](https://apps.apple.com/app/ntfy/id1625396347)) or open `https://ntfy.sh` in a browser.
2. In CanDo! (Setup page step 3, or Parent → Notifications):
   - **Server**: `https://ntfy.sh` (or your self-hosted URL)
   - **Topic**: a secret name, e.g. `cando-x7k2q9` (use the 🎲 button – on the public server anyone who knows the topic can read it)
   - **Token / user:password** *(optional)*: for self-hosted or protected topics. A plain token is sent as `Bearer`, `user:password` is sent as `Basic`.
   - **Tap-to-open link** *(optional)*: your CanDo! address reachable from your phone.
   - Choose which events to receive.
3. In the ntfy app press **+** and subscribe to the **same topic**.
4. Press **Send test notification**.

### Events

| Event | When | Example |
|-------|------|---------|
| 📸 `completion` | Child submits proof photo | “Leo finished 'Reset Your Room'. Check their proof photo!” |
| 🚨 `distraction` | Child leaves the app mid-chore (SoftLock) | “Leo left CanDo! at 4:15 PM…” |
| 🎁 `reward` | Child spends stars | “Leo spent 20 stars on '30 Mins iPad / Screen Time'.” |
| 🆘 `help` | Child taps “I need help” | “Leo needs help with 'Reset Your Room'.” |

Notifications are sent from the server (never blocking the app); if ntfy is unreachable the app keeps working and logs a warning. Settings are PIN-protected and the saved token is never sent back to the browser.

### Self-hosting ntfy (optional)

```bash
docker run -p 8080:80 -it binwiederhier/ntfy serve
# then use  http://<your-server>:8080  as the Server value
```

---

## 🧰 Other notes

- **Reset everything**: stop the server and delete `cando.db`.
- **Port**: `PORT=8080 npm start`.
- **Parent PIN** is stored in the local database in plain text – CanDo! is designed as a home-network family tool, not an internet-facing service. Don’t expose it publicly without adding HTTPS and real authentication.
- Child check-in after every mission: *“Is the room clean enough for now?”* → Yes / No (one more small round) / Send a photo / I need help.
