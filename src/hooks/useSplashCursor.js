import { useEffect, useRef } from 'react';

export function useSplashCursor() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const lastParticleTimeRef = useRef(0);

  useEffect(() => {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d', { alpha: true });

    // Vibrant color palette for splashes
    const colorPalette = [
      '#a855f7', // Purple
      '#3b82f6', // Blue
      '#22c55e', // Green
      '#f97316', // Orange
      '#ec4899', // Pink
      '#0ea5e9', // Sky Blue
      '#8b5cf6', // Violet
      '#06b6d4', // Cyan
      '#f43f5e', // Rose
      '#14b8a6', // Teal
    ];

    const getRandomColor = () => {
      return colorPalette[Math.floor(Math.random() * colorPalette.length)];
    };

    // Create particle
    const createParticle = (x, y) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 3 + Math.random() * 5; // Faster particles

      return {
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2, // More upward bias
        age: 0,
        lifetime: 800 + Math.random() * 600, // 800-1400ms - longer visibility
        color: getRandomColor(),
        size: 6 + Math.random() * 10, // Larger particles (6-16px)
        maxSize: 6 + Math.random() * 10,
      };
    };

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.age += 16; // ~60fps

        if (particle.age >= particle.lifetime) {
          return false; // Remove dead particles
        }

        // Physics - more pronounced
        particle.vy += 0.2; // Gravity
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Add air resistance
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Calculate opacity (fade out)
        const progress = particle.age / particle.lifetime;
        const easeProgress = 1 - Math.pow(1 - progress, 2); // Quadratic ease-out
        const opacity = Math.max(0, 1 - easeProgress);

        // Calculate size (shrink slightly)
        const currentSize = particle.maxSize * (1 - progress * 0.2);

        // Draw particle with glow effect
        // Outer glow - creates bloom effect
        const glowSize = currentSize * 2.5;
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, glowSize
        );

        // Convert hex color to rgba for glow
        const hex = particle.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * 0.4})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacity * 0.1})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          particle.x - glowSize,
          particle.y - glowSize,
          glowSize * 2,
          glowSize * 2
        );

        // Core particle - bright and solid
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        return true; // Keep particle
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Mouse move handler - create splash burst
    const handleMouseMove = (e) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      const now = Date.now();
      // Generate particles more frequently and in bigger bursts
      if (now - lastParticleTimeRef.current > 15) {
        const particleCount = 12 + Math.floor(Math.random() * 16); // 12-28 particles per burst
        for (let i = 0; i < particleCount; i++) {
          // Wider spread for more dramatic splash
          const offsetX = (Math.random() - 0.5) * 30;
          const offsetY = (Math.random() - 0.5) * 30;
          particlesRef.current.push(
            createParticle(e.clientX + offsetX, e.clientY + offsetY)
          );
        }
        lastParticleTimeRef.current = now;
      }
    };

    // Handle window resize
    const handleResize = () => {
      updateCanvasSize();
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Observe dark mode class changes
    const observer = new MutationObserver(() => {
      // Dark mode changed, particles will adapt automatically
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
    };
  }, []);
}
