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

    // 30% chance to wrap through edges, 70% chance to bounce
    const wrapChance = 0.3;

    // Handle horizontal edges (based on ball center)
    if (this.x < 0) {
      // Went off left edge - wrap to right
      this.x = canvas.width;
      this.hue = (this.hue + 30) % 360;
    } else if (this.x > canvas.width) {
      // Went off right edge - wrap to left
      this.x = 0;
      this.hue = (this.hue + 30) % 360;
    } else if (this.x <= 0 || this.x >= canvas.width) {
      if (Math.random() < wrapChance) {
        // Let it continue through (will wrap on next frames)
      } else {
        this.speedX = -this.speedX;
        this.hue = (this.hue + 30) % 360;
      }
    }

    // Handle vertical edges (based on ball center)
    if (this.y < 0) {
      // Went off top edge - wrap to bottom
      this.y = canvas.height;
      this.hue = (this.hue + 30) % 360;
    } else if (this.y > canvas.height) {
      // Went off bottom edge - wrap to top
      this.y = 0;
      this.hue = (this.hue + 30) % 360;
    } else if (this.y <= 0 || this.y >= canvas.height) {
      if (Math.random() < wrapChance) {
        // Let it continue through (will wrap on next frames)
      } else {
        this.speedY = -this.speedY;
        this.hue = (this.hue + 30) % 360;
      }
    }
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
