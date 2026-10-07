/**
 * SAYI & İSİM TAHMİN OYUNU - CORE APPLICATION LOGIC
 * Audio Engine, Confetti System, Timer, Score Management, Mystery Name & Last-Life Options
 */

// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================

const DIFFICULTIES = {
  easy: { name: 'Kolay', min: 1, max: 50, lives: 10, time: 60 },
  medium: { name: 'Orta', min: 1, max: 100, lives: 7, time: 45 },
  hard: { name: 'Zor', min: 1, max: 200, lives: 5, time: 30 }
};

// Zengin Gizli İsim Veri Tabanı
const MYSTERY_NAMES_DB = [
  { name: 'ALBERT EINSTEIN', category: '🔬 Bilim İnsanı', clue: 'Görelilik teorisini ortaya koyan dahi fizikçi.' },
  { name: 'ISAAC NEWTON', category: '🔬 Bilim İnsanı', clue: 'Başına elma düşmesiyle yerçekimini keşfettiği söylenen bilgin.' },
  { name: 'NIKOLA TESLA', category: '⚡ Mucit', clue: 'Alternatif akım ve kablosuz elektrik teknolojilerinin öncüsü.' },
  { name: 'AZIZ SANCAR', category: '🧬 Bilim İnsanı', clue: 'DNA onarımı çalışmasıyla Nobel Kimya Ödülü kazanan Türk bilim insanı.' },
  { name: 'MARIE CURIE', category: '☢️ Fizikçi & Kimyager', clue: 'Radyoaktiviteyi keşfeden, 2 farklı alanda Nobel alan ilk kadın.' },
  { name: 'GALILEO GALILEI', category: '🔭 Astronom', clue: 'Teleskopla Jüpiter uydularını keşfeden modern bilimin babası.' },
  { name: 'MUSTAFA KEMAL ATATURK', category: '🌟 Tarihi Lider', clue: 'Türkiye Cumhuriyeti\'nin kurucusu ve ilk Cumhurbaşkanı.' },
  { name: 'FATIH SULTAN MEHMET', category: '👑 Hükümdar', clue: '1453 yılında 21 yaşında İstanbul\'u fetheden padişah.' },
  { name: 'MEVLANA', category: '📜 Düşünür & Şair', clue: 'Sevgi, hoşgörü ve "Ne olursan ol yine gel" sözüyle bilinen mutasavvıf.' },
  { name: 'BARIS MANCO', category: '🎸 Müzisyen', clue: 'Gülpembe, Arkadaşım Eşşek şarkıları ve 7\'den 77\'ye programının efsanesi.' },
  { name: 'NESET ERTAS', category: '🪕 Halk Ozanı', clue: '"Bozkırın Tezenesi" ve Gönül Dağı türküsünün unutulmaz ustası.' },
  { name: 'LEONARDO DA VINCI', category: '🎨 Rönesans Dehası', clue: 'Mona Lisa ve Son Akşam Yemeği tablolarını yapan polimat sanatçı.' },
  { name: 'LUDWIG VAN BEETHOVEN', category: '🎼 Besteci', clue: 'İşitme duyusunu kaybetmesine rağmen 9. Senfoniyi besteleyen müzik dehası.' },
  { name: 'PABLO PICASSO', category: '🖌️ Ressam', clue: 'Guernica tablosu ve Kübizm akımının dünyaca ünlü öncüsü.' },
  { name: 'NAZIM HIKMET', category: '📖 Şair', clue: 'Kuvâyi Milliye Destanı ve Ran soyadıyla tanınan büyük Türk şairi.' },
  { name: 'YASAR KEMAL', category: '📚 Yazar', clue: 'Toros Dağları ve Çukurova\'yı anlatan İnce Memed romanının yazarı.' }
];

let currentDiffKey = 'medium';
let secretNumber = 0;
let remainingLives = 7;
let maxLives = 7;
let guessesCount = 0;
let currentMinRange = 1;
let currentMaxRange = 100;
let guessHistory = [];
let isGameOver = false;
let soundEnabled = true;

// Oyuncu Profili & Kişiselleştirme (Asaf)
let playerName = 'Asaf';
let currentRankTitle = '🌱 Çaylak Tahminci';

// Liderlik Tablosu Verisi
const DEFAULT_LEADERBOARD = [
  { id: '1', name: 'Asaf', score: 160, diff: 'hard', date: 'Bugün', rankTitle: '🌌 Kozmik Deha' },
  { id: '2', name: 'Ece Demir', score: 100, diff: 'medium', date: 'Dün', rankTitle: '👑 Altın Şampiyon' },
  { id: '3', name: 'Barış Kaya', score: 70, diff: 'medium', date: '2 gün önce', rankTitle: '👑 Altın Şampiyon' },
  { id: '4', name: 'Can Özkan', score: 40, diff: 'easy', date: '3 gün önce', rankTitle: '⚡ Usta Tahminci' },
  { id: '5', name: 'Zeynep Yıldız', score: 20, diff: 'easy', date: '1 hafta önce', rankTitle: '🌱 Çaylak Tahminci' }
];
let leaderboard = [];

// Puan & Zamanlayıcı Durumu
let totalScore = 0;
let roundEarnedPoints = 0;
let timeLeft = 45;
let maxTime = 45;
let timerInterval = null;

// Gizli İsim Durumu
let currentMystery = null;
let revealedLetters = [];
let isNameGuessed = false;

// High scores storage
let highScores = {
  easy: null,
  medium: null,
  hard: null
};

// ==========================================
// 2. AUDIO SYNTHESIZER (Web Audio API)
// ==========================================

