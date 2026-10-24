/**
 * PromptFlow Teleprompter Core Engine
 * Smooth scrolling, natural browser window resizing, keyboard shortcuts, and offline state.
 */

class TeleprompterApp {
  constructor() {
    // State
    this.isPlaying = false;
    this.speed = 35; // Pixels per second (~130 wpm at default font size)
    this.fontSize = 38; // px
    this.mirrorH = false;
    this.showGuide = true;
    this.guidePosition = 38; // % from top of stage
    this.useCountdown = true;
    this.theme = 'pure-dark';
    this.columnWidth = 900; // px
    this.controlsVisible = true;
    this.currentDocTitle = 'Sample Talk';
    this.rawText = '';
    
    // Scrolling animation state
    this.currentScrollY = 0;
    this.lastTimestamp = null;
    this.animFrameId = null;
    this.isScrubbing = false;
    this.isCountingDown = false;
    this.countdownTimer = null;
    this.pipWindow = null;
    
    // Elements Cache
    this.dom = {};
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  init() {
    this.cacheElements();
    this.loadSettings();
    this.bindEvents();
    this.applyAllSettings();
    
    // Load initial content (saved in localStorage or default sample)
    const savedHtml = localStorage.getItem('promptflow_html');
    const savedRaw = localStorage.getItem('promptflow_raw');
    const savedTitle = localStorage.getItem('promptflow_title');
    
    if (savedHtml && savedRaw) {
      this.setPrompterContent(savedHtml, savedRaw, savedTitle || 'Untitled Speech');
    } else {
      this.loadSampleTalk();
    }

    // Set initial scroll position
    this.updateViewportMetrics();
    this.render();
  }

  cacheElements() {
    this.dom = {
      app: document.getElementById('app'),
      stage: document.getElementById('prompterStage'),
      viewport: document.getElementById('prompterViewport'),
      content: document.getElementById('prompterContent'),
      readingGuide: document.getElementById('readingGuide'),
      controls: document.getElementById('prompterControls'),
      btnPlayPause: document.getElementById('btnPlayPause'),
      playIcon: document.getElementById('playIcon'),
      pauseIcon: document.getElementById('pauseIcon'),
      playLabel: document.getElementById('playLabel'),
      btnSlower: document.getElementById('btnSlower'),
      btnFaster: document.getElementById('btnFaster'),
      speedDisplay: document.getElementById('speedDisplay'),
      speedWpm: document.getElementById('speedWpm'),
      speedSlider: document.getElementById('speedSlider'),
      btnFontSmaller: document.getElementById('btnFontSmaller'),
      btnFontLarger: document.getElementById('btnFontLarger'),
      scrubberBar: document.getElementById('scrubberBar'),
      scrubberFill: document.getElementById('scrubberFill'),
      scrubberThumb: document.getElementById('scrubberThumb'),
      timeElapsed: document.getElementById('timeElapsed'),
      timeRemaining: document.getElementById('timeRemaining'),
      docTitle: document.getElementById('docTitle'),
      wordCount: document.getElementById('wordCount'),
      fileInput: document.getElementById('fileInput'),
      dropzone: document.getElementById('dropzone'),
      btnEditScript: document.getElementById('btnEditScript'),
      btnSettings: document.getElementById('btnSettings'),
      btnShortcuts: document.getElementById('btnShortcuts'),
      btnFullscreen: document.getElementById('btnFullscreen'),
      btnPip: document.getElementById('btnPip'),
      btnRestart: document.getElementById('btnRestart'),
      btnRewind: document.getElementById('btnRewind'),
      btnForward: document.getElementById('btnForward'),
      btnToggleMirror: document.getElementById('btnToggleMirror'),
      btnToggleGuide: document.getElementById('btnToggleGuide'),
      btnToggleControls: document.getElementById('btnToggleControls'),
      countdownOverlay: document.getElementById('countdownOverlay'),
      countdownNumber: document.getElementById('countdownNumber'),
      toast: document.getElementById('toast'),
      toastMessage: document.getElementById('toastMessage'),
      
      // Modals
      editorModal: document.getElementById('editorModal'),
      editorTextarea: document.getElementById('editorTextarea'),
      btnSaveEditor: document.getElementById('btnSaveEditor'),
      btnCloseEditor: document.getElementById('btnCloseEditor'),
      settingsModal: document.getElementById('settingsModal'),
      btnCloseSettings: document.getElementById('btnCloseSettings'),
      shortcutsModal: document.getElementById('shortcutsModal'),
      btnCloseShortcuts: document.getElementById('btnCloseShortcuts'),
      
      // Settings Controls
      fontSizeSlider: document.getElementById('fontSizeSlider'),
      fontSizeVal: document.getElementById('fontSizeVal'),
      colWidthSlider: document.getElementById('colWidthSlider'),
      colWidthVal: document.getElementById('colWidthVal'),
      guidePosSlider: document.getElementById('guidePosSlider'),
      guidePosVal: document.getElementById('guidePosVal'),
      themeSelect: document.getElementById('themeSelect'),
      countdownCheckbox: document.getElementById('countdownCheckbox')
    };
  }

  bindEvents() {
    // Play / Pause
    this.dom.btnPlayPause.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlayPause();
    });

