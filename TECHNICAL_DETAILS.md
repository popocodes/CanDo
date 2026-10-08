# CanDo! — Simple Technical Details

This page explains how CanDo! works in plain language.

## What is CanDo!?

CanDo! is a web app that helps children complete household tasks one small step at a time. It is designed to be friendly and encouraging for children with ADHD.

The app includes:

- Short, easy-to-follow chore steps
- Popo, the space-cat guide
- Optional voice instructions
- Camera support for 2D visual prompts and proof photos
- Stars that children can earn for completed tasks
- Rewards that parents can create
- A parent area protected by a PIN
- Phone notifications for important events

## How the app works

1. A parent starts CanDo! and completes the setup.
2. The parent adds one or more child profiles.
3. The parent assigns a chore or creates a custom mission.
4. The child opens the mission and follows one step at a time.
5. The child can listen to instructions, ask for help, or use the camera prompts.
6. The child sends a photo when the mission is finished.
7. The parent reviews the photo and approves the mission.
8. The child receives stars and can exchange them for family-approved rewards.

## Where the app runs

CanDo! runs as a local website. This means the app is started on a computer, and family members open it in a web browser.

A phone or tablet on the same Wi-Fi network can also open the app using the computer's local network address.

Example:

```text
http://192.168.1.20:3000
```

## The server

The server is the part of the app that works in the background. It:

- Starts the CanDo! website
- Receives requests from the browser
- Saves children, chores, stars, rewards, and alerts
- Receives uploaded proof photos
- Sends live updates to the parent dashboard
- Sends optional phone notifications

The server is built with **Node.js** and **Express**.

To start it:

```bash
npm install
npm start
```

By default, the app opens at:

```text
http://localhost:3000
```

## The website part

The part families see in the browser is built with:

- **HTML** — the basic page structure
- **CSS** — colors, layout, buttons, and visual design
- **JavaScript** — interactions, missions, sounds, camera features, and animations

The website is designed to work on computers, phones, and tablets.

## The database

CanDo! uses a small local database called **SQLite**.

The database is stored in a file named:

```text
cando.db
```

It stores information such as:

- Family settings
- Parent PIN
- Child profiles
- Chores and chore steps
- Star totals
- Rewards
- Reward claims
- Parent alerts
- Proof photo locations

The database is created automatically the first time the server starts.

## Live updates

The parent dashboard can receive updates without constantly refreshing the page. For example, it can show when:

- A child submits a mission photo
- A child asks for help
- A child leaves the app during a mission
- A reward is claimed
- A parent approves a mission

This is handled by a server feature called **Server-Sent Events**, which can be thought of as a live message connection from the server to the browser.

## Phone notifications

CanDo! can optionally use **ntfy** to send notifications to a parent's phone.

Notifications can be sent when:

- A mission is completed
- A child leaves the app during a mission
- A reward is claimed
- A child asks for help

Phone notifications are optional. The main app can continue working if notifications are not configured.

## Photos and camera features

The app can use the device camera for two purposes:

1. Showing a visual camera prompt during a chore
2. Taking a photo that the parent can review

Photos are saved on the computer running CanDo!, inside the app's upload folder.

## Parent access

The Parent Command Center is protected by a four-digit PIN. Parents can use it to:

- Review submitted photos
- Approve or request a small redo
- Assign chores
- Create rewards
- View activity alerts
- Add or edit child profiles
- Change the parent PIN
- Configure phone notifications

## Important safety note

CanDo! is designed for use at home on a trusted local network. It is not currently designed to be exposed directly to the public internet.

The parent PIN is stored in the local database, and the app does not include full internet-facing security features. Do not publish the app publicly without adding stronger security protections.

## Main technology summary

| Area | Technology | Plain-language meaning |
|---|---|---|
| Website server | Node.js and Express | Runs the app and handles requests |
| Web pages | HTML, CSS, JavaScript | Creates the screens and interactions |
| Local storage | SQLite | Saves family and mission information |
| Live updates | Server-Sent Events | Sends updates to the parent screen immediately |
| Photos | Browser camera and file upload | Takes and saves proof photos |
| Notifications | ntfy | Sends optional messages to a parent's phone |

## Basic reset

To reset the local app data, stop the server and delete:

```text
cando.db
```

The next time CanDo! starts, it creates a fresh database with the default settings.
