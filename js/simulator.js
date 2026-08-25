const STORAGE_KEY = "oficina-simulador-melhor-volta";
const LOGICAL_WIDTH = 1000;
const LOGICAL_HEIGHT = 600;

const CONTROL_KEYS = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

const TRACK_ANCHORS = [
  { x: 255, y: 505 },
  { x: 122, y: 458 },
  { x: 92, y: 318 },
  { x: 145, y: 170 },
  { x: 285, y: 82 },
  { x: 425, y: 120 },
  { x: 505, y: 206 },
  { x: 604, y: 151 },
  { x: 768, y: 113 },
  { x: 901, y: 202 },
  { x: 866, y: 346 },
  { x: 745, y: 382 },
  { x: 685, y: 511 },
  { x: 506, y: 522 },
  { x: 411, y: 416 },
];

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function buildTrackSamples(anchors, detail = 14) {
  const points = [];
  const length = anchors.length;

  for (let index = 0; index < length; index += 1) {
    const p0 = anchors[(index - 1 + length) % length];
    const p1 = anchors[index];
    const p2 = anchors[(index + 1) % length];
    const p3 = anchors[(index + 2) % length];
    for (let step = 0; step < detail; step += 1) points.push(catmullRom(p0, p1, p2, p3, step / detail));
  }

  return points;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--.---";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${remaining.toFixed(3).padStart(6, "0")}`;
}

class RaceSimulator {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.shell = canvas.closest("[data-game-shell]");
    this.overlay = this.shell.querySelector("[data-game-overlay]");
    this.overlayTitle = this.shell.querySelector("[data-overlay-title]");
    this.overlayCopy = this.shell.querySelector("[data-overlay-copy]");
    this.startButton = this.shell.querySelector('[data-game-action="start"]');
    this.message = this.shell.querySelector("[data-race-message]");
    this.hud = {
      speed: this.shell.querySelector('[data-hud="speed"]'),
      lap: this.shell.querySelector('[data-hud="lap"]'),
      time: this.shell.querySelector('[data-hud="time"]'),
      best: this.shell.querySelector('[data-hud="best"]'),
    };

    this.track = buildTrackSamples(TRACK_ANCHORS);
    this.checkpoints = [0, 0.25, 0.5, 0.75].map((ratio) => this.track[Math.floor(this.track.length * ratio)]);
    this.input = { up: false, down: false, left: false, right: false };
    this.state = "idle";
    this.currentLap = 1;
    this.totalLaps = 3;
    this.lapElapsed = 0;
    this.bestLap = this.loadBestLap();
    this.nextCheckpoint = 1;
    this.checkpointInside = false;
    this.lastTimestamp = performance.now();
    this.lastSafe = { ...this.track[0] };
    this.offTrackTime = 0;
    this.player = { x: 0, y: 0, angle: 0, speed: 0 };