class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  click() {
    this.playTone(600, 'sine', 0.05, 0.05);
  }

  tick() {
    this.playTone(750, 'triangle', 0.04, 0.04);
  }

  higher() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  lower() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  fire() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(650, now + 0.08);
    osc.frequency.linearRampToValueAtTime(450, now + 0.16);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  lastLifeAlert() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [
      { f: 880, d: 0.1, t: 0.0 },
      { f: 440, d: 0.1, t: 0.12 },
      { f: 880, d: 0.15, t: 0.24 }
    ];
    notes.forEach(n => {
      setTimeout(() => this.playTone(n.f, 'sawtooth', n.d, 0.12), n.t * 1000);
    });
  }

  error() {
    this.playTone(180, 'sawtooth', 0.22, 0.12);
  }

  scoreUp() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [
      { f: 523.25, d: 0.08, t: 0.0 },   // C5
      { f: 659.25, d: 0.08, t: 0.08 },  // E5
      { f: 783.99, d: 0.12, t: 0.16 },  // G5
      { f: 1046.50, d: 0.25, t: 0.24 }  // C6
    ];
    notes.forEach(n => {
      setTimeout(() => this.playTone(n.f, 'sine', n.d, 0.14), n.t * 1000);
    });
  }

  balloonPop() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  fanfare() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [
      { f: 523.25, d: 0.1, t: 0.0 },   // C5
      { f: 523.25, d: 0.1, t: 0.11 },  // C5
      { f: 523.25, d: 0.1, t: 0.22 },  // C5
      { f: 659.25, d: 0.22, t: 0.33 }, // E5
      { f: 783.99, d: 0.18, t: 0.58 }, // G5
      { f: 1046.50, d: 0.45, t: 0.78 } // C6
    ];
    notes.forEach(n => {
      setTimeout(() => this.playTone(n.f, 'triangle', n.d, 0.15), n.t * 1000);
    });
  }

  win() {
    this.fanfare();
  }

  gameOver() {
    if (!soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [
      { f: 380, d: 0.15, t: 0.0 },
      { f: 340, d: 0.15, t: 0.15 },
      { f: 290, d: 0.35, t: 0.30 }
    ];
    notes.forEach(n => {
      setTimeout(() => this.playTone(n.f, 'sawtooth', n.d, 0.08), n.t * 1000);
    });
  }
}

const sound = new SoundEngine();

// ==========================================
// 3. CANVAS CONFETTI ENGINE
// ==========================================

class ConfettiEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 90) {
    if (!this.ctx) return;
    this.resize();
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ffffff'];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() * 80 - 40),
        y: this.canvas.height * 0.45 + (Math.random() * 40 - 20),
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.85) * 18 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.45,
        opacity: 1,
        drag: 0.985
      });
    }

    if (!this.animId) {
      this.render();
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.007;

      if (p.opacity <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.render());
    } else {
      this.animId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  megaBurst() {
    this.burst(80);
    setTimeout(() => {
      if (!this.ctx) return;
      const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ffffff', '#fbbf24'];
      // Sol kanat fırlatması
      for (let i = 0; i < 45; i++) {
        this.particles.push({
          x: 40,
          y: this.canvas.height * 0.75,
          vx: Math.random() * 12 + 5,
          vy: -(Math.random() * 16 + 8),
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          gravity: 0.42,
          opacity: 1,
          drag: 0.985
        });
      }
      // Sağ kanat fırlatması
      for (let i = 0; i < 45; i++) {
        this.particles.push({
          x: this.canvas.width - 40,
          y: this.canvas.height * 0.75,
          vx: -(Math.random() * 12 + 5),
          vy: -(Math.random() * 16 + 8),
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          gravity: 0.42,
          opacity: 1,
          drag: 0.985
        });
      }
      if (!this.animId) this.render();
    }, 220);
  }
}

const confetti = new ConfettiEngine('confetti-canvas');

// ==========================================
// 3.1 VICTORY BALLOONS GENERATOR
// ==========================================

function spawnVictoryBalloons(count = 22) {
  const container = document.getElementById('balloons-container');
  if (!container) return;
  container.innerHTML = '';

  const balloonColors = [
    'linear-gradient(135deg, #f87171, #ef4444)',
    'linear-gradient(135deg, #fbbf24, #f59e0b)',
    'linear-gradient(135deg, #34d399, #10b981)',
    'linear-gradient(135deg, #38bdf8, #06b6d4)',
    'linear-gradient(135deg, #818cf8, #6366f1)',
    'linear-gradient(135deg, #f472b6, #ec4899)',
    'linear-gradient(135deg, #c084fc, #a855f7)'
  ];

  for (let i = 0; i < count; i++) {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';

    const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
    const leftPercent = (Math.random() * 88 + 5).toFixed(1);
    const sizeScale = (Math.random() * 0.45 + 0.85).toFixed(2);
    const riseDuration = (Math.random() * 2.8 + 4.8).toFixed(1);
    const swayDuration = (Math.random() * 1.5 + 2.2).toFixed(1);
    const delay = (Math.random() * 2.2).toFixed(2);

    balloon.style.background = color;
    balloon.style.left = `${leftPercent}%`;
    balloon.style.width = `${Math.round(58 * sizeScale)}px`;
    balloon.style.height = `${Math.round(74 * sizeScale)}px`;
    balloon.style.setProperty('--rise-duration', `${riseDuration}s`);
    balloon.style.setProperty('--sway-duration', `${swayDuration}s`);
    balloon.style.animationDelay = `${delay}s, 0s`;

    // İnteraktif Balon Patlatma!
    balloon.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.balloonPop();
      balloon.classList.add('popped');
      spawnScoreFloater(1, '🎈 Patlatıldı!');
      setTimeout(() => balloon.remove(), 250);
    });

    container.appendChild(balloon);

    // Otomatik temizleme
    setTimeout(() => {
      if (balloon && balloon.parentNode) {
        balloon.remove();
      }
    }, (parseFloat(riseDuration) + parseFloat(delay) + 1) * 1000);
  }
}

// ==========================================
// 3.2 DYNAMIC SCORE AMBIENT ICONS
// Skora göre arka planda değişen simgeler
// ==========================================

