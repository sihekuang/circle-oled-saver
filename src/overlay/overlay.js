const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let animationId = null;
let ball = null;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (ball) {
    ball.updateSize();
  }
}

window.addEventListener('resize', resize);
resize();

class BouncingBall {
  constructor() {
    this.updateSize();
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.speedX = 4;
    this.speedY = 3;
    this.hue = Math.random() * 360;
  }

  updateSize() {
    // Ball size between 5% and 20% of the smaller dimension
    const minDim = Math.min(canvas.width, canvas.height);
    const minSize = minDim * 0.05;
    const maxSize = minDim * 0.20;
    this.radius = minSize + Math.random() * (maxSize - minSize);
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // Bounce off walls
    if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
      this.speedX = -this.speedX;
      this.hue = (this.hue + 30) % 360; // Change color on bounce
    }
    if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
      this.speedY = -this.speedY;
      this.hue = (this.hue + 30) % 360;
    }

    // Keep in bounds
    this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
  }

  draw() {
    // Draw ball with gradient
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, `hsl(${this.hue}, 80%, 70%)`);
    gradient.addColorStop(1, `hsl(${this.hue}, 80%, 40%)`);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (ball) {
    ball.update();
    ball.draw();
  }

  animationId = requestAnimationFrame(animate);
}

// Initialize
ball = new BouncingBall();
animate();

// Listen for IPC events
window.oledSaver.onFadeOut(() => {
  document.getElementById('container').classList.add('fade-out');
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