    this.resetPosition();
    this.bindEvents();
    this.updateHud();
    requestAnimationFrame((time) => this.loop(time));
  }

  loadBestLap() {
    try {
      const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY));
      return Number.isFinite(stored) && stored > 0 ? stored : null;
    } catch {
      return null;
    }
  }

  saveBestLap(value) {
    this.bestLap = value;
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // O jogo continua normalmente se o navegador bloquear armazenamento local.
    }
  }

  bindEvents() {
    this.shell.querySelectorAll("[data-game-action]").forEach((button) => {
      button.addEventListener("click", () => this.handleAction(button.dataset.gameAction));
    });

    document.addEventListener("keydown", (event) => {
      const control = CONTROL_KEYS[event.key];
      if (!control || this.state !== "running") return;
      event.preventDefault();
      this.input[control] = true;
    });

    document.addEventListener("keyup", (event) => {
      const control = CONTROL_KEYS[event.key];
      if (!control) return;
      this.input[control] = false;
    });

    this.shell.querySelectorAll("[data-control]").forEach((button) => {
      const control = button.dataset.control;
      const press = (event) => {
        event.preventDefault();
        if (this.state !== "running") return;
        button.setPointerCapture?.(event.pointerId);
        this.input[control] = true;
        button.classList.add("is-pressed");
      };
      const release = (event) => {
        event.preventDefault();
        this.input[control] = false;
        button.classList.remove("is-pressed");
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "running") this.pause();
    });
  }

  handleAction(action) {
    if (action === "start") {
      if (this.state === "paused") this.resume();
      else this.start();
    }
    if (action === "pause") this.state === "paused" ? this.resume() : this.pause();
    if (action === "restart") this.start();
    if (action === "exit") this.exit();
  }

  start() {
    this.currentLap = 1;
    this.lapElapsed = 0;
    this.nextCheckpoint = 1;
    this.checkpointInside = false;
    this.offTrackTime = 0;
    this.resetPosition();
    this.state = "running";
    this.hideOverlay();
    this.showMessage("VAI!");
  }

  pause() {
    if (this.state !== "running") return;
    this.state = "paused";
    this.clearInput();
    this.showOverlay("CORRIDA PAUSADA", "Seu tempo está congelado. Continue quando estiver pronto.", "Continuar");
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "running";
    this.hideOverlay();
  }

  exit() {
    this.state = "idle";
    this.currentLap = 1;
    this.lapElapsed = 0;
    this.clearInput();
    this.resetPosition();
    this.showOverlay("PRONTO PARA\nPILOTAR?", "Use W A S D ou as setas. No celular, use os controles na tela.", "Iniciar corrida");
    this.updateHud();
  }

  showOverlay(title, copy, buttonLabel) {
    this.overlayTitle.innerHTML = title.replace("\n", "<br>");
    this.overlayCopy.textContent = copy;
    this.startButton.childNodes[0].nodeValue = `${buttonLabel} `;
    this.overlay.classList.remove("is-hidden");
  }

  hideOverlay() {
    this.overlay.classList.add("is-hidden");
  }

  clearInput() {
    Object.keys(this.input).forEach((key) => { this.input[key] = false; });
    this.shell.querySelectorAll(".is-pressed").forEach((item) => item.classList.remove("is-pressed"));
  }

  resetPosition() {
    const start = this.track[0];
    const next = this.track[4];
    this.player.x = start.x;
    this.player.y = start.y;
    this.player.angle = Math.atan2(next.y - start.y, next.x - start.x);
    this.player.speed = 0;
    this.lastSafe = { x: start.x, y: start.y, angle: this.player.angle };
  }

  loop(timestamp) {
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.035);
    this.lastTimestamp = timestamp;
    if (this.state === "running") this.update(delta);
    this.draw();
    requestAnimationFrame((time) => this.loop(time));
  }

  update(delta) {
    this.lapElapsed += delta;
    const player = this.player;
    const movingForward = player.speed >= 0 ? 1 : -1;

    if (this.input.up) player.speed += 105 * delta;
    if (this.input.down) player.speed -= player.speed > 10 ? 150 * delta : 62 * delta;

    if (!this.input.up && !this.input.down) {
      const friction = 44 * delta;
      if (Math.abs(player.speed) <= friction) player.speed = 0;
      else player.speed -= Math.sign(player.speed) * friction;
    }

    player.speed = Math.max(-58, Math.min(220, player.speed));
    const steeringStrength = Math.min(Math.abs(player.speed) / 48, 1) * 2.25;
    if (this.input.left) player.angle -= steeringStrength * delta * movingForward;
    if (this.input.right) player.angle += steeringStrength * delta * movingForward;

    player.x += Math.cos(player.angle) * player.speed * delta;
    player.y += Math.sin(player.angle) * player.speed * delta;

    const roadDistance = this.distanceToTrack(player);
    if (roadDistance < 45) {
      this.offTrackTime = 0;
      this.lastSafe = { x: player.x, y: player.y, angle: player.angle };
    } else if (roadDistance > 55) {
      player.speed *= Math.max(0, 1 - 2.3 * delta);
      this.offTrackTime += delta;
    }

    if (roadDistance > 120 || this.offTrackTime > 3.5 || player.x < -80 || player.x > 1080 || player.y < -80 || player.y > 680) {
      player.x = this.lastSafe.x;
      player.y = this.lastSafe.y;
      player.angle = this.lastSafe.angle;
      player.speed = 0;
      this.offTrackTime = 0;
      this.showMessage("DE VOLTA À PISTA");
    }

    this.checkProgress();
    this.updateHud();
  }

  distanceToTrack(point) {
    let closest = Infinity;
    for (const sample of this.track) closest = Math.min(closest, distance(point, sample));
    return closest;
  }

  checkProgress() {
    const expectedIndex = this.nextCheckpoint === this.checkpoints.length ? 0 : this.nextCheckpoint;
    const expected = this.checkpoints[expectedIndex];
    const near = distance(this.player, expected) < 48;

    if (near && !this.checkpointInside) {
      this.checkpointInside = true;
      if (this.nextCheckpoint === this.checkpoints.length) this.completeLap();
      else this.nextCheckpoint += 1;
    } else if (!near && distance(this.player, expected) > 70) {
      this.checkpointInside = false;
    }
  }

  completeLap() {
    const completedTime = this.lapElapsed;
    if (!this.bestLap || completedTime < this.bestLap) this.saveBestLap(completedTime);

    if (this.currentLap >= this.totalLaps) {
      this.state = "finished";
      this.player.speed = 0;
      this.clearInput();
      this.showMessage("BANDEIRADA!");
      this.showOverlay(
        "CORRIDA CONCLUÍDA",
        `Última volta: ${formatTime(completedTime)} · Melhor: ${formatTime(this.bestLap)}`,
        "Tentar novamente",
      );
    } else {
      this.showMessage(`VOLTA ${this.currentLap} · ${formatTime(completedTime)}`);
      this.currentLap += 1;
      this.lapElapsed = 0;
      this.nextCheckpoint = 1;
      this.checkpointInside = true;
    }
    this.updateHud();
  }

  showMessage(text) {
    this.message.textContent = text;
    this.message.classList.remove("show");
    void this.message.offsetWidth;
    this.message.classList.add("show");
  }

  updateHud() {
    this.hud.speed.textContent = String(Math.round(Math.abs(this.player.speed) * 1.08)).padStart(3, "0");
    this.hud.lap.textContent = String(this.currentLap).padStart(2, "0");
    this.hud.time.textContent = formatTime(this.lapElapsed);
    this.hud.best.textContent = formatTime(this.bestLap);
  }

  drawTrackPath() {
    const context = this.context;
    context.beginPath();
    context.moveTo(this.track[0].x, this.track[0].y);
    for (let index = 1; index < this.track.length; index += 1) context.lineTo(this.track[index].x, this.track[index].y);
    context.closePath();
  }

  draw() {
    const context = this.context;
    context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const background = context.createLinearGradient(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    background.addColorStop(0, "#17241d");
    background.addColorStop(1, "#0c1711");
    context.fillStyle = background;
    context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    this.drawEnvironment();

    context.save();
    this.drawTrackPath();
    context.strokeStyle = "rgba(0,0,0,.45)";
    context.lineWidth = 156;
    context.stroke();

    this.drawTrackPath();
    context.strokeStyle = "#e7e2d5";
    context.lineWidth = 136;
    context.stroke();

    this.drawTrackPath();
    context.setLineDash([18, 18]);
    context.strokeStyle = "#c94336";
    context.lineWidth = 136;
    context.stroke();

    context.setLineDash([]);
    this.drawTrackPath();
    context.strokeStyle = "#303438";
    context.lineWidth = 116;
    context.stroke();

    this.drawTrackPath();
    context.setLineDash([12, 15]);
    context.strokeStyle = "rgba(255,255,255,.12)";
    context.lineWidth = 2;
    context.stroke();
    context.restore();

    this.drawStartGrid();
    this.drawCheckpointHint();
    this.drawCar();

    const vignette = context.createRadialGradient(500, 300, 160, 500, 300, 650);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.42)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  drawEnvironment() {
    const context = this.context;
    context.save();
    context.strokeStyle = "rgba(255,255,255,.025)";
    context.lineWidth = 1;
    for (let x = 0; x <= LOGICAL_WIDTH; x += 40) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, LOGICAL_HEIGHT); context.stroke();
    }
    for (let y = 0; y <= LOGICAL_HEIGHT; y += 40) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(LOGICAL_WIDTH, y); context.stroke();
    }

    const blocks = [[24, 50, 85, 45], [831, 35, 130, 38], [25, 527, 120, 35], [822, 505, 145, 48], [335, 250, 120, 75]];
    blocks.forEach(([x, y, width, height], index) => {
      context.fillStyle = index === 4 ? "#101914" : "#1e2c23";
      context.fillRect(x, y, width, height);
      context.strokeStyle = "rgba(244,196,48,.12)";
      context.strokeRect(x, y, width, height);
    });
    context.restore();
  }

  drawStartGrid() {
    const context = this.context;
    const start = this.track[0];
    const next = this.track[3];
    const angle = Math.atan2(next.y - start.y, next.x - start.x);
    context.save();
    context.translate(start.x, start.y);
    context.rotate(angle);
    const size = 10;
    for (let row = -5; row < 5; row += 1) {
      for (let column = -1; column < 1; column += 1) {
        context.fillStyle = (row + column) % 2 === 0 ? "#f2efe6" : "#181a1c";
        context.fillRect(column * size, row * size, size, size);
      }
    }
    context.restore();
  }

  drawCheckpointHint() {
    if (this.state !== "running") return;
    const expectedIndex = this.nextCheckpoint === this.checkpoints.length ? 0 : this.nextCheckpoint;
    const point = this.checkpoints[expectedIndex];
    const context = this.context;
    context.save();
    context.beginPath();
    context.arc(point.x, point.y, 18, 0, Math.PI * 2);
    context.strokeStyle = "rgba(244,196,48,.65)";
    context.lineWidth = 3;
    context.stroke();
    context.beginPath();
    context.arc(point.x, point.y, 28, 0, Math.PI * 2);
    context.strokeStyle = "rgba(244,196,48,.16)";
    context.stroke();
    context.restore();
  }

  drawCar() {
    const context = this.context;
    const player = this.player;
    context.save();
    context.translate(player.x, player.y);
    context.rotate(player.angle);
    context.shadowColor = "rgba(0,0,0,.6)";
    context.shadowBlur = 10;
    context.shadowOffsetY = 5;
    context.fillStyle = "#070808";
    context.fillRect(-16, -11, 33, 22);
    context.shadowColor = "transparent";
    context.fillStyle = "#f4c430";
    context.beginPath();
    context.roundRect(-14, -9, 28, 18, 5);
    context.fill();
    context.fillStyle = "#202428";
    context.fillRect(-3, -7, 9, 14);
    context.fillStyle = "rgba(255,255,255,.85)";
    context.fillRect(10, -6, 2, 4);
    context.fillRect(10, 2, 2, 4);
    context.fillStyle = "#e94b43";
    context.fillRect(-13, -6, 2, 4);
    context.fillRect(-13, 2, 2, 4);
    context.restore();
  }
}

export function initSimulator() {
  const canvas = document.querySelector("#race-canvas");
  if (!canvas || !canvas.getContext) return;
  new RaceSimulator(canvas);
}

