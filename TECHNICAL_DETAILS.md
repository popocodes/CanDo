# CanDo! — Simple Technical Details

This page explains how CanDo! works in plain language, including what runs the server, how the camera-based AR feature works, and how the app can become an Android app.

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

CanDo! currently runs as a local website. This means the app is started on a computer, and family members open it in a web browser.

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

## How the AR feature works

CanDo! currently uses **2D camera-assisted visual prompting**. This is sometimes called a lightweight AR experience, but it is not yet full 3D AR.

When the child presses **Show Me! (AR)**:

1. The browser asks for permission to use the device camera.
2. The camera video is displayed on the screen.
3. CanDo! places Popo, instructions, crosshairs, and a scanning animation on top of the video.
4. The child looks through the camera while following the instruction.
5. The child closes the camera view and continues the chore.

The camera view and overlay are defined in the frontend, especially in:

```text
public/index.html
public/js/app.js
public/css/style.css
```

The current feature does **not** automatically recognize objects, measure the room, or place 3D objects into the real world. It is a camera view with helpful 2D graphics layered on top.

### What would be needed for true AR?

A future full AR version could use Android ARCore or a web technology such as WebXR. That would allow features such as:

- Detecting walls and floors
- Recognizing surfaces
- Anchoring Popo or arrows to a real location
- Placing 3D guidance objects in the room
- Tracking the phone's movement in 3D

True AR would require additional testing, device support checks, 3D assets, and a more advanced camera/AR implementation.

## Android app plan

CanDo! can become an Android app without rewriting the whole project immediately.

### Recommended approach: Capacitor

The easiest approach for the current web-based project is to package the existing HTML, CSS, and JavaScript inside an Android shell using **Capacitor**.

With Capacitor:

- The existing frontend can be reused
- Android Studio can build an Android APK or App Bundle
- The app can request camera permissions
- The app can later use native Android features through plugins
- Web updates can remain separate from the Android wrapper

A typical future structure would be:

```text
CanDo/
├── public/              # Existing web app
├── server/              # Existing Node.js backend
├── android/             # Android project created by Capacitor
├── capacitor.config.*   # Capacitor configuration
└── package.json         # Web and Capacitor commands
```

### Important backend note

The Android app would still need to connect to the Node.js server.

During home testing, the Android app could connect to a computer on the same Wi-Fi network, for example:

```text
http://192.168.1.20:3000
```

For a public Android release, the server should normally be hosted on a secure online service using HTTPS. The Android app should not depend on a developer's personal computer being switched on.

The backend and database should eventually be separated from the phone app:

```text
Android app → Secure online Node.js server → Database and uploaded photos
```

### Should the app be compiled now?

Because CanDo! is still being developed, it is usually better **not to publish a final production APK yet**.

Recommended workflow:

1. Keep developing the web app.
2. Test it in a browser on a computer and phone.
3. Create an Android development build when mobile testing is useful.
4. Use Android Studio or Capacitor to test camera permissions and screen sizes.
5. Create a signed release build later, when the main features and data structure are stable.

You can still create test Android builds during development. A test build is useful for checking:

- Camera access
- Touch controls
- Screen layouts
- Android back-button behavior
- Notifications
- Performance on real devices

The important distinction is:

- **Development build** — for testing and frequent updates
- **Release build** — for publishing to users or the Google Play Store

### Updating the Android app during development

With a Capacitor workflow, the normal update process is:

1. Change the files in `public/`.
2. Test the website in a browser.
3. Copy the updated web files into the Android project.
4. Run the Android app again.
5. Build a new test APK when needed.

If the app loads its website from a secure server instead of bundling all files inside the APK, frontend updates can be made on the server without publishing a new APK every time. However, this approach requires reliable hosting, HTTPS, authentication, and careful version control.

Native Android changes, such as new permissions or native plugins, still require a new Android build.

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
├── android/              # Future Capacitor Android project
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
| Current AR style | 2D camera overlay | Displays guidance graphics over live camera video |
| Future Android wrapper | Capacitor | Packages the web app as an Android app |
| Future full AR | Android ARCore or WebXR | Supports 3D world tracking and AR objects |
| Notifications | ntfy | Sends optional messages to a parent's phone |

## Basic reset

To reset the local app data, stop the server and delete:

```text
cando.db
```

The next time CanDo! starts, it creates a fresh database with the default settings.