    // Clicking stage toggles pause/play
    this.dom.stage.addEventListener('click', (e) => {
      if (window.getSelection().toString().length === 0) {
        this.togglePlayPause();
      }
    });

    // Speed Controls
    this.dom.btnSlower.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustSpeed(-4);
    });

    this.dom.btnFaster.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustSpeed(4);
    });

    if (this.dom.speedSlider) {
      this.dom.speedSlider.addEventListener('input', (e) => {
        this.setSpeed(parseInt(e.target.value, 10));
      });
    }

    // Font Steppers on footer
    if (this.dom.btnFontSmaller) {
      this.dom.btnFontSmaller.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setFontSize(this.fontSize - 2);
      });
    }

    if (this.dom.btnFontLarger) {
      this.dom.btnFontLarger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setFontSize(this.fontSize + 2);
      });
    }

    // Navigation & Scrubbing
    this.dom.btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      this.restart();
    });

    this.dom.btnRewind.addEventListener('click', (e) => {
      e.stopPropagation();
      this.jumpSeconds(-5);
    });

    this.dom.btnForward.addEventListener('click', (e) => {
      e.stopPropagation();
      this.jumpSeconds(5);
    });

    // Scrubber click & drag (supports mouse, touch, and stylus)
    this.dom.scrubberBar.addEventListener('pointerdown', (e) => this.startScrubbing(e));
    window.addEventListener('pointermove', (e) => this.onScrubbing(e));
    window.addEventListener('pointerup', () => this.stopScrubbing());
    window.addEventListener('pointercancel', () => this.stopScrubbing());

    // Mirror & Guide toggles
    this.dom.btnToggleMirror.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMirror();
    });

    this.dom.btnToggleGuide.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleGuide();
    });

    this.dom.btnToggleControls.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleControls();
    });

    // Clicking collapsed controls restores it
    this.dom.controls.addEventListener('click', (e) => {
      if (this.dom.controls.classList.contains('collapsed')) {
        this.toggleControls();
      }
    });

    // Fullscreen & PiP
    this.dom.btnFullscreen.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });

    this.dom.btnPip.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openPopupWindow();
    });

    // File Input & Dropzone
    this.dom.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.setupDropzone();

    // Editor Modal
    this.dom.btnEditScript.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditor();
    });
    this.dom.btnCloseEditor.addEventListener('click', () => this.closeModals());
    this.dom.btnSaveEditor.addEventListener('click', () => this.saveEditorContent());

    // Settings Modal
    this.dom.btnSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openSettings();
    });
    this.dom.btnCloseSettings.addEventListener('click', () => this.closeModals());

    // Shortcuts Modal
    this.dom.btnShortcuts.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openShortcuts();
    });
    this.dom.btnCloseShortcuts.addEventListener('click', () => this.closeModals());

    // Settings inputs
    this.dom.fontSizeSlider.addEventListener('input', (e) => {
      this.setFontSize(parseInt(e.target.value, 10));
    });

    this.dom.colWidthSlider.addEventListener('input', (e) => {
      this.setColumnWidth(parseInt(e.target.value, 10));
    });

    this.dom.guidePosSlider.addEventListener('input', (e) => {
      this.setGuidePosition(parseInt(e.target.value, 10));
    });

    this.dom.themeSelect.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
    });

    this.dom.countdownCheckbox.addEventListener('change', (e) => {
      this.useCountdown = e.target.checked;
      this.saveSettings();
    });

    // Manual scroll tracking
    this.dom.viewport.addEventListener('scroll', () => {
      if (!this.isPlaying && !this.isScrubbing) {
        this.currentScrollY = this.dom.viewport.scrollTop;
        this.updateScrubber();
      }
    }, { passive: true });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Window resize - naturally recalculates prompter bounds
    window.addEventListener('resize', () => {
      this.updateViewportMetrics();
    });
  }

  setupDropzone() {
    const dz = this.dom.dropzone;
    if (!dz) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.remove('dragover');
      }, false);
    });

    dz.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.processFile(files[0]);
      }
    }, false);
  }

  handleKeyDown(e) {
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.tagName === 'SELECT')) {
      if (e.key === 'Escape') this.closeModals();
      return;
    }

    if (e.key === 'Escape') {
      this.closeModals();
      return;
    }

    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      this.openShortcuts();
      return;
    }

    // Ignore single-letter shortcuts when modifier keys are pressed (e.g. Ctrl+F, Cmd+R)
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        this.togglePlayPause();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.adjustSpeed(e.shiftKey ? 8 : 3);
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.adjustSpeed(e.shiftKey ? -8 : -3);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.jumpSeconds(-5);
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.jumpSeconds(5);
        break;

      case 'Home':
        e.preventDefault();
        this.restart();
        break;

      case 'BracketLeft': // [ - font size smaller
        e.preventDefault();
        this.setFontSize(this.fontSize - 2);
        break;

      case 'BracketRight': // ] - font size larger
        e.preventDefault();
        this.setFontSize(this.fontSize + 2);
        break;

      case 'KeyM': // Mirror toggle
        this.toggleMirror();
        break;

      case 'KeyG': // Guide toggle
        this.toggleGuide();
        break;

      case 'KeyH': // Hide/show controls footer
        this.toggleControls();
        break;

      case 'KeyF': // Fullscreen toggle
        this.toggleFullscreen();
        break;

      case 'KeyE': // Edit script
        this.openEditor();
        break;

      case 'Escape':
        this.closeModals();
        break;
    }
  }

  // ==========================================================================
  // Playback & Animation Loop
  // ==========================================================================

  togglePlayPause() {
    if (this.isCountingDown) {
      this.cancelCountdown();
      this.showToast('Countdown Cancelled');
      return;
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.useCountdown && this.currentScrollY === 0) {
        this.startCountdown(() => this.play());
      } else {
        this.play();
      }
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.updatePlayPauseUI();
    this.animFrameId = requestAnimationFrame((ts) => this.scrollLoop(ts));
    this.showToast('Prompter Started');
  }

  pause() {
    if (this.isCountingDown) {
      this.cancelCountdown();
    }
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.updatePlayPauseUI();
    this.showToast('Paused');
  }

  scrollLoop(timestamp) {
    if (!this.isPlaying) return;

    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const deltaSec = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    const maxScroll = this.dom.viewport.scrollHeight - this.dom.viewport.clientHeight;

    if (this.currentScrollY >= maxScroll) {
      this.pause();
      this.showToast('Speech Completed!');
      return;
    }

    this.currentScrollY += this.speed * deltaSec;
    if (this.currentScrollY > maxScroll) this.currentScrollY = maxScroll;

    this.dom.viewport.scrollTop = this.currentScrollY;
    this.updateScrubber();

    this.animFrameId = requestAnimationFrame((ts) => this.scrollLoop(ts));
  }

  restart() {
    this.currentScrollY = 0;
    this.dom.viewport.scrollTop = 0;
    this.updateScrubber();
    this.showToast('Reset to Beginning');
  }

  jumpSeconds(seconds) {
    const deltaPx = seconds * this.speed;
    const maxScroll = this.dom.viewport.scrollHeight - this.dom.viewport.clientHeight;
    this.currentScrollY = Math.max(0, Math.min(maxScroll, this.currentScrollY + deltaPx));
    this.dom.viewport.scrollTop = this.currentScrollY;
    this.updateScrubber();
    this.showToast(`${seconds > 0 ? '+' : ''}${seconds}s`);
  }

  startCountdown(callback) {
    if (this.isCountingDown) return;
    this.isCountingDown = true;
    this.dom.countdownOverlay.style.display = 'flex';
    
    let count = 3;
    this.dom.countdownNumber.textContent = count;
    
    this.countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        this.dom.countdownNumber.textContent = count;
      } else {
        this.cancelCountdown();
        callback();
      }
    }, 850);
  }

  cancelCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.isCountingDown = false;
    if (this.dom.countdownOverlay) {
      this.dom.countdownOverlay.style.display = 'none';
    }
  }

  // ==========================================================================
  // Speed, Scrubber & Metrics
  // ==========================================================================

  setSpeed(val) {
    this.speed = Math.max(5, Math.min(val, 200));
    this.dom.speedDisplay.textContent = this.speed;
    if (this.dom.speedSlider) this.dom.speedSlider.value = this.speed;
    
    const wordsPerPx = 4 / (this.fontSize * 1.55);
    const estimatedWpm = Math.round(this.speed * wordsPerPx * 60);
    this.dom.speedWpm.textContent = `${estimatedWpm} wpm`;
    
    this.updateScrubber();
    this.saveSettings();
  }

  adjustSpeed(delta) {
    this.setSpeed(this.speed + delta);
    this.showToast(`Speed: ${this.speed} px/s`);
  }

  updateScrubber() {
    const maxScroll = this.dom.viewport.scrollHeight - this.dom.viewport.clientHeight;
    if (maxScroll <= 0) {
      this.dom.scrubberFill.style.width = '0%';
      this.dom.timeElapsed.textContent = '00:00';
      this.dom.timeRemaining.textContent = '00:00';
      return;
    }

    const ratio = Math.max(0, Math.min(1, this.currentScrollY / maxScroll));
    this.dom.scrubberFill.style.width = `${(ratio * 100).toFixed(1)}%`;

    const elapsedSec = this.speed > 0 ? this.currentScrollY / this.speed : 0;
    const remainingSec = this.speed > 0 ? (maxScroll - this.currentScrollY) / this.speed : 0;

    this.dom.timeElapsed.textContent = DocumentParser.formatTime(elapsedSec);
    this.dom.timeRemaining.textContent = `-${DocumentParser.formatTime(remainingSec)}`;
  }

  startScrubbing(e) {
    this.isScrubbing = true;
    this.onScrubbing(e);
  }

  onScrubbing(e) {
    if (!this.isScrubbing) return;
    const rect = this.dom.scrubberBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const maxScroll = this.dom.viewport.scrollHeight - this.dom.viewport.clientHeight;
    this.currentScrollY = ratio * maxScroll;
    this.dom.viewport.scrollTop = this.currentScrollY;
    this.updateScrubber();
  }

  stopScrubbing() {
    this.isScrubbing = false;
  }

  updateViewportMetrics() {
    this.currentScrollY = this.dom.viewport.scrollTop;
    this.updateScrubber();
  }

  // ==========================================================================
  // Display Customization & Toggles
  // ==========================================================================

  toggleMirror() {
    this.mirrorH = !this.mirrorH;
    this.dom.viewport.classList.toggle('mirror-h', this.mirrorH);
    this.dom.btnToggleMirror.classList.toggle('btn-active', this.mirrorH);
    this.saveSettings();
    this.showToast(`Mirror: ${this.mirrorH ? 'ON' : 'OFF'}`);
  }

  toggleGuide() {
    this.showGuide = !this.showGuide;
    this.dom.readingGuide.classList.toggle('hidden', !this.showGuide);
    this.dom.btnToggleGuide.classList.toggle('btn-active', this.showGuide);
    this.saveSettings();
  }

  toggleControls() {
    this.controlsVisible = !this.controlsVisible;
    this.dom.controls.classList.toggle('collapsed', !this.controlsVisible);
    setTimeout(() => this.updateViewportMetrics(), 200);
  }

  setFontSize(size) {
    this.fontSize = Math.max(18, Math.min(size, 84));
    document.documentElement.style.setProperty('--prompter-font-size', `${this.fontSize}px`);
    this.dom.fontSizeSlider.value = this.fontSize;
    this.dom.fontSizeVal.textContent = `${this.fontSize}px`;
    this.setSpeed(this.speed);
    this.saveSettings();
  }

  setColumnWidth(width) {
    this.columnWidth = Math.max(450, Math.min(width, 1600));
    document.documentElement.style.setProperty('--prompter-max-width', `${this.columnWidth}px`);
    this.dom.colWidthSlider.value = this.columnWidth;
    this.dom.colWidthVal.textContent = `${this.columnWidth}px`;
    this.saveSettings();
  }

  setGuidePosition(pct) {
    this.guidePosition = Math.max(15, Math.min(pct, 70));
    this.dom.readingGuide.style.top = `${this.guidePosition}%`;
    document.documentElement.style.setProperty('--guide-pos-pad', `${this.guidePosition}vh`);
    this.dom.guidePosSlider.value = this.guidePosition;
    this.dom.guidePosVal.textContent = `${this.guidePosition}%`;
    this.saveSettings();
  }

  setTheme(theme) {
    this.theme = theme;
    document.body.setAttribute('data-theme', theme);
    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.document.body.setAttribute('data-theme', theme);
    }
    this.dom.themeSelect.value = theme;
    this.saveSettings();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  }

  async openPopupWindow() {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 800,
          height: 340
        });
        this.pipWindow = pipWindow;

        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            if (styleSheet.href) {
              link.rel = 'stylesheet';
              link.type = styleSheet.type;
              link.media = styleSheet.media;
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            }
          }
        });

        pipWindow.document.body.setAttribute('data-theme', this.theme);
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.overflow = 'hidden';
        pipWindow.document.body.appendChild(this.dom.app);

        const restoreApp = () => {
          if (this.dom.app && !document.getElementById('app')) {
            document.body.prepend(this.dom.app);
            this.updateViewportMetrics();
          }
          this.pipWindow = null;
        };

        pipWindow.addEventListener('pagehide', restoreApp);
        pipWindow.addEventListener('resize', () => this.updateViewportMetrics());

        this.updateViewportMetrics();
        this.showToast('Launched Floating Window');
        return;
      } catch (err) {
        console.warn('PiP window error:', err);
      }
    }

    // Fallback: standard compact popup
    const popup = window.open(
      window.location.href,
      'PromptFlow_Mini',
      'width=880,height=340,menubar=no,toolbar=no,location=no,status=no,top=0,left=150'
    );
    if (popup) {
      this.showToast('Opened Pop-out Window');
    } else {
      alert('Pop-up was blocked. Please allow pop-ups for this page in Chrome.');
    }
  }

  // ==========================================================================
  // File Loading & Parsing
  // ==========================================================================

  async handleFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      await this.processFile(file);
      e.target.value = '';
    }
  }

  async processFile(file) {
    this.showToast(`Loading ${file.name}...`);
    try {
      const parsed = await DocumentParser.parseFile(file);
      this.setPrompterContent(parsed.html, parsed.rawText, parsed.title);
      this.restart();
      this.showToast(`Loaded ${parsed.title}`);
    } catch (err) {
      alert(`Error reading file: ${err.message}`);
    }
  }

  setPrompterContent(html, rawText, title) {
    this.rawText = rawText;
    this.currentDocTitle = title;
    this.dom.content.innerHTML = html;
    this.dom.docTitle.textContent = title;
    
    const words = DocumentParser.countWords(rawText);
    const estSec = DocumentParser.estimateDurationSeconds(words);
    this.dom.wordCount.textContent = `${words} words (~${DocumentParser.formatTime(estSec)})`;

    localStorage.setItem('promptflow_html', html);
    localStorage.setItem('promptflow_raw', rawText);
    localStorage.setItem('promptflow_title', title);

    this.updateViewportMetrics();
  }

  loadSampleTalk() {
    const sampleMd = `# The Art of Speaking to Humans\n*By Antigravity Speaker Studio*\n\n[PAUSE - SMILE AND MAKE EYE CONTACT WITH THE AUDIENCE]\n\nGood morning, everyone. \n\nThank you so much for having me today. \n\nHave you ever noticed that when people step up to a podium, something strange happens? \n\n[PAUSE 2s - CLICK SLIDE 1]\n\nTheir shoulders tense up. Their breathing becomes shallow. And suddenly, they stop speaking like a human being and start sounding like a corporate quarterly report.\n\n[LAUGHTER - GESTURE TO AUDIENCE]\n\nI used to do this all the time. Early in my career, I thought public speaking was about sounding smart. I thought it was about packing every slide with data and reading bullet points as fast as humanly possible.\n\n**Here is the truth I wish someone had told me ten years ago:**\n\n> The audience is not here to inspect your slides. \n> The audience is here to connect with your story.\n\n[DEEP BREATH - SLOW DOWN TEMPO]\n\nWhen you stand before an audience, your job is not to deliver words. Your job is to create a moment of shared understanding.\n\n### The Three Principles of Effortless Talks\n\n**1. The Rule of One Idea**\nEvery great talk is remembered for exactly one central thesis. If you try to give them ten ideas, they will remember zero. Give them one crystal-clear idea that they can carry home in their pocket.\n\n[CLICK SLIDE 2]\n\n**2. The Power of the Intentional Pause**\nWhen you pause, you don't look unprepared. You look confident. A pause gives your words weight and gives your listeners room to reflect.\n\n[PAUSE 3s - LOOK AT LEFT SIDE OF ROOM]\n\nNotice how quiet the room gets when you stop talking? That silence is where your message lands.\n\n**3. Speak to One Person at a Time**\nAn audience is not a monolith. It is simply a collection of individuals. Look at one friendly face, finish a complete thought with them, then smoothly transition your gaze to another person.\n\n[CLICK SLIDE 3 - WRAP UP]\n\nAs we close today, remember this:\n\nCourage is not the absence of stage fright. \nCourage is stepping up to the microphone because your message matters more than your fear.\n\nThank you.\n\n[BOW - APPLAUSE - TAKE QUESTIONS]`;
    
    const parsed = DocumentParser.parseTextContent(sampleMd, 'Sample Talk: Speaking to Humans');
    this.setPrompterContent(parsed.html, parsed.rawText, parsed.title);
  }

  // ==========================================================================
  // Script Editor Modal
  // ==========================================================================

  openEditor() {
    this.pause();
    this.dom.editorTextarea.value = this.rawText;
    this.dom.editorModal.classList.add('open');
    this.dom.editorTextarea.focus();
  }

  saveEditorContent() {
    const text = this.dom.editorTextarea.value;
    const parsed = DocumentParser.parseTextContent(text, this.currentDocTitle || 'Custom Speech');
    this.setPrompterContent(parsed.html, parsed.rawText, parsed.title);
    this.closeModals();
    this.restart();
    this.showToast('Script Updated');
  }

  openSettings() {
    this.pause();
    this.dom.settingsModal.classList.add('open');
  }

  openShortcuts() {
    this.pause();
    this.dom.shortcutsModal.classList.add('open');
  }

  closeModals() {
    this.dom.editorModal.classList.remove('open');
    this.dom.settingsModal.classList.remove('open');
    this.dom.shortcutsModal.classList.remove('open');
  }

  // ==========================================================================
  // Settings & Storage
  // ==========================================================================

  saveSettings() {
    const settings = {
      speed: this.speed,
      fontSize: this.fontSize,
      columnWidth: this.columnWidth,
      mirrorH: this.mirrorH,
      showGuide: this.showGuide,
      guidePosition: this.guidePosition,
      useCountdown: this.useCountdown,
      theme: this.theme
    };
    localStorage.setItem('promptflow_settings', JSON.stringify(settings));
  }

  loadSettings() {
    try {
      const data = localStorage.getItem('promptflow_settings');
      if (data) {
        const s = JSON.parse(data);
        if (s.speed) this.speed = s.speed;
        if (s.fontSize) this.fontSize = s.fontSize;
        if (s.columnWidth) this.columnWidth = s.columnWidth;
        if (s.mirrorH !== undefined) this.mirrorH = s.mirrorH;
        if (s.showGuide !== undefined) this.showGuide = s.showGuide;
        if (s.guidePosition) this.guidePosition = s.guidePosition;
        if (s.useCountdown !== undefined) this.useCountdown = s.useCountdown;
        if (s.theme) this.theme = s.theme;
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
    }
  }

  applyAllSettings() {
    this.setSpeed(this.speed);
    this.setFontSize(this.fontSize);
    this.setColumnWidth(this.columnWidth);
    this.setGuidePosition(this.guidePosition);
    this.setTheme(this.theme);
    
    if (this.mirrorH) {
      this.dom.viewport.classList.add('mirror-h');
      this.dom.btnToggleMirror.classList.add('btn-active');
    }
    
    if (!this.showGuide) {
      this.dom.readingGuide.classList.add('hidden');
      this.dom.btnToggleGuide.classList.remove('btn-active');
    } else {
      this.dom.btnToggleGuide.classList.add('btn-active');
    }

    this.dom.countdownCheckbox.checked = this.useCountdown;
  }

  // ==========================================================================
  // UI Helpers
  // ==========================================================================

  updatePlayPauseUI() {
    if (this.isPlaying) {
      this.dom.btnPlayPause.classList.add('playing');
      this.dom.playIcon.style.display = 'none';
      this.dom.pauseIcon.style.display = 'inline-block';
      this.dom.playLabel.textContent = 'Pause';
    } else {
      this.dom.btnPlayPause.classList.remove('playing');
      this.dom.playIcon.style.display = 'inline-block';
      this.dom.pauseIcon.style.display = 'none';
      this.dom.playLabel.textContent = 'Play';
    }
  }

  showToast(message) {
    if (!this.dom.toast) return;
    this.dom.toastMessage.textContent = message;
    this.dom.toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.dom.toast.classList.remove('show');
    }, 1800);
  }

  render() {
    this.updatePlayPauseUI();
    this.updateScrubber();
  }
}

// Instantiate
window.prompterApp = new TeleprompterApp();
