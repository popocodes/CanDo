/**
 * CanDo! Audio & Voiceover Engine
 * High-Fidelity Audio Architecture:
 * - 25 High-Quality MP3 Sound Effects (assets/button sounds/)
 * - 34 Authentic Popo Space Mascot Voiceover Clips (assets/mascot narrations/)
 * - Web Audio API Realtime Synthesizers (zero-asset fallback & bubble arcade pitch scaling)
 * - Web Speech API Voiceover Fallback with ADHD-tuned pacing & warm tone
 * - Mobile & Desktop Autoplay Unlock (iOS Safari / Chrome AudioContext & touch unlock)
 * - Seamless Backward Compatibility for all existing methods
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.speechEnabled = true;
    this.masterVolume = 1.0;
    this.sfxVolume = 0.85;
    this.voiceVolume = 1.0;

    // Web Speech API
    this.synth = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
    this.speechVoice = null;

    // Playback state
    this.currentVoiceAudio = null;
    this.activeLoops = new Map();
    this.sfxCache = new Map();
    this.voiceCache = new Map();
    this.lastVoiceIdx = {};
    this.unlocked = false;

    // 25 Sound Effects Manifest
    this.sfxDefs = {
      '01_tap': {
        url: '/assets/button sounds/01_hub_standard_button_tap.mp3',
        fallback: () => this.synthPop(600)
      },
      '02_transition': {
        url: '/assets/button sounds/02_hub_menu_transition.mp3',
        fallback: () => this.synthWhoosh()
      },
      '03_radar': {
        url: '/assets/button sounds/03_hub_radar_mission_pulse.mp3',
        fallback: () => this.synthGentleChime()
      },
      '04_profile_switch': {
        url: '/assets/button sounds/04_hub_eject_seat_profile_switch.mp3',
        fallback: () => this.synthWhoosh()
      },
      '05_avatar_tock': {
        url: '/assets/button sounds/05_hub_avatar_selection_tock.mp3',
        fallback: () => this.synthWheelTick()
      },
      '06_step_complete': {
        url: '/assets/button sounds/06_task_micro_step_complete.mp3',
        fallback: () => this.synthStarDing()
      },
      '07_star_earned': {
        url: '/assets/button sounds/07_task_local_progress_star_earned.mp3',
        fallback: () => this.synthStarDing()
      },
      '08_pause': {
        url: '/assets/button sounds/08_task_pause_tape_stop.mp3',
        fallback: () => this.synthWhoosh()
      },
      '09_ar_activated': {
        url: '/assets/button sounds/09_task_ar_guide_activated.mp3',
        fallback: () => this.synthGentleChime()
      },
      '10_self_assessment': {
        url: '/assets/button sounds/10_task_self_assessment_trigger.mp3',
        fallback: () => this.synthGentleChime()
      },
      '11_help_hum': {
        url: '/assets/button sounds/11_sos_backup_button_help_hum.mp3',
        fallback: () => this.synthHum()
      },
      '12_parent_response': {
        url: '/assets/button sounds/12_sos_parent_response_received.mp3',
        fallback: () => this.synthGentleChime()
      },
      '13_skip': {
        url: '/assets/button sounds/13_sos_skip_for_now.mp3',
        fallback: () => this.synthWhoosh()
      },
      '14_shutter': {
        url: '/assets/button sounds/14_photo_camera_shutter.mp3',
        fallback: () => this.synthPop(850)
      },
      '15_stars_pack': {
        url: '/assets/button sounds/15_photo_stars_pack_into_capsule.mp3',
        fallback: () => this.synthStarDing()
      },
      '16_capsule_launch': {
        url: '/assets/button sounds/16_photo_star_capsule_launch.mp3',
        fallback: () => this.synthWhoosh()
      },
      '17_parent_approved': {
        url: '/assets/button sounds/17_photo_parent_approved_capsule_opens.mp3',
        fallback: () => this.synthFanfare()
      },
      '18_perk_buy': {
        url: '/assets/button sounds/18_economy_buy_perk_escrow.mp3',
        fallback: () => this.synthStarDing()
      },
      '19_escrow_loop': {
        url: '/assets/button sounds/19_economy_escrow_orbiting_loop.mp3',
        fallback: () => this.synthGentleChime()
      },
      '20_commanders_key': {
        url: '/assets/button sounds/20_economy_commanders_key_reward_claimed.mp3',
        fallback: () => this.synthFanfare()
      },
      '21_empty_bank': {
        url: '/assets/button sounds/21_economy_goal_tracker_empty_bank.mp3',
        fallback: () => this.synthBuzzer()
      },
      '22_needs_fixing': {
        url: '/assets/button sounds/22_error_needs_fixing_parent_denial.mp3',
        fallback: () => this.synthBuzzer()
      },
      '23_comms_down': {
        url: '/assets/button sounds/23_error_comms_down_no_internet.mp3',
        fallback: () => this.synthBuzzer()
      },
      '24_camera_blocked': {
        url: '/assets/button sounds/24_error_camera_blocked_permissions.mp3',
        fallback: () => this.synthBuzzer()
      },
      '25_target_lost': {
        url: '/assets/button sounds/25_error_qr_target_lost_sonar_loop.mp3',
        fallback: () => this.synthBuzzer()
      }
    };

    // Authentic Popo Voice Categories & Clips
    this.voiceCategories = {
      splash: [
        {
          url: encodeURI('/assets/mascot narrations/splash screen voice/Hiii, little helpers! I\'m Popo, your space buddy! Ready to make chores fun.mp3'),
          text: "Hiii, little helpers! I'm Popo, your space buddy! Ready to make chores fun."
        }
      ],
      start_task: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/when starting a task/Hi, little star! Let\'s Finish these mission\'s together!.mp3'),
          text: "Hi, little star! Let's finish these missions together!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/when starting a task/Ready, helper I believe in you!.mp3'),
          text: "Ready helper, I believe in you!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/when starting a task/You don\'t have to do everything at once. One little step is enough!.mp3'),
          text: "You don't have to do everything at once. One little step is enough!"
        }
      ],
      step_complete: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When a step is completed/Great job! You finished that step!.mp3'),
          text: "Great job! You finished that step!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When a step is completed/Hooray! You\'re making progress!.mp3'),
          text: "Hooray! You're making progress!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When a step is completed/Nice work! Let\'s keep going!.mp3'),
          text: "Nice work! Let's keep going!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When a step is completed/You did it! One star for you!.mp3'),
          text: "You did it! One star for you!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When a step is completed/another version/Amazing effort! Look how far you\'ve come!.mp3'),
          text: "Amazing effort! Look how far you've come!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When a step is completed/another version/Yay! Another little step completed!.mp3'),
          text: "Yay! Another little step completed!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When a step is completed/another version/You did it! You earned a star!.mp3'),
          text: "You did it! You earned a star!"
        }
      ],
      next_step: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the next step appears/Here we go! Let\'s try this together!.mp3'),
          text: "Here we go! Let's try this together!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the next step appears/One step at a time. You\'ve got this!.mp3'),
          text: "One step at a time. You've got this!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the next step appears/Ready for one more little step.mp3'),
          text: "Ready for one more little step."
        }
      ],
      doing_task: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child is doing the task/Look at you trying! That\'s wonderful!.mp3'),
          text: "Look at you trying! That's wonderful!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child is doing the task/One step at a time. You\'ve got this!.mp3'),
          text: "One step at a time. You've got this!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child is doing the task/You\'re doing great! Keep going at your own pace!.mp3'),
          text: "You're doing great! Keep going at your own pace!"
        }
      ],
      help: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child asks for help/It\'s okay to ask for help. Let\'s try it together..mp3'),
          text: "It's okay to ask for help. Let's try it together."
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child taps Need Help/Let\'s open our helper view and see what to do..mp3'),
          text: "Let's open our helper view and see what to do."
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child taps Need Help/Need a little help That\'s okay! Let\'s look together..mp3'),
          text: "Need a little help? That's okay! Let's look together."
        }
      ],
      stuck: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child feels Stuck/It\'s okay! Let\'s try it together..mp3'),
          text: "It's okay! Let's try it together."
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child feels Stuck/Take a little break if you need one..mp3'),
          text: "Take a little break if you need one."
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child feels Stuck/You can listen again. There\'s no rush!.mp3'),
          text: "You can listen again. There's no rush!"
        }
      ],
      more_time: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child needs more time/Let\'s try listening one more time..mp3'),
          text: "Let's try listening one more time."
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child needs more time/No rush! I\'m right here..mp3'),
          text: "No rush! I'm right here."
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child needs more time/That\'s okay. Take your time..mp3'),
          text: "That's okay. Take your time."
        }
      ],
      replay: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child taps Replay/Let\'s watch Popo one more time!.mp3'),
          text: "Let's watch Popo one more time!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child taps Replay/Of course! Let\'s try that again..mp3'),
          text: "Of course! Let's try that again."
        }
      ],
      complete_all: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child completes all five steps/Wow! You finished all five steps! Look at all your stars!.mp3'),
          text: "Wow! You finished all five steps! Look at all your stars!"
        },
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child completes all five steps/You worked hard, one step at a time. I\'m proud of your effort!.mp3'),
          text: "You worked hard, one step at a time. I'm proud of your effort!"
        }
      ],
      photo_sent: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When a photo is sent/Your picture has been sent to your parent. Let\'s wait for them to check..mp3'),
          text: "Your picture has been sent to your parent. Let's wait for them to check."
        }
      ],
      parent_approved: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the parent approves/Your parent approved your chore! Hooray! You earned all your stars!.mp3'),
          text: "Your parent approved your chore! Hooray! You earned all your stars!"
        }
      ],
      finish_for_now: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child finishes for now/You did some great helping today! Every little step counts. See you next time, space helper!.mp3'),
          text: "You did some great helping today! Every little step counts. See you next time, space helper!"
        }
      ],
      room_check_no: [
        {
          url: encodeURI('/assets/mascot narrations/Reusable voice/When the child says No at the room check/That\'s okay! We can do a little more together. Let\'s pick one small thing..mp3'),
          text: "That's okay! We can do a little more together. Let's pick one small thing."
        }
      ]
    };

    // Aliases to make playVoice developer-friendly
    this.voiceAliases = {
      welcome: 'splash',
      intro: 'splash',
      start: 'start_task',
      task_start: 'start_task',
      starting_task: 'start_task',
      step: 'step_complete',
      step_completed: 'step_complete',
      step_finished: 'step_complete',
      next: 'next_step',
      step_next: 'next_step',
      doing: 'doing_task',
      in_progress: 'doing_task',
      progress: 'doing_task',
      encourage: 'doing_task',
      encouragement: 'doing_task',
      need_help: 'help',
      ask_help: 'help',
      sos: 'help',
      child_stuck: 'stuck',
      time: 'more_time',
      need_more_time: 'more_time',
      watch_again: 'replay',
      listen_again: 'replay',
      replay_step: 'replay',
      task_complete: 'complete_all',
      mission_complete: 'complete_all',
      all_steps_complete: 'complete_all',
      five_steps_complete: 'complete_all',
      photo: 'photo_sent',
      proof_sent: 'photo_sent',
      approved: 'parent_approved',
      stars_approved: 'parent_approved',
      done_for_now: 'finish_for_now',
      finished_for_now: 'finish_for_now',
      save_for_later: 'finish_for_now',
      not_clean: 'room_check_no',
      room_no: 'room_check_no',
      try_again: 'room_check_no'
    };

    // Mobile / Desktop Autoplay Unlock
    this.initUserUnlock();

    // Browser preloading
    if (typeof window !== 'undefined') {
      // Warm up voices when ready
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.updateSpeechVoice();
      }
      this.updateSpeechVoice();
      setTimeout(() => this.preload(), 300);
    }
  }

  // --- AUDIO INITIALIZATION & USER INTERACTION UNLOCK ---
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch (e) {
          console.warn('[SoundEngine] AudioContext init error:', e);
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  initUserUnlock() {
    if (this.unlocked || typeof window === 'undefined') return;

    const unlock = () => {
      this.unlocked = true;
      this.init();

      // Mobile Safari / Chrome touch unlock
      try {
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        silentAudio.volume = 0.001;
        const p = silentAudio.play();
        if (p && p.then) {
          p.then(() => silentAudio.pause()).catch(() => {});
        }
      } catch (_) {}

      const events = ['pointerdown', 'touchstart', 'click', 'keydown'];
      events.forEach(evt => {
        window.removeEventListener(evt, unlock, { capture: true });
      });
    };

    const events = ['pointerdown', 'touchstart', 'click', 'keydown'];
    events.forEach(evt => {
      window.addEventListener(evt, unlock, { capture: true, once: true });
    });
  }

  // Preload sound effects into memory for instantaneous response
  preload() {
    if (typeof Audio === 'undefined') return;

    // Preload SFX
    Object.keys(this.sfxDefs).forEach(key => {
      if (this.sfxCache.has(key)) return;
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = this.sfxDefs[key].url;
        this.sfxCache.set(key, audio);
      } catch (_) {}
    });

    // Preload essential voice tracks
    const priorityCategories = ['splash', 'start_task', 'step_complete', 'next_step', 'help'];
    priorityCategories.forEach(cat => {
      const tracks = this.voiceCategories[cat] || [];
      tracks.forEach(t => {
        if (this.voiceCache.has(t.url)) return;
        try {
          const a = new Audio();
          a.preload = 'auto';
          a.src = t.url;
          this.voiceCache.set(t.url, a);
        } catch (_) {}
      });
    });
  }

  // --- AUDIO CONTROLS & STATE ---
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopVoice();
      this.stopAllLoops();
    }
    return this.muted;
  }

  setMuted(val) {
    this.muted = Boolean(val);
    if (this.muted) {
      this.stopVoice();
      this.stopAllLoops();
    }
    return this.muted;
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, Number(val) || 0));
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(val) || 0));
  }

  setVoiceVolume(val) {
    this.voiceVolume = Math.max(0, Math.min(1, Number(val) || 0));
  }

  // --- PLAYBACK ENGINE ---
  playSfx(key, options = {}) {
    if (this.muted) return null;
    this.init();

    const def = this.sfxDefs[key];
    if (!def) {
      console.warn(`[SoundEngine] Unknown SFX key: "${key}"`);
      return null;
    }

    const isLoop = Boolean(options.loop);
    const volume = options.volume !== undefined ? options.volume : this.sfxVolume;

    // In non-browser / headless tests
    if (typeof Audio === 'undefined') {
      if (typeof def.fallback === 'function') def.fallback();
      return null;
    }

    try {
      let audio = null;
      const cached = this.sfxCache.get(key);

      if (isLoop) {
        audio = new Audio(def.url);
        audio.loop = true;
        this.activeLoops.set(key, audio);
      } else if (cached && cached.paused && cached.currentTime === 0) {
        audio = cached;
      } else if (cached) {
        audio = cached.cloneNode();
      } else {
        audio = new Audio(def.url);
        this.sfxCache.set(key, audio);
      }

      audio.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
      audio.currentTime = 0;

      const p = audio.play();
      if (p !== undefined && p.catch) {
        p.catch(err => {
          // If browser policy or file fetch failed, fallback to synth
          if (!isLoop && typeof def.fallback === 'function') {
            def.fallback();
          }
        });
      }

      return audio;
    } catch (e) {
      if (!isLoop && typeof def.fallback === 'function') {
        def.fallback();
      }
      return null;
    }
  }

  stopSfx(key) {
    if (this.activeLoops.has(key)) {
      const audio = this.activeLoops.get(key);
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
      this.activeLoops.delete(key);
    }
  }

  stopAllLoops() {
    this.activeLoops.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    });
    this.activeLoops.clear();
  }

  // Helper to resolve category alias
  resolveCategory(category) {
    const raw = String(category || '').toLowerCase().trim().replace(/[-\s]/g, '_');
    return this.voiceAliases[raw] || raw;
  }

  // Pick track from category with smart variation (non-repeating index)
  getCategoryTrack(category) {
    const key = this.resolveCategory(category);
    const tracks = this.voiceCategories[key];
    if (!tracks || tracks.length === 0) return null;

    if (tracks.length === 1) return tracks[0];

    const last = this.lastVoiceIdx[key];
    let nextIdx;
    let attempts = 0;
    do {
      nextIdx = Math.floor(Math.random() * tracks.length);
      attempts++;
    } while (nextIdx === last && tracks.length > 1 && attempts < 10);

    this.lastVoiceIdx[key] = nextIdx;
    return tracks[nextIdx];
  }

  // Authentic Popo Voiceover Player with Fallback to Web Speech
  playVoice(category, onEnd) {
    if (this.muted || !this.speechEnabled) {
      if (typeof onEnd === 'function') onEnd();
      return null;
    }

    this.stopVoice();

    const track = this.getCategoryTrack(category);
    if (!track) {
      console.warn(`[SoundEngine] Unknown voice category: "${category}"`);
      if (typeof onEnd === 'function') onEnd();
      return null;
    }

    // In environments without Audio element
    if (typeof Audio === 'undefined') {
      this.speak(track.text, onEnd);
      return null;
    }

    try {
      const audio = new Audio(track.url);
      audio.volume = Math.max(0, Math.min(1, this.voiceVolume * this.masterVolume));
      this.currentVoiceAudio = audio;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (this.currentVoiceAudio === audio) {
          this.currentVoiceAudio = null;
        }
        if (typeof onEnd === 'function') onEnd();
      };

      audio.onended = finish;
      audio.onerror = () => {
        finish();
        this.speak(track.text, onEnd);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined && playPromise.catch) {
        playPromise.catch(() => {
          finish();
          this.speak(track.text, onEnd);
        });
      }

      return audio;
    } catch (e) {
      this.speak(track.text, onEnd);
      return null;
    }
  }

  stopVoice() {
    if (this.currentVoiceAudio) {
      try {
        this.currentVoiceAudio.pause();
        this.currentVoiceAudio.currentTime = 0;
      } catch (_) {}
      this.currentVoiceAudio = null;
    }
    this.stopSpeech();
  }

  // --- DEDICATED SFX METHODS (25 MP3 SOUND EFFECTS) ---

  // 01 - Standard Tap
  playButtonTap() { return this.playSfx('01_tap'); }
  playStandardTap() { return this.playButtonTap(); }

  // 02 - Menu Transition
  playMenuTransition() { return this.playSfx('02_transition'); }
  playTransition() { return this.playMenuTransition(); }

  // 03 - Radar Mission Pulse
  playRadarPulse() { return this.playSfx('03_radar'); }
  playMissionPulse() { return this.playRadarPulse(); }

  // 04 - Eject Seat / Profile Switch
  playProfileSwitch() { return this.playSfx('04_profile_switch'); }
  playEjectSeat() { return this.playProfileSwitch(); }

  // 05 - Avatar Selection Tock
  playAvatarTock() { return this.playSfx('05_avatar_tock'); }
  playAvatarSelection() { return this.playAvatarTock(); }
  playTock() { return this.playAvatarTock(); }

  // 06 - Micro-Step Complete
  playMicroStepComplete() { return this.playSfx('06_step_complete'); }
  playStepComplete() { return this.playMicroStepComplete(); }

  // 07 - Local Progress Star Earned
  playStarEarned() { return this.playSfx('07_star_earned'); }
  playLocalProgressStar() { return this.playStarEarned(); }

  // 08 - Pause / Tape Stop
  playPause() { return this.playSfx('08_pause'); }
  playTapeStop() { return this.playPause(); }

  // 09 - AR Guide Activated
  playARActivated() { return this.playSfx('09_ar_activated'); }
  playARGuide() { return this.playARActivated(); }
  playARGuideActivated() { return this.playARActivated(); }

  // 10 - Self-Assessment Trigger
  playSelfAssessment() { return this.playSfx('10_self_assessment'); }
  playSelfAssessmentTrigger() { return this.playSelfAssessment(); }

  // 11 - SOS Backup Button Help Hum
  playHelpHum() { return this.playSfx('11_help_hum'); }
  playBackupButton() { return this.playHelpHum(); }
  playBackupButtonHelp() { return this.playHelpHum(); }

  // 12 - SOS Parent Response Received
  playParentResponse() { return this.playSfx('12_parent_response'); }
  playParentResponseReceived() { return this.playParentResponse(); }

  // 13 - SOS Skip For Now
  playSkip() { return this.playSfx('13_skip'); }
  playSkipForNow() { return this.playSkip(); }

  // 14 - Photo Camera Shutter
  playCameraShutter() { return this.playSfx('14_shutter'); }
  playShutter() { return this.playCameraShutter(); }

  // 15 - Stars Pack Into Capsule
  playCapsulePack() { return this.playSfx('15_stars_pack'); }
  playStarsPack() { return this.playCapsulePack(); }
  playStarsPackIntoCapsule() { return this.playCapsulePack(); }

  // 16 - Star Capsule Launch
  playCapsuleLaunch() { return this.playSfx('16_capsule_launch'); }
  playStarCapsuleLaunch() { return this.playCapsuleLaunch(); }

  // 17 - Parent Approved Capsule Opens
  playParentApproved() { return this.playSfx('17_parent_approved'); }
  playCapsuleOpens() { return this.playParentApproved(); }
  playParentApprovedCapsuleOpens() { return this.playParentApproved(); }

  // 18 - Buy Perk Escrow
  playPerkBuy() { return this.playSfx('18_perk_buy'); }
  playBuyPerk() { return this.playPerkBuy(); }
  playBuyPerkEscrow() { return this.playPerkBuy(); }

  // 19 - Escrow Orbiting Loop
  playEscrowLoop() { return this.playSfx('19_escrow_loop', { loop: true }); }
  playEscrowOrbit() { return this.playEscrowLoop(); }
  stopEscrowLoop() { this.stopSfx('19_escrow_loop'); }

  // 20 - Commander's Key Reward Claimed
  playKeyClaimed() { return this.playSfx('20_commanders_key'); }
  playCommandersKey() { return this.playKeyClaimed(); }
  playCommandersKeyClaimed() { return this.playKeyClaimed(); }

  // 21 - Goal Tracker Empty Bank
  playEmptyBank() { return this.playSfx('21_empty_bank'); }
  playGoalTrackerEmpty() { return this.playEmptyBank(); }
  playGoalTrackerEmptyBank() { return this.playEmptyBank(); }

  // 22 - Needs Fixing / Parent Denial
  playNeedsFixing() { return this.playSfx('22_needs_fixing'); }
  playParentDenial() { return this.playNeedsFixing(); }
  playErrorNeedsFixing() { return this.playNeedsFixing(); }

  // 23 - Comms Down / No Internet
  playCommsDown() { return this.playSfx('23_comms_down'); }
  playNoInternet() { return this.playCommsDown(); }
  playErrorCommsDown() { return this.playCommsDown(); }

  // 24 - Camera Blocked / Permissions
  playCameraBlocked() { return this.playSfx('24_camera_blocked'); }
  playCameraPermission() { return this.playCameraBlocked(); }
  playErrorCameraBlocked() { return this.playCameraBlocked(); }

  // 25 - QR Target Lost Sonar Loop
  playTargetLost() { return this.playSfx('25_target_lost', { loop: true }); }
  playQrTargetLost() { return this.playTargetLost(); }
  playErrorTargetLost() { return this.playTargetLost(); }
  stopTargetLostLoop() { this.stopSfx('25_target_lost'); }

  // Generic Error & Success Aliases
  playError() { return this.playNeedsFixing(); }
  playSuccess() { return this.playStarEarned(); }

  // --- BACKWARD-COMPATIBLE METHODS ---

  // Play satisfying Star Ding (Twin harmonic bell)
  playStarDing() {
    const audio = this.playStarEarned();
    if (!audio) this.synthStarDing();
    return audio;
  }

  // Play gentle pop sound (Bubble Arcade & Button interactions)
  playPop(freq) {
    if (this.muted) return;
    // When a custom frequency is supplied (such as dynamic pitch in bubbleArcade.js),
    // synthesize the custom pitch ramp for tactile responsiveness
    if (freq !== undefined && freq !== null && freq !== 600) {
      this.synthPop(freq);
      return;
    }
    const audio = this.playButtonTap();
    if (!audio) this.synthPop(600);
    return audio;
  }

  // Play whoosh / step transition
  playWhoosh() {
    const audio = this.playMenuTransition();
    if (!audio) this.synthWhoosh();
    return audio;
  }

  // Play Roulette Wheel tick sound
  playWheelTick() {
    const audio = this.playAvatarTock();
    if (!audio) this.synthWheelTick();
    return audio;
  }

  // Gentle two-note chime (welcome back / soft prompts)
  playGentleChime() {
    this.synthGentleChime();
  }

  // Play triumphant mission fanfare!
  playFanfare() {
    const audio = this.playKeyClaimed();
    if (!audio) this.synthFanfare();
    return audio;
  }

  // --- WEB AUDIO API REAL-TIME SYNTHESIZERS (ZERO-ASSET FALLBACKS) ---

  synthStarDing() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, t); // A5
      osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.3); // A6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, t); // E6
      osc2.frequency.exponentialRampToValueAtTime(2640, t + 0.3);

      gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.45);
      osc2.stop(t + 0.45);
    } catch (_) {}
  }

  synthPop(freq = 600) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.08);

      gain.gain.setValueAtTime(0.22 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch (_) {}
  }

  synthWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.18);

      gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch (_) {}
  }

  synthWheelTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, t);
      gain.gain.setValueAtTime(0.08 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.03);
    } catch (_) {}
  }

  synthGentleChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      [523.25, 659.25].forEach((f, i) => {
        const t = this.ctx.currentTime + i * 0.18;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.15 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
      });
    } catch (_) {}
  }

  synthFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.15 }, // G5
        { f: 1046.50, d: 0.4 }  // C6
      ];

      let start = this.ctx.currentTime;
      for (const n of notes) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, start);

        gain.gain.setValueAtTime(0.2 * this.masterVolume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + n.d);
        start += n.d * 0.9;
      }
    } catch (_) {}
  }

  synthBuzzer() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.setValueAtTime(110, t + 0.1);

      gain.gain.setValueAtTime(0.15 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    } catch (_) {}
  }

  synthHum() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);

      gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (_) {}
  }

  // --- WEB SPEECH API VOICEOVER FALLBACK ---

  updateSpeechVoice() {
    if (!this.synth || typeof window === 'undefined') return;
    try {
      const voices = this.synth.getVoices() || [];
      const friendlyVoice = voices.find(v => (
        v.lang && v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('Karen'))
      ));
      if (friendlyVoice) {
        this.speechVoice = friendlyVoice;
      }
    } catch (_) {}
  }

  speak(text, onEnd) {
    if (!this.synth || !this.speechEnabled || this.muted) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // ADHD friendly calm cadence
      utterance.pitch = 1.25; // Friendly, warm cosmic buddy pitch
      utterance.volume = Math.max(0, Math.min(1, this.voiceVolume * this.masterVolume));

      if (this.speechVoice) {
        utterance.voice = this.speechVoice;
      } else {
        this.updateSpeechVoice();
        if (this.speechVoice) utterance.voice = this.speechVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('[SoundEngine] SpeechSynthesis error:', e);
      if (typeof onEnd === 'function') onEnd();
    }
  }

  stopSpeech() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (_) {}
    }
  }
}

// Global Browser Instance & Node Export
if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
  window.sounds = new SoundEngine();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundEngine;
}