function updateScoreAmbientIcons(score = totalScore) {
  const container = document.getElementById('score-ambient-icons');
  if (!container) return;

  let icons = [];
  let rank = '🌱 Çaylak Tahminci';
  let avatar = '🎯';

  if (score >= 120) {
    icons = ['🏆', '🪐', '🌌', '🔱', '💥', '🛸', '👑', '💎', '🌠', '✨'];
    rank = '🌌 Kozmik Deha';
    avatar = '🔱';
  } else if (score >= 70) {
    icons = ['🥇', '👑', '🚀', '🌟', '💰', '🏆', '✨', '🎖️', '🔥'];
    rank = '👑 Altın Şampiyon';
    avatar = '👑';
  } else if (score >= 30) {
    icons = ['⚡', '🔥', '🥈', '💎', '🏹', '💫', '🌟', '🔮'];
    rank = '⚡ Usta Tahminci';
    avatar = '⚡';
  } else {
    icons = ['🌱', '🎲', '🪙', '⭐', '🎯', '🔢', '✨'];
    rank = '🌱 Çaylak Tahminci';
    avatar = '🎯';
  }

  currentRankTitle = rank;
  const nameDisplay = document.getElementById('player-name-display');
  const rankDisplay = document.getElementById('player-rank-display');
  const avatarIcon = document.getElementById('player-avatar-icon');

  if (nameDisplay) nameDisplay.textContent = playerName;
  if (rankDisplay) rankDisplay.textContent = rank;
  if (avatarIcon) avatarIcon.textContent = avatar;

  // 14 simgeyi ekrana yerleştir
  container.innerHTML = '';
  const count = 14;
  for (let i = 0; i < count; i++) {
    const iconEl = document.createElement('div');
    iconEl.className = 'ambient-score-icon';
    iconEl.textContent = icons[i % icons.length];

    const x = (i * (100 / count) + Math.random() * 4).toFixed(1);
    const y = (Math.random() * 85 + 5).toFixed(1);
    const driftX = (Math.random() * 60 - 30).toFixed(0);
    const driftY = (Math.random() * 60 - 30).toFixed(0);
    const duration = (Math.random() * 8 + 10).toFixed(1);
    const delay = (Math.random() * -10).toFixed(1);
    const size = (Math.random() * 0.9 + 1.6).toFixed(2);
    const opacity = (Math.random() * 0.16 + 0.12).toFixed(2);

    iconEl.style.left = `${x}%`;
    iconEl.style.top = `${y}%`;
    iconEl.style.setProperty('--drift-x', `${driftX}px`);
    iconEl.style.setProperty('--drift-y', `${driftY}px`);
    iconEl.style.setProperty('--float-duration', `${duration}s`);
    iconEl.style.animationDelay = `${delay}s`;
    iconEl.style.fontSize = `${size}rem`;
    iconEl.style.opacity = opacity;

    container.appendChild(iconEl);
  }
}

// ==========================================
// 4. DOM ELEMENTS
// ==========================================

const el = {
  // Score & Timer
  totalScoreVal: document.getElementById('total-score-val'),
  timerSection: document.getElementById('timer-section'),
  timerVal: document.getElementById('timer-val'),
  timerFill: document.getElementById('timer-fill'),
  floatingScoresContainer: document.getElementById('floating-scores-container'),
  scoreAmbientIcons: document.getElementById('score-ambient-icons'),
  balloonsContainer: document.getElementById('balloons-container'),

  // Player Profile Badge
  playerProfileBadge: document.getElementById('player-profile-badge'),
  playerAvatarIcon: document.getElementById('player-avatar-icon'),
  playerNameDisplay: document.getElementById('player-name-display'),
  playerRankDisplay: document.getElementById('player-rank-display'),
  playerEditBtn: document.getElementById('player-edit-btn'),

  // Diff buttons
  diffBtns: document.querySelectorAll('.diff-btn'),
  
  // Stats
  highScoreVal: document.getElementById('high-score-val'),
  guessCountVal: document.getElementById('guess-count-val'),
  livesCountText: document.getElementById('lives-count-text'),
  heartsContainer: document.getElementById('hearts-container'),
  livesProgressBar: document.getElementById('lives-progress-bar'),

  // Range tracker
  rangeMinBadge: document.getElementById('range-min-badge'),
  rangeMaxBadge: document.getElementById('range-max-badge'),
  rangeStatusText: document.getElementById('range-status-text'),
  rangeTrackFill: document.getElementById('range-track-fill'),

  // Last life panel & options
  lastLifePanel: document.getElementById('last-life-panel'),
  optionsGrid: document.getElementById('options-grid'),

  // Input
  guessForm: document.getElementById('guess-form'),
  guessInput: document.getElementById('guess-input'),
  inputWrapper: document.getElementById('input-wrapper'),
  btnDecrease: document.getElementById('btn-decrease'),
  btnIncrease: document.getElementById('btn-increase'),
  submitBtn: document.getElementById('submit-btn'),

  // Feedback
  feedbackCard: document.getElementById('feedback-card'),
  feedbackIcon: document.getElementById('feedback-icon'),
  feedbackTitle: document.getElementById('feedback-title'),
  feedbackDesc: document.getElementById('feedback-desc'),
  temperatureBadge: document.getElementById('temperature-badge'),
  tempIcon: document.getElementById('temp-icon'),
  tempText: document.getElementById('temp-text'),

  // Mystery Name elements
  mysteryNameCard: document.getElementById('mystery-name-card'),
  nameCategoryBadge: document.getElementById('name-category-badge'),
  nameClueText: document.getElementById('name-clue-text'),
  letterBoxesRow: document.getElementById('letter-boxes-row'),
  nameGuessForm: document.getElementById('name-guess-form'),
  nameInput: document.getElementById('name-input'),
  nameSubmitBtn: document.getElementById('name-submit-btn'),
  nameStatusFeedback: document.getElementById('name-status-feedback'),

  // History
  historyChips: document.getElementById('history-chips'),
  historyEmpty: document.getElementById('history-empty'),
  historyCount: document.getElementById('history-count'),

  // Footer / Reset
  restartGameBtn: document.getElementById('restart-game-btn'),

  // Header buttons
  soundBtn: document.getElementById('sound-btn'),
  soundIcon: document.getElementById('sound-icon'),
  helpBtn: document.getElementById('help-btn'),
  leaderboardBtn: document.getElementById('leaderboard-btn'),

  // End Game Modal
  endgameModal: document.getElementById('endgame-modal'),
  modalEmoji: document.getElementById('modal-emoji'),
  modalTitle: document.getElementById('modal-title'),
  modalSubtitle: document.getElementById('modal-subtitle'),
  modalSecretNumber: document.getElementById('modal-secret-number'),
  modalEarnedPoints: document.getElementById('modal-earned-points'),
  modalTotalScore: document.getElementById('modal-total-score'),
  modalSecretName: document.getElementById('modal-secret-name'),
  newRecordBanner: document.getElementById('new-record-banner'),
  modalPlayAgainBtn: document.getElementById('modal-play-again-btn'),
  modalLeaderboardBtn: document.getElementById('modal-leaderboard-btn'),

  // Leaderboard Modal
  leaderboardModal: document.getElementById('leaderboard-modal'),
  leaderboardList: document.getElementById('leaderboard-list'),
  lbTabs: document.querySelectorAll('.lb-tab'),
  lbAddCurrentBtn: document.getElementById('lb-add-current-btn'),
  lbResetBtn: document.getElementById('lb-reset-btn'),
  lbCloseBtn: document.getElementById('lb-close-btn'),

  // Player Name Edit Modal
  nameEditModal: document.getElementById('name-edit-modal'),
  editPlayerForm: document.getElementById('edit-player-form'),
  editPlayerInput: document.getElementById('edit-player-input'),
  savePlayerNameBtn: document.getElementById('save-player-name-btn'),
  cancelPlayerNameBtn: document.getElementById('cancel-player-name-btn'),

  // Help Modal
  helpModal: document.getElementById('help-modal'),
  helpCloseBtn: document.getElementById('help-close-btn')
};

