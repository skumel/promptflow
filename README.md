# PromptFlow Teleprompter 🎙️

**PromptFlow** is a modern, lightweight, 100% offline teleprompter designed for public speakers, keynote presenters, and video calls. It is optimized to run smoothly on a **Chromebook** (or any desktop/laptop browser).

---

## 🌟 Key Features

- **100% Offline Capability**: Runs entirely in your browser with zero internet connection required. All parser engines are pre-bundled locally.
- **Natural Browser Window Sizing**:
  - Resizes and responds seamlessly to whatever size or shape you make your browser window!
  - Simply snap your browser window to the **top half** of your Chromebook screen (right under the webcam for natural eye contact), snap it **off to one side** next to your slides, or maximize it for full screen.
- **Zero-Overlap Reading Line**:
  - The control toolbar is now docked in its own dedicated footer at the bottom of the window, completely outside the reading stage.
  - It **never** obscures or collides with your text or the reading eye-line marker, no matter how short or small you make the window!
  - You can also collapse/minimize the control bar anytime (<kbd>H</kbd> or the chevron button) for maximum reading area.
- **Multi-Format Local File Support**:
  - **Word Documents (`.docx`)** with formatting, bold emphasis, and headings preserved.
  - **PDF Files (`.pdf`)** extracted page-by-page into continuous, easy-to-read text.
  - **Markdown (`.md`, `.markdown`)** formatted with headings, bullet points, and quotes.
  - **Plain Text (`.txt`, `.rtf`)** formatted into clean reading rhythm.
  - **Direct Script Editor & Live Paste**: Click the edit button (<kbd>E</kbd>) to paste notes or tweak words right in the app.
- **Speaker-First Controls**:
  - **Silky Smooth Scrolling**: Driven by `requestAnimationFrame` for stutter-free reading.
  - **Big Play / Pause Button** (or press <kbd>Space</kbd>).
  - **Faster / Slower Controls** with live Words-Per-Minute (WPM) calculations and speed slider (or <kbd>&uarr;</kbd> / <kbd>&darr;</kbd>).
  - **Direct Font Size Steppers (`A-` / `A+`)** right on the footer bar (or <kbd>[</kbd> / <kbd>]</kbd>).
  - **Interactive Scrubber / Progress Bar**: See elapsed time, remaining speech time, and jump instantly to any section.
  - **Rewind / Fast Forward 5s**: Quickly re-read a sentence or jump ahead.
  - **Smart Stage Cues**: Any direction written inside brackets like `[PAUSE 2s]`, `[SMILE]`, or `[CLICK SLIDE]` automatically renders as a prominent high-contrast badge so you never read stage directions out loud.
  - **Eye-Line Guide / Reading Marker**: Adjustable focus band with subtle arrows keeps your gaze locked on the active line.
  - **3-Second Countdown**: Gives you time to take a breath, look up, and smile before text starts rolling.
  - **Mirror / Flip Mode**: Flip horizontally for professional glass beam-splitter teleprompter hardware rigs.
  - **High-Contrast Dark Themes**: OLED Pure Dark (prevents bright screen glare reflecting off your glasses or face during a talk), Studio Amber, and Clean Light.

---

## 🚀 How to Use on Your Chromebook

### Option 1: Zero-Installation Single File (Easiest)
1. Copy or download the single file **`prompter-standalone.html`** to your Chromebook (via Google Drive, USB drive, or Downloads).
2. Open the **Files** app on your Chromebook and double-click **`prompter-standalone.html`** (or right-click &rarr; Open with Chrome).
3. Resize or snap your browser window anywhere on your screen (top half, side, or full).
4. That's it! It runs completely offline with full `.docx`, `.pdf`, `.md`, and `.txt` parsing built right in.

### Option 2: Install as a Chromebook App (PWA)
1. In the project folder, start the local server:
   ```bash
   npm start
   ```
2. Open `http://localhost:8080` in Chrome on your Chromebook.
3. Look at the right side of Chrome's address bar (omnibox) for the **Install App** icon (or click the 3-dots menu &rarr; **Save and share** &rarr; **Install PromptFlow**).
4. PromptFlow will now appear as an app in your Chromebook Launcher and shelf, launchable in its own distraction-free window even when completely offline!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> / Click Canvas | **Play / Pause** scrolling |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | **Faster / Slower** scroll speed |
| <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> | **Rewind / Jump Forward** 5 seconds |
| <kbd>Home</kbd> | **Restart** to beginning of speech |
| <kbd>[</kbd> / <kbd>]</kbd> | Decrease / Increase **Font Size** |
| <kbd>M</kbd> | Toggle **Mirror / Flip** (for glass teleprompter rigs) |
| <kbd>G</kbd> | Toggle **Eye-Line Guide Marker** |
| <kbd>H</kbd> | **Hide / Minimize Controls Bar** (Clean reading mode) |
| <kbd>F</kbd> | Toggle **Fullscreen** |
| <kbd>E</kbd> | Open **Script Editor & File Drop** |

---

## 🛠️ Development & Building

If you make modifications to the source code:

- **Rebuild Parser Bundle**:
  ```bash
  npm run build:bundle
  ```
- **Rebuild Standalone Single File**:
  ```bash
  npm run build:standalone
  ```
- **Full Build**:
  ```bash
  npm run build
  ```
