const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let animationId = null;
let ball = null;
let ballSizePercentage = 10; // Default value
let ballOpacityPercentage = 100; // Default value

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
    this.maxSpeed = 8;
    this.hue = Math.random() * 360;
  }

  updateSize() {
    // Ball size based on configured percentage of the smaller dimension
    const minDim = Math.min(canvas.width, canvas.height);
    this.radius = minDim * (ballSizePercentage / 100);
  }

  limitSpeed() {
    const currentSpeed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2);
    if (currentSpeed > this.maxSpeed) {
      const scale = this.maxSpeed / currentSpeed;
      this.speedX *= scale;
      this.speedY *= scale;
    }
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
        // Bounce with random angle variation
        this.speedX = -this.speedX;
        this.speedY += (Math.random() - 0.5) * 2;
        this.limitSpeed();
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
        // Bounce with random angle variation
        this.speedY = -this.speedY;
        this.speedX += (Math.random() - 0.5) * 2;
        this.limitSpeed();
        this.hue = (this.hue + 30) % 360;
      }
    }
  }

  draw() {
    // Get content from current provider
    const content = window.contentRotator ?
      window.contentRotator.getCurrentProvider()?.getData() :
      null;

    if (content) {
      // Draw circle with content
      this.drawWithContent(content);
    } else {
      // Fallback to original gradient ball
      this.drawGradient();
    }
  }

  drawGradient() {
    // Original gradient drawing code
    const opacity = ballOpacityPercentage / 100;
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, `hsla(${this.hue}, 80%, 70%, ${opacity})`);
    gradient.addColorStop(1, `hsla(${this.hue}, 80%, 40%, ${opacity})`);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  drawWithContent(content) {
    const opacity = ballOpacityPercentage / 100;

    // Draw circle background
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    // Parse background color and add opacity
    const bgColor = this.addOpacity(content.backgroundColor, opacity);
    ctx.fillStyle = bgColor;
    ctx.fill();

    // Add subtle shadow/border
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw icon and text
    this.drawContentText(content, opacity);
  }

  addOpacity(hexColor, opacity) {
    // Convert hex to rgba with opacity
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  drawContentText(content, opacity) {
    ctx.save();

    // Set text properties
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Icon size and position (top of circle)
    const iconSize = this.radius * 0.25;
    ctx.font = `${iconSize}px Arial`;
    const iconY = this.y - this.radius * 0.3;
    ctx.fillText(content.icon, this.x, iconY);

    // Text size and position (below icon)
    const textSize = this.radius * 0.15;
    ctx.font = `bold ${textSize}px Arial`;

    // Handle multi-line text
    const lines = content.text.split('\n');
    const lineHeight = textSize * 1.2;
    const textStartY = this.y + this.radius * 0.1;

    lines.forEach((line, index) => {
      const y = textStartY + (index * lineHeight);
      ctx.fillText(line, this.x, y);
    });

    ctx.restore();
  }
}

// Initialize content providers and rotator
async function initContentProviders() {
  // Import provider classes (using script tags in HTML)
  const ClockProvider = window.ClockProvider;
  const StockProvider = window.StockProvider;
  const SystemInfoProvider = window.SystemInfoProvider;
  const ContentRotator = window.ContentRotator;

  // Get content settings (will add IPC handler later)
  const contentSettings = {
    enabled: true,
    intervalSeconds: 10,
    enabledProviders: ['clock', 'stocks', 'system'],
    providers: {
      clock: { backgroundColor: '#1a1a2e', show24Hour: false },
      stocks: { backgroundColor: null, symbols: ['AAPL', 'GOOGL', 'TSLA'] },
      system: { backgroundColor: '#1a1a2e', showBattery: true }
    }
  };

  const providers = [];

  if (contentSettings.enabledProviders.includes('clock')) {
    providers.push(new ClockProvider(contentSettings.providers.clock));
  }

  if (contentSettings.enabledProviders.includes('stocks')) {
    providers.push(new StockProvider(contentSettings.providers.stocks));
  }

  if (contentSettings.enabledProviders.includes('system')) {
    providers.push(new SystemInfoProvider(contentSettings.providers.system));
  }

  // Create and start rotator
  if (providers.length > 0) {
    window.contentRotator = new ContentRotator(providers, contentSettings.intervalSeconds);
    window.contentRotator.start();
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
async function init() {
  ballSizePercentage = await window.oledSaver.getBallSize();
  ballOpacityPercentage = await window.oledSaver.getBallOpacity();
  ball = new BouncingBall();

  // Initialize content providers
  await initContentProviders();

  animate();
}

init();

// Listen for IPC events
window.oledSaver.onFadeOut(() => {
  document.getElementById('container').classList.add('fade-out');
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (window.contentRotator) {
    window.contentRotator.destroy();
  }
});