// ==========================================
// 5. HELPER FUNCTIONS & STORAGE
// ==========================================

function loadLocalData() {
  try {
    const savedName = localStorage.getItem('number_guess_player_name');
    if (savedName && savedName.toLowerCase() !== 'hürmak') {
      playerName = savedName;
    } else {
      playerName = 'Asaf';
      localStorage.setItem('number_guess_player_name', 'Asaf');
    }
    const savedScores = localStorage.getItem('number_guess_highscores');
    if (savedScores) {
      highScores = JSON.parse(savedScores);
    }
    const savedTotalScore = localStorage.getItem('number_guess_total_score');
    if (savedTotalScore !== null) {
      totalScore = parseInt(savedTotalScore, 10) || 0;
    }
    const savedSound = localStorage.getItem('number_guess_sound');
    if (savedSound !== null) {
      soundEnabled = savedSound === 'true';
      updateSoundUI();
    }
    const savedLb = localStorage.getItem('number_guess_leaderboard_v1');
    if (savedLb) {
      leaderboard = JSON.parse(savedLb);
      // Eski kayıtlarda Hürmak varsa Asaf ile güncelle
      leaderboard.forEach(item => {
        if (item.name && item.name.toLowerCase() === 'hürmak') {
          item.name = 'Asaf';
        }
      });
      saveLeaderboard();
    } else {
      leaderboard = [...DEFAULT_LEADERBOARD];
      saveLeaderboard();
    }
  } catch (e) {
    console.warn('LocalStorage access blocked', e);
  }
}

function saveLocalData() {
  try {
    localStorage.setItem('number_guess_player_name', playerName);
    localStorage.setItem('number_guess_highscores', JSON.stringify(highScores));
    localStorage.setItem('number_guess_total_score', totalScore.toString());
    localStorage.setItem('number_guess_sound', soundEnabled.toString());
  } catch (e) {
    console.warn('LocalStorage write failed', e);
  }
}

function saveLeaderboard() {
  try {
    localStorage.setItem('number_guess_leaderboard_v1', JSON.stringify(leaderboard));
  } catch (e) {
    console.warn('Leaderboard save failed', e);
  }
}

function recordScore(name, score, diff = currentDiffKey) {
  if (!name) name = playerName || 'Asaf';
  
  const existingIdx = leaderboard.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
  const rankTitle = currentRankTitle || '🌱 Çaylak Tahminci';
  const entryDate = 'Bugün';

  if (existingIdx !== -1) {
    if (score >= leaderboard[existingIdx].score) {
      leaderboard[existingIdx].score = score;
      leaderboard[existingIdx].diff = diff;
      leaderboard[existingIdx].date = entryDate;
      leaderboard[existingIdx].rankTitle = rankTitle;
    }
  } else {
    leaderboard.push({
      id: Date.now().toString(),
      name,
      score,
      diff,
      date: entryDate,
      rankTitle
    });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 30) {
    leaderboard = leaderboard.slice(0, 30);
  }
  saveLeaderboard();
}

let currentLeaderboardFilter = 'all';

