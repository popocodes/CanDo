# CanDo! — Simple Technical Details

This page explains how CanDo! works in plain language, including what runs the server and what technologies are used.

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

## What runs the app?

CanDo! uses a **Node.js server**.

### Node.js

**Node.js** is the program that allows JavaScript to run outside a web browser. In CanDo!, Node.js runs the background server on the computer.

The Node.js server is started by this file:

```text
server/index.js
```

### Express

The server uses **Express**, a Node.js tool that makes it easier to:

- Start the website
- Create web addresses for app features
- Receive information from the browser
- Send information back to the browser
- Serve the HTML, CSS, JavaScript, and image files

For example, when the browser asks for a list of chores, the Express server receives the request and gets the information from the database.

### npm

**npm** is the package manager used by Node.js. It downloads and manages the extra tools CanDo! needs.

The required tools are listed in:

```text
package.json
```

The main packages are:

| Package | What it does |
|---|---|
| `express` | Runs the web server and API routes |
| `cors` | Allows the browser and server to communicate during development |
| `multer` | Receives uploaded proof photos |
| `sqlite3` | Lets the server save and read information in SQLite |

Install these packages with:

```bash
npm install
```

Start the server with:

```bash
npm start
```

The `npm start` command runs:

```bash
node server/index.js
```

## Where the app runs

CanDo! runs as a local website. This means the app is started on a computer, and family members open it in a web browser.

The server normally uses port **3000**. A port is like a numbered doorway that lets a browser connect to the app.

On the same computer, open:

```text
http://localhost:3000
```

A phone or tablet on the same Wi-Fi network can also open the app using the computer's local network address.

Example:

```text
http://192.168.1.20:3000
```

To use a different port:

```bash
PORT=8080 npm start
```

## The server

The server is the part of the app that works in the background. It:

- Starts the CanDo! website
- Receives requests from the browser
- Saves children, chores, stars, rewards, and alerts
- Receives uploaded proof photos
- Sends live updates to the parent dashboard
- Sends optional phone notifications
- Protects parent features using the parent PIN

The server is built with **Node.js** and **Express**.

The main server file is:

```text
server/index.js
```

## How the browser and server communicate

The browser and server communicate using web requests.

For example:

1. A child presses **Done** on a chore step.
2. The browser sends the update to the Node.js server.
3. The server saves the completed step in SQLite.
4. The server sends a response back to the browser.
5. The browser displays the next step.

These server features are called **API routes**. CanDo!'s routes are located in `server/index.js` and use addresses such as:

```text
/api/kids
/api/chores
/api/rewards
/api/alerts
```

## The website part

The part families see in the browser is built with:

- **HTML** — the basic page structure
- **CSS** — colors, layout, buttons, and visual design
- **JavaScript** — interactions, missions, sounds, camera features, and animations

The main website files are inside:

```text
public/
```

Important frontend files include:

```text
public/index.html
public/css/style.css
public/js/app.js
```

The website is designed to work on computers, phones, and tablets.

## The database

CanDo! uses a small local database called **SQLite**.

The database is handled by:

```text
server/db.js
```

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

This is handled by **Server-Sent Events**, which is a live message connection from the server to the browser.

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

The server uses **Multer** to receive uploaded photos. Photos are saved on the computer running CanDo!, inside:

```text
public/uploads/
```

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

## Basic project structure

```text
CanDo/
├── package.json          # Node.js project settings and dependencies
├── server/
│   ├── index.js          # Main Node.js and Express server
│   ├── db.js             # SQLite database setup and database functions
│   └── ...               # Other server helpers and chore templates
├── public/
│   ├── index.html        # Main browser page
│   ├── css/              # Styles and visual design
│   ├── js/               # Browser-side JavaScript
│   ├── assets/           # Images and other visual files
│   └── uploads/          # Saved proof photos
└── cando.db              # Local database created when the app runs
```

## Important safety note

CanDo! is designed for use at home on a trusted local network. It is not currently designed to be exposed directly to the public internet.

The parent PIN is stored in the local database, and the app does not include full internet-facing security features. Do not publish the app publicly without adding stronger security protections.

## Main technology summary

| Area | Technology | Plain-language meaning |
|---|---|---|
| Server runtime | Node.js | Runs JavaScript on the computer |
| Server framework | Express | Helps Node.js run the website and API routes |
| Package manager | npm | Installs the tools the app needs |
| Project settings | `package.json` | Lists commands and dependencies |
| Web pages | HTML, CSS, JavaScript | Creates the screens and interactions |
| Local storage | SQLite and `sqlite3` | Saves family and mission information |
| Photo uploads | Multer | Receives photos from the browser |
| Live updates | Server-Sent Events | Sends updates to the parent screen immediately |
| Camera | Browser Camera API | Lets the app use the device camera |
| Notifications | ntfy | Sends optional messages to a parent's phone |

## Basic reset

To reset the local app data, stop the server and delete:

```text
cando.db
```

The next time CanDo! starts, it creates a fresh database with the default settings.