function renderLeaderboard(filter = currentLeaderboardFilter) {
  currentLeaderboardFilter = filter;
  if (!el.leaderboardList) return;

  el.lbTabs.forEach(tab => {
    if (tab.dataset.filter === filter) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  let filtered = [...leaderboard];
  if (filter !== 'all') {
    filtered = filtered.filter(item => item.diff === filter);
  }
  filtered.sort((a, b) => b.score - a.score);

  if (filtered.length === 0) {
    el.leaderboardList.innerHTML = '<div class="leaderboard-empty">Bu kategoride henüz kayıtlı skor yok.</div>';
    return;
  }

  el.leaderboardList.innerHTML = '';
  filtered.forEach((item, index) => {
    const isAsaf = item.name.toLowerCase() === 'asaf' || item.name.toLowerCase() === playerName.toLowerCase();
    const row = document.createElement('div');
    row.className = `leaderboard-item ${isAsaf ? 'is-asaf' : ''}`;

    let rankBadgeClass = 'rank-other';
    let rankEmoji = `${index + 1}`;
    if (index === 0) {
      rankBadgeClass = 'rank-1';
      rankEmoji = '🥇';
    } else if (index === 1) {
      rankBadgeClass = 'rank-2';
      rankEmoji = '🥈';
    } else if (index === 2) {
      rankBadgeClass = 'rank-3';
      rankEmoji = '🥉';
    }

    const diffNames = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
    const diffLabel = diffNames[item.diff] || 'Orta';
    const diffClass = `lb-diff-${item.diff || 'medium'}`;

    row.innerHTML = `
      <div class="lb-user-info">
        <div class="lb-rank-badge ${rankBadgeClass}">${rankEmoji}</div>
        <div class="lb-details">
          <div class="lb-name-row">
            <span class="lb-name">${escapeHtml(item.name)}</span>
            ${isAsaf ? '<span class="lb-special-tag">SEN 👑</span>' : ''}
          </div>
          <span class="lb-meta">${item.rankTitle || 'Tahminci'} • ${item.date || 'Yakınlarda'}</span>
        </div>
      </div>
      <div class="lb-score-col">
        <span class="lb-score-badge">${item.score} P</span>
        <span class="lb-diff-pill ${diffClass}">${diffLabel}</span>
      </div>
    `;
    el.leaderboardList.appendChild(row);
  });
}

function openLeaderboard() {
  sound.click();
  renderLeaderboard();
  el.leaderboardModal.classList.add('active');
  el.leaderboardModal.setAttribute('aria-hidden', 'false');
}

function closeLeaderboard() {
  el.leaderboardModal.classList.remove('active');
  el.leaderboardModal.setAttribute('aria-hidden', 'true');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updatePlayerName(newName) {
  if (!newName || !newName.trim()) return;
  playerName = newName.trim();
  saveLocalData();

  if (el.playerNameDisplay) el.playerNameDisplay.textContent = playerName;
  if (el.editPlayerInput) el.editPlayerInput.value = playerName;

  resetFeedbackDisplay();
  updateScoreAmbientIcons();
  recordScore(playerName, totalScore, currentDiffKey);
  renderLeaderboard();
  spawnScoreFloater(0, `👤 Hoş Geldin, ${playerName}!`);
}

function openNameEditModal() {
  sound.click();
  if (el.editPlayerInput) el.editPlayerInput.value = playerName;
  el.nameEditModal.classList.add('active');
  el.nameEditModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => el.editPlayerInput.focus(), 150);
}

function closeNameEditModal() {
  el.nameEditModal.classList.remove('active');
  el.nameEditModal.setAttribute('aria-hidden', 'true');
}

// ==========================================
// 6. TIMER ENGINE
// ==========================================

function startTimer() {
  stopTimer();
  maxTime = DIFFICULTIES[currentDiffKey].time;
  timeLeft = maxTime;
  updateTimerUI();

  timerInterval = setInterval(() => {
    if (isGameOver) {
      stopTimer();
      return;
    }

    timeLeft--;
    updateTimerUI();

    if (timeLeft <= 10 && timeLeft > 0) {
      sound.tick();
    }

    if (timeLeft <= 0) {
      stopTimer();
      handleTimeOut();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerUI() {
  el.timerVal.textContent = `${timeLeft}s`;
  const pct = Math.max(0, (timeLeft / maxTime) * 100);
  el.timerFill.style.width = `${pct}%`;

  if (timeLeft <= 10) {
    el.timerSection.classList.add('timer-warning');
  } else {
    el.timerSection.classList.remove('timer-warning');
  }
}

// ==========================================
// 7. MYSTERY NAME ENGINE
// ==========================================

function initMysteryName() {
  const randomIndex = Math.floor(Math.random() * MYSTERY_NAMES_DB.length);
  currentMystery = MYSTERY_NAMES_DB[randomIndex];
  isNameGuessed = false;

  el.nameCategoryBadge.textContent = currentMystery.category;
  el.nameClueText.textContent = currentMystery.clue;
  el.nameInput.value = '';
  el.nameInput.disabled = false;
  el.nameSubmitBtn.disabled = false;
  el.nameStatusFeedback.textContent = '';
  el.nameStatusFeedback.className = 'name-status-feedback';

  // Harf kutularını hazırla: İlk harf ve boşluklar açık, diğerleri gizli
  revealedLetters = [];
  const chars = currentMystery.name.split('');
  
  // İlk harfi ve kelimeler arası boşlukları baştan göster
  chars.forEach((c, idx) => {
    if (c === ' ') {
      revealedLetters[idx] = true;
    } else if (idx === 0 || (idx > 0 && chars[idx - 1] === ' ')) {
      // Kelime başı harfler açık
      revealedLetters[idx] = true;
    } else {
      revealedLetters[idx] = false;
    }
  });

  renderLetterBoxes();
}

function renderLetterBoxes() {
  el.letterBoxesRow.innerHTML = '';
  const chars = currentMystery.name.split('');

  chars.forEach((c, idx) => {
    const box = document.createElement('div');
    if (c === ' ') {
      box.className = 'letter-box space';
      box.textContent = '';
    } else {
      box.className = 'letter-box';
      if (revealedLetters[idx]) {
        box.textContent = c;
        box.classList.add('revealed');
      } else {
        box.textContent = '_';
      }
    }
    el.letterBoxesRow.appendChild(box);
  });
}

function normalizeTurkish(str) {
  return str
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c')
    .toUpperCase()
    .trim();
}

function handleNameGuessSubmit() {
  if (isNameGuessed || isGameOver) return;

  const guess = el.nameInput.value.trim();
  if (!guess) {
    el.nameStatusFeedback.textContent = 'Lütfen bir isim yazın.';
    el.nameStatusFeedback.className = 'name-status-feedback error';
    return;
  }

  const normalizedGuess = normalizeTurkish(guess);
  const normalizedTarget = normalizeTurkish(currentMystery.name);

  if (normalizedGuess === normalizedTarget) {
    // Correct Name!
    isNameGuessed = true;
    revealedLetters = revealedLetters.map(() => true);
    renderLetterBoxes();
    el.nameInput.disabled = true;
    el.nameSubmitBtn.disabled = true;
    el.nameStatusFeedback.textContent = '🎉 Harika! Gizli ismi bildin: +10 Puan kazandın!';
    el.nameStatusFeedback.className = 'name-status-feedback success';
    confetti.burst(60);
    addPoints(10);
  } else {
    // Wrong Name Guess: Shake & Reveal 1 more letter as bonus help
    sound.error();
    el.nameStatusFeedback.textContent = '❌ Yanlış tahmin! İpucu olarak 1 harf daha açıldı.';
    el.nameStatusFeedback.className = 'name-status-feedback error';

    // Reveal one random unrevealed letter
    const unrevealedIndices = [];
    currentMystery.name.split('').forEach((c, idx) => {
      if (c !== ' ' && !revealedLetters[idx]) {
        unrevealedIndices.push(idx);
      }
    });

    if (unrevealedIndices.length > 0) {
      const pick = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      revealedLetters[pick] = true;
      renderLetterBoxes();
    }
  }
}

// ==========================================
// 8. LAST LIFE LIFELINE (MULTIPLE CHOICE)
// ==========================================

function activateLastLifeOptions() {
  sound.lastLifeAlert();
  el.lastLifePanel.style.display = 'flex';
  el.optionsGrid.innerHTML = '';

  const config = DIFFICULTIES[currentDiffKey];
  const optionsSet = new Set();
  optionsSet.add(secretNumber);

  // Olası daraltılmış aralık [currentMinRange, currentMaxRange] içinden çeldiriciler seç
  const candidates = [];
  for (let n = currentMinRange; n <= currentMaxRange; n++) {
    if (n !== secretNumber) {
      candidates.push(n);
    }
  }

  // Eğer daraltılmış aralıkta 3 çeldirici çıkmazsa, genel min-max aralığından tamamla
  if (candidates.length < 3) {
    for (let n = config.min; n <= config.max; n++) {
      if (n !== secretNumber && !candidates.includes(n)) {
        candidates.push(n);
      }
    }
  }

  // Rastgele 3 çeldirici seç
  while (optionsSet.size < 4 && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    optionsSet.add(candidates.splice(idx, 1)[0]);
  }

  // Şıkları karıştır (Shuffle)
  const optionsArray = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  const letters = ['A', 'B', 'C', 'D'];

  optionsArray.forEach((num, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="option-letter">${letters[i]}</span>
      <span class="option-number">${num}</span>
    `;
    btn.addEventListener('click', () => {
      sound.click();
      el.guessInput.value = num;
      handleGuessSubmit();
    });
    el.optionsGrid.appendChild(btn);
  });
}

function hideLastLifeOptions() {
  el.lastLifePanel.style.display = 'none';
  el.optionsGrid.innerHTML = '';
}

// ==========================================
// 9. GAME LIFECYCLE & ROUND MANAGEMENT
// ==========================================

function initGame(diffKey = currentDiffKey) {
  currentDiffKey = diffKey;
  const config = DIFFICULTIES[diffKey];

  // Reset core round state
  secretNumber = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
  maxLives = config.lives;
  remainingLives = config.lives;
  guessesCount = 0;
  roundEarnedPoints = 0;
  currentMinRange = config.min;
  currentMaxRange = config.max;
  guessHistory = [];
  isGameOver = false;

  // Update UI Elements
  el.totalScoreVal.textContent = totalScore;
  updateDifficultyButtons();
  updateHighScoreDisplay();
  updateStatsDisplay();
  updateLivesDisplay();
  updateRangeTracker();
  resetFeedbackDisplay();
  renderHistory();
  hideLastLifeOptions();

  // Reset inputs
  el.guessInput.value = '';
  el.guessInput.min = config.min;
  el.guessInput.max = config.max;
  el.guessInput.placeholder = `${config.min} - ${config.max}`;
  el.guessInput.disabled = false;
  el.submitBtn.disabled = false;

  // Initialize Mystery Name & Timer
  initMysteryName();
  startTimer();

  // Close any open modals
  closeModals();

  // Auto-focus input
  setTimeout(() => el.guessInput.focus(), 150);
}

function updateDifficultyButtons() {
  el.diffBtns.forEach(btn => {
    if (btn.dataset.diff === currentDiffKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateHighScoreDisplay() {
  const currentBest = highScores[currentDiffKey];
  el.highScoreVal.textContent = currentBest !== null ? `${currentBest} Hamle` : '-';
}

function updateStatsDisplay() {
  el.guessCountVal.textContent = guessesCount;
}

function updateLivesDisplay() {
  el.livesCountText.textContent = `${remainingLives}/${maxLives}`;
  
  // Render Hearts
  el.heartsContainer.innerHTML = '';
  for (let i = 0; i < maxLives; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart-icon';
    if (i < remainingLives) {
      heart.textContent = '❤️';
    } else {
      heart.textContent = '🖤';
      heart.classList.add('lost');
    }
    el.heartsContainer.appendChild(heart);
  }

  // Progress Bar
  const percentage = (remainingLives / maxLives) * 100;
  el.livesProgressBar.style.width = `${percentage}%`;

  if (percentage <= 25) {
    el.livesProgressBar.style.background = 'var(--accent-crimson)';
  } else if (percentage <= 55) {
    el.livesProgressBar.style.background = 'var(--accent-gold)';
  } else {
    el.livesProgressBar.style.background = 'linear-gradient(90deg, var(--accent-emerald), var(--secondary))';
  }
}

function updateRangeTracker() {
  const totalSpan = DIFFICULTIES[currentDiffKey].max - DIFFICULTIES[currentDiffKey].min;
  const leftPercent = ((currentMinRange - DIFFICULTIES[currentDiffKey].min) / totalSpan) * 100;
  const rightPercent = ((DIFFICULTIES[currentDiffKey].max - currentMaxRange) / totalSpan) * 100;

  el.rangeMinBadge.textContent = `Min: ${currentMinRange}`;
  el.rangeMaxBadge.textContent = `Max: ${currentMaxRange}`;
  el.rangeStatusText.textContent = `Olası Aralık: ${currentMinRange} ile ${currentMaxRange} arası`;

  el.rangeTrackFill.style.left = `${Math.min(95, Math.max(0, leftPercent))}%`;
  el.rangeTrackFill.style.right = `${Math.min(95, Math.max(0, rightPercent))}%`;
}

function resetFeedbackDisplay() {
  el.feedbackIcon.textContent = '🎲';
  el.feedbackTitle.textContent = `Hazır mısın ${playerName}?`;
  el.feedbackDesc.textContent = `1 ile ${DIFFICULTIES[currentDiffKey].max} arasında bir sayı tuttum. Tahmin et!`;
  
  el.temperatureBadge.className = 'temperature-badge';
  el.tempIcon.textContent = '✨';
  el.tempText.textContent = 'Başlangıç';
}

function renderHistory() {
  el.historyCount.textContent = `(${guessHistory.length})`;
  
  if (guessHistory.length === 0) {
    el.historyChips.innerHTML = '<div class="history-empty">Henüz tahmin yapmadın.</div>';
    return;
  }

  el.historyChips.innerHTML = '';
  guessHistory.forEach((item, index) => {
    const chip = document.createElement('div');
    chip.className = `chip ${item.direction}`;
    chip.innerHTML = `
      <span>#${index + 1}:</span>
      <strong>${item.guess}</strong>
      <span>${item.dirIcon}</span>
      <span>${item.tempIcon}</span>
    `;
    el.historyChips.appendChild(chip);
  });

  el.historyChips.scrollTop = el.historyChips.scrollHeight;
}

function triggerShake() {
  sound.error();
  el.inputWrapper.classList.remove('shake');
  void el.inputWrapper.offsetWidth;
  el.inputWrapper.classList.add('shake');
}

// ==========================================
// 10. GUESS EVALUATION
// ==========================================

function handleGuessSubmit() {
  if (isGameOver) return;

  const rawVal = el.guessInput.value.trim();
  const guess = parseInt(rawVal, 10);
  const config = DIFFICULTIES[currentDiffKey];

  // Validation
  if (isNaN(guess) || rawVal === '') {
    triggerShake();
    el.feedbackTitle.textContent = 'Geçersiz Giriş!';
    el.feedbackDesc.textContent = 'Lütfen geçerli bir sayı yazın.';
    return;
  }

  if (guess < config.min || guess > config.max) {
    triggerShake();
    el.feedbackTitle.textContent = 'Aralık Dışında!';
    el.feedbackDesc.textContent = `Lütfen ${config.min} ile ${config.max} arasında bir sayı girin.`;
    return;
  }

  // Already guessed check
  const alreadyGuessed = guessHistory.some(item => item.guess === guess);
  if (alreadyGuessed) {
    triggerShake();
    el.feedbackTitle.textContent = 'Zaten Tahmin Ettin!';
    el.feedbackDesc.textContent = `${guess} sayısını daha önce denemiştin. Farklı bir sayı yaz.`;
    return;
  }

  guessesCount++;
  updateStatsDisplay();

  const diff = Math.abs(guess - secretNumber);

  // Check Win Condition
  if (guess === secretNumber) {
    handleWin();
    return;
  }

  // Wrong guess: decrease lives
  remainingLives--;
  updateLivesDisplay();

  // Animate pulse on hearts
  const lostHeart = el.heartsContainer.children[remainingLives];
  if (lostHeart) {
    lostHeart.classList.add('pulse');
  }

  // Direction & Range narrowing with Player Name
  let direction = '';
  let dirIcon = '';
  let dirTitle = '';

  if (guess < secretNumber) {
    direction = 'low';
    dirIcon = '⬆️';
    dirTitle = `${playerName}, daha BÜYÜK bir sayı söyle!`;
    if (guess >= currentMinRange) {
      currentMinRange = guess + 1;
    }
    sound.higher();
  } else {
    direction = 'high';
    dirIcon = '⬇️';
    dirTitle = `${playerName}, daha KÜÇÜK bir sayı söyle!`;
    if (guess <= currentMaxRange) {
      currentMaxRange = guess - 1;
    }
    sound.lower();
  }

  // Temperature scale
  let tempClass = '';
  let tempIcon = '';
  let tempLabel = '';

  if (diff <= 3) {
    tempClass = 'temp-fire';
    tempIcon = '🔥';
    tempLabel = `${playerName}, Ateş Gibi Yakın!`;
    sound.fire();
  } else if (diff <= 8) {
    tempClass = 'temp-hot';
    tempIcon = '☀️';
    tempLabel = 'Çok Sıcak';
  } else if (diff <= 16) {
    tempClass = 'temp-warm';
    tempIcon = '⛅';
    tempLabel = 'Ilık';
  } else {
    tempClass = 'temp-cold';
    tempIcon = '❄️';
    tempLabel = 'Buz Gibi Soğuk';
  }

  // Update Feedback Card
  el.feedbackIcon.textContent = dirIcon;
  el.feedbackTitle.textContent = dirTitle;
  el.feedbackDesc.textContent = `${guess} girdin. ${tempLabel} (${tempIcon})`;

  el.temperatureBadge.className = `temperature-badge ${tempClass}`;
  el.tempIcon.textContent = tempIcon;
  el.tempText.textContent = tempLabel;

  // Add to History
  guessHistory.push({
    guess,
    direction,
    dirIcon,
    tempClass,
    tempIcon,
    tempLabel
  });
  renderHistory();
  updateRangeTracker();

  // Check Game Over
  if (remainingLives <= 0) {
    handleGameOver('hakkın bitti');
    return;
  }

  // Check 1 Life Remaining -> ACTIVATE OPTIONS LIFELINE!
  if (remainingLives === 1) {
    activateLastLifeOptions();
  }

  // Reset input for next try
  el.guessInput.value = '';
  el.guessInput.focus();
}

function handleWin() {
  isGameOver = true;
  stopTimer();
  hideLastLifeOptions();

  // Balonlu ve konfetili muhteşem kazanma animasyonu!
  spawnVictoryBalloons(24);
  confetti.megaBurst();
  sound.win();

  // +10 Puan Ekle
  addPoints(10);

  // Liderlik tablosuna kaydet
  recordScore(playerName, totalScore, currentDiffKey);

  // Check Record
  let isNewRecord = false;
  const currentBest = highScores[currentDiffKey];
  if (currentBest === null || guessesCount < currentBest) {
    highScores[currentDiffKey] = guessesCount;
    saveLocalData();
    updateHighScoreDisplay();
    isNewRecord = true;
  }

  // Feedback Card update
  el.feedbackIcon.textContent = '🏆';
  el.feedbackTitle.textContent = `Harika Bildin, ${playerName}! (+10 Puan)`;
  el.feedbackDesc.textContent = `Gizli sayı ${secretNumber} idi. ${guessesCount} denemede çözdün!`;
  el.temperatureBadge.className = 'temperature-badge temp-fire';
  el.tempIcon.textContent = '🎉';
  el.tempText.textContent = 'KAZANDIN!';

  // Populate Modal
  el.modalEmoji.textContent = '🎉';
  el.modalTitle.textContent = `Tebrikler ${playerName}, Kazandın!`;
  el.modalSubtitle.textContent = `${playerName}, gizli sayıyı başarıyla yakaladın ve skorunu yükselttin!`;
  el.modalSecretNumber.textContent = secretNumber;
  el.modalEarnedPoints.textContent = `+${roundEarnedPoints} Puan`;
  el.modalTotalScore.textContent = totalScore;
  el.modalSecretName.textContent = currentMystery.name;

  if (isNewRecord) {
    el.newRecordBanner.textContent = `⭐ TEBRİKLER ${playerName.toUpperCase()}! YENİ REKOR KIRDIN! ⭐`;
    el.newRecordBanner.classList.add('show');
  } else {
    el.newRecordBanner.classList.remove('show');
  }

  setTimeout(() => {
    el.endgameModal.classList.add('active');
    el.endgameModal.setAttribute('aria-hidden', 'false');
  }, 700);
}

function handleTimeOut() {
  handleGameOver('süre doldu');
}

function handleGameOver(reason = 'hakkın bitti') {
  isGameOver = true;
  stopTimer();
  hideLastLifeOptions();
  sound.gameOver();

  // Puanı sıralamaya kaydet
  recordScore(playerName, totalScore, currentDiffKey);

  el.feedbackIcon.textContent = '💀';
  el.feedbackTitle.textContent = reason === 'süre doldu' ? `${playerName}, Süre Bitti!` : `${playerName}, Hakların Tükendi!`;
  el.feedbackDesc.textContent = `Gizli sayı ${secretNumber} idi.`;

  el.temperatureBadge.className = 'temperature-badge temp-cold';
  el.tempIcon.textContent = '💔';
  el.tempText.textContent = 'Oyun Bitti';

  // Populate Modal
  el.modalEmoji.textContent = reason === 'süre doldu' ? '⌛' : '😢';
  el.modalTitle.textContent = reason === 'süre doldu' ? `Süre Doldu, ${playerName}!` : `Hakkın Tükendi, ${playerName}!`;
  el.modalSubtitle.textContent = `Üzülme ${playerName}, bir sonraki turda sayıyı kesinlikle bulacaksın!`;
  el.modalSecretNumber.textContent = secretNumber;
  el.modalEarnedPoints.textContent = `+${roundEarnedPoints} Puan`;
  el.modalTotalScore.textContent = totalScore;
  el.modalSecretName.textContent = currentMystery.name;
  el.newRecordBanner.classList.remove('show');

  setTimeout(() => {
    el.endgameModal.classList.add('active');
    el.endgameModal.setAttribute('aria-hidden', 'false');
  }, 600);
}

function closeModals() {
  if (el.endgameModal) {
    el.endgameModal.classList.remove('active');
    el.endgameModal.setAttribute('aria-hidden', 'true');
  }
  if (el.helpModal) {
    el.helpModal.classList.remove('active');
    el.helpModal.setAttribute('aria-hidden', 'true');
  }
  if (el.leaderboardModal) {
    el.leaderboardModal.classList.remove('active');
    el.leaderboardModal.setAttribute('aria-hidden', 'true');
  }
  if (el.nameEditModal) {
    el.nameEditModal.classList.remove('active');
    el.nameEditModal.setAttribute('aria-hidden', 'true');
  }
}

// ==========================================
// 11. EVENT LISTENERS
// ==========================================

function setupEventListeners() {
  // Guess form submission
  el.guessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGuessSubmit();
  });

  // Mystery Name form submission
  el.nameGuessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleNameGuessSubmit();
  });

  // Step buttons (+ / -)
  el.btnDecrease.addEventListener('click', () => {
    sound.click();
    const cur = parseInt(el.guessInput.value, 10);
    const min = DIFFICULTIES[currentDiffKey].min;
    if (isNaN(cur)) {
      el.guessInput.value = min;
    } else if (cur > min) {
      el.guessInput.value = cur - 1;
    }
  });

  el.btnIncrease.addEventListener('click', () => {
    sound.click();
    const cur = parseInt(el.guessInput.value, 10);
    const max = DIFFICULTIES[currentDiffKey].max;
    if (isNaN(cur)) {
      el.guessInput.value = DIFFICULTIES[currentDiffKey].min;
    } else if (cur < max) {
      el.guessInput.value = cur + 1;
    }
  });

  // Difficulty switch
  el.diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.click();
      const diffKey = btn.dataset.diff;
      if (diffKey && diffKey !== currentDiffKey) {
        initGame(diffKey);
      }
    });
  });

  // Sound toggle
  el.soundBtn.addEventListener('click', toggleSound);

  // Player Profile Badge & Edit Modal
  if (el.playerProfileBadge) {
    el.playerProfileBadge.addEventListener('click', openNameEditModal);
  }
  if (el.playerEditBtn) {
    el.playerEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openNameEditModal();
    });
  }
  if (el.editPlayerForm) {
    el.editPlayerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updatePlayerName(el.editPlayerInput.value);
      closeNameEditModal();
    });
  }
  if (el.cancelPlayerNameBtn) {
    el.cancelPlayerNameBtn.addEventListener('click', closeNameEditModal);
  }

  // Leaderboard Modal events
  if (el.leaderboardBtn) {
    el.leaderboardBtn.addEventListener('click', openLeaderboard);
  }
  if (el.lbCloseBtn) {
    el.lbCloseBtn.addEventListener('click', closeLeaderboard);
  }
  if (el.modalLeaderboardBtn) {
    el.modalLeaderboardBtn.addEventListener('click', () => {
      closeModals();
      openLeaderboard();
    });
  }
  if (el.lbResetBtn) {
    el.lbResetBtn.addEventListener('click', () => {
      if (confirm('Puan sıralamasını varsayılan skorlara döndürmek istiyor musunuz?')) {
        leaderboard = [...DEFAULT_LEADERBOARD];
        saveLeaderboard();
        renderLeaderboard();
      }
    });
  }
  if (el.lbAddCurrentBtn) {
    el.lbAddCurrentBtn.addEventListener('click', () => {
      recordScore(playerName, totalScore, currentDiffKey);
      renderLeaderboard();
      spawnScoreFloater(0, 'Puanın Kaydedildi! 💾');
    });
  }
  if (el.lbTabs) {
    el.lbTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sound.click();
        renderLeaderboard(tab.dataset.filter);
      });
    });
  }

  // Help modal
  el.helpBtn.addEventListener('click', () => {
    sound.click();
    el.helpModal.classList.add('active');
    el.helpModal.setAttribute('aria-hidden', 'false');
  });

  el.helpCloseBtn.addEventListener('click', () => {
    sound.click();
    el.helpModal.classList.remove('active');
    el.helpModal.setAttribute('aria-hidden', 'true');
  });

  // Restart buttons
  el.restartGameBtn.addEventListener('click', () => {
    sound.click();
    initGame(currentDiffKey);
  });

  el.modalPlayAgainBtn.addEventListener('click', () => {
    sound.click();
    initGame(currentDiffKey);
  });

  // Close modal on click backdrop
  [el.endgameModal, el.helpModal, el.leaderboardModal, el.nameEditModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModals();
        }
      });
    }
  });

  // Keyboard shortcut: Escape closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModals();
    }
  });
}

// ==========================================
// 12. BOOTSTRAP APP
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  loadLocalData();
  updateScoreAmbientIcons(totalScore);
  setupEventListeners();
  initGame('medium');
});
