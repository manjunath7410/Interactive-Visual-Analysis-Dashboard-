import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

export interface Ambient3DBackgroundProps {
  /** Explicit override for content focus state */
  focused?: boolean;
  /** Focus intensity level between 0 (idle) and 1 (highly engaged) */
  focusIntensity?: number;
  /** Breathing cycle speed multiplier (default: 1.0) */
  breathSpeed?: number;
  /** Additional styling classes */
  className?: string;
}

// Generate soft radial glow texture for luminous particle points
function createGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Parse hex string to normalized RGB components
function hexToRgb(hexStr: string): { r: number; g: number; b: number } {
  const cleanHex = hexStr.replace('#', '');
  const parsed = parseInt(cleanHex, 16);
  if (isNaN(parsed)) return { r: 0.39, g: 0.4, b: 0.95 }; // Default fallback
  return {
    r: ((parsed >> 16) & 255) / 255,
    g: ((parsed >> 8) & 255) / 255,
    b: (parsed & 255) / 255,
  };
}

export const Ambient3DBackground: React.FC<Ambient3DBackgroundProps> = ({
  focused: propFocused,
  focusIntensity: propIntensity,
  breathSpeed = 1.0,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Internal interaction state for syncing breathing luminosity with content focus
  const focusStateRef = useRef({
    isWindowFocused: typeof document !== 'undefined' ? document.hasFocus() : true,
    lastInteractionTime: performance.now(),
    interactionEngagement: 0.6, // 0 (calm idle) to 1.0 (active peak)
  });

  // Track props in refs for real-time access inside the animation loop
  const propFocusedRef = useRef(propFocused);
  const propIntensityRef = useRef(propIntensity);
  const breathSpeedRef = useRef(breathSpeed);

  // Hook up callback to notify the persistent WebGL scene about theme swatches changes
  const onThemeSwatchesChangeRef = useRef<((swatches: string[]) => void) | null>(null);

  useEffect(() => {
    propFocusedRef.current = propFocused;
  }, [propFocused]);

  useEffect(() => {
    propIntensityRef.current = propIntensity;
  }, [propIntensity]);

  useEffect(() => {
    breathSpeedRef.current = breathSpeed;
  }, [breathSpeed]);

  // Whenever theme changes in ThemeContext, smoothly update target colors without re-mounting scene
  useEffect(() => {
    if (onThemeSwatchesChangeRef.current && theme.swatches) {
      onThemeSwatchesChangeRef.current(theme.swatches);
    }
  }, [theme.id, theme.swatches]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL support
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) return;

    // Accessibility check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;
    const handleMotionPreference = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionPreference);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1200
    );
    camera.position.z = 400;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Particle Configuration
    const particleCount = 92;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    // Color interpolation buffers for fluid color transitions
    const currentBaseColors = new Float32Array(particleCount * 3);
    const targetBaseColors = new Float32Array(particleCount * 3);
    const activeColors = new Float32Array(particleCount * 3);

    const phaseOffsets = new Float32Array(particleCount);
    const rateMultipliers = new Float32Array(particleCount);

    // Initial theme swatches mapping
    const initialSwatches = theme.swatches && theme.swatches.length > 0 ? theme.swatches : ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];
    const initialRgb = initialSwatches.map(hexToRgb);

    for (let i = 0; i < particleCount; i++) {
      // Spatial distribution across 3D frustum
      positions[i * 3] = (Math.random() - 0.5) * 880;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 560;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 360;

      // Gentle floating drift
      velocities[i * 3] = (Math.random() - 0.5) * 0.24;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.24;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.16;

      // Base color assignment
      const swatch = initialRgb[i % initialRgb.length];
      currentBaseColors[i * 3] = swatch.r;
      currentBaseColors[i * 3 + 1] = swatch.g;
      currentBaseColors[i * 3 + 2] = swatch.b;

      targetBaseColors[i * 3] = swatch.r;
      targetBaseColors[i * 3 + 1] = swatch.g;
      targetBaseColors[i * 3 + 2] = swatch.b;

      activeColors[i * 3] = swatch.r;
      activeColors[i * 3 + 1] = swatch.g;
      activeColors[i * 3 + 2] = swatch.b;

      // Individual breathing phase & frequency variance
      phaseOffsets[i] = Math.random() * Math.PI * 2;
      rateMultipliers[i] = 0.85 + Math.random() * 0.35;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(activeColors, 3));

    // Particle Glow Texture & Additive Blending
    const glowTexture = createGlowTexture();
    const pMaterial = new THREE.PointsMaterial({
      size: 4.8,
      map: glowTexture,
      transparent: true,
      opacity: 0.65,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, pMaterial);
    scene.add(particleSystem);

    // Color shift pulse surge state (brief glow wave on theme switch)
    let colorShiftPulse = 0;

    // Handle fluid color transition whenever ThemeContext updates
    onThemeSwatchesChangeRef.current = (newSwatches: string[]) => {
      if (!newSwatches || newSwatches.length === 0) return;
      const rgbList = newSwatches.map(hexToRgb);

      for (let i = 0; i < particleCount; i++) {
        const swatch = rgbList[i % rgbList.length];
        targetBaseColors[i * 3] = swatch.r;
        targetBaseColors[i * 3 + 1] = swatch.g;
        targetBaseColors[i * 3 + 2] = swatch.b;
      }

      // Trigger a brief luminous swell during the color transition
      colorShiftPulse = 1.0;
    };

    // Mouse & Focus Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const registerContentInteraction = () => {
      focusStateRef.current.lastInteractionTime = performance.now();
      focusStateRef.current.interactionEngagement = 1.0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX - window.innerWidth / 2) * 0.07;
      targetY = (e.clientY - window.innerHeight / 2) * 0.07;
      registerContentInteraction();
    };

    const handleScroll = () => {
      registerContentInteraction();
    };

    const handleWindowFocus = () => {
      focusStateRef.current.isWindowFocused = true;
      registerContentInteraction();
    };

    const handleWindowBlur = () => {
      focusStateRef.current.isWindowFocused = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    // Window resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Visibility management
    let isDocumentVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Animation & Breathing Loop
    let animationFrameId: number;
    let currentLuminosityLerp = 0.5;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isDocumentVisible) return;

      const delta = Math.min(clock.getDelta(), 0.1); // Clamp delta to avoid leaps after tab switch
      const elapsedTime = clock.getElapsedTime();

      // Determine focus level synced with user activity on active content
      const now = performance.now();
      const timeSinceInteraction = (now - focusStateRef.current.lastInteractionTime) / 1000;
      
      // Decay interaction engagement towards baseline (0.35) after 2 seconds of inactivity
      if (timeSinceInteraction > 2.0) {
        focusStateRef.current.interactionEngagement = Math.max(
          0.35,
          focusStateRef.current.interactionEngagement - delta * 0.28
        );
      }

      // Compute unified target focus intensity
      let targetFocus: number;
      if (typeof propIntensityRef.current === 'number') {
        targetFocus = Math.min(Math.max(propIntensityRef.current, 0), 1);
      } else if (typeof propFocusedRef.current === 'boolean') {
        targetFocus = propFocusedRef.current ? 1.0 : 0.35;
      } else if (!focusStateRef.current.isWindowFocused) {
        targetFocus = 0.2; // Dormant calm when tab not in focus
      } else {
        targetFocus = focusStateRef.current.interactionEngagement;
      }

      // Smooth lerp to prevent jarring transitions
      currentLuminosityLerp += (targetFocus - currentLuminosityLerp) * Math.min(delta * 2.5, 0.15);

      // Decay theme shift color pulse
      if (colorShiftPulse > 0) {
        colorShiftPulse = Math.max(0, colorShiftPulse - delta * 1.2);
      }

      // Camera dampening to mouse coordinates
      mouseX += (targetX - mouseX) * 0.035;
      mouseY += (targetY - mouseY) * 0.035;
      camera.position.x = mouseX;
      camera.position.y = -mouseY;
      camera.lookAt(scene.position);

      // Slow Breathing Oscillations
      const speed = prefersReducedMotion ? 0.3 : (breathSpeedRef.current || 1.0);
      const breathPhase = elapsedTime * 1.35 * speed;
      const globalBreath = (Math.sin(breathPhase) + 1) * 0.5; // Normalized 0 to 1

      // Modulate particle material opacity and size
      const minOpacity = 0.35 + 0.15 * currentLuminosityLerp + 0.15 * colorShiftPulse;
      const maxOpacity = 0.65 + 0.30 * currentLuminosityLerp + 0.25 * colorShiftPulse;
      pMaterial.opacity = minOpacity + (maxOpacity - minOpacity) * globalBreath;

      // Particle Point Size Breathing Pulse
      const baseSize = 4.2 + 1.2 * currentLuminosityLerp + 1.2 * colorShiftPulse;
      const pulseSizeDelta = (1.4 + 1.2 * currentLuminosityLerp) * globalBreath;
      pMaterial.size = baseSize + pulseSizeDelta;

      // Per-Particle Physics & Fluid Smooth Color Interpolation
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const colorArray = colorAttr.array as Float32Array;

      // Base color transition speed (smooth organic glide across ~0.8s)
      const baseLerpSpeed = Math.min(delta * 3.2, 0.18);

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;

        // Position drift
        posArray[idx] += velocities[idx];
        posArray[idx + 1] += velocities[idx + 1];
        posArray[idx + 2] += velocities[idx + 2];

        // Bounds wrapping
        if (Math.abs(posArray[idx]) > 440) velocities[idx] *= -1;
        if (Math.abs(posArray[idx + 1]) > 280) velocities[idx + 1] *= -1;
        if (Math.abs(posArray[idx + 2]) > 180) velocities[idx + 2] *= -1;

        // Individual staggered lerp factor for wave-like chromatic flow
        const particleLerpRate = baseLerpSpeed * (0.85 + rateMultipliers[i] * 0.35);

        // Fluid color-shifting: interpolate current base colors towards target theme swatches
        currentBaseColors[idx] += (targetBaseColors[idx] - currentBaseColors[idx]) * particleLerpRate;
        currentBaseColors[idx + 1] += (targetBaseColors[idx + 1] - currentBaseColors[idx + 1]) * particleLerpRate;
        currentBaseColors[idx + 2] += (targetBaseColors[idx + 2] - currentBaseColors[idx + 2]) * particleLerpRate;

        // Individual luminosity breathing wave synced to the global pulse
        const individualPhase = breathPhase * rateMultipliers[i] + phaseOffsets[i];
        const microBreath = (Math.sin(individualPhase) + 1) * 0.5;

        // Dynamic luminance factor combining global focus + individual shimmer + theme shift surge
        const luminanceMultiplier =
          0.7 +
          0.3 * microBreath +
          0.45 * currentLuminosityLerp * (0.6 + 0.4 * globalBreath) +
          0.25 * colorShiftPulse;

        colorArray[idx] = Math.min(1.0, currentBaseColors[idx] * luminanceMultiplier);
        colorArray[idx + 1] = Math.min(1.0, currentBaseColors[idx + 1] * luminanceMultiplier);
        colorArray[idx + 2] = Math.min(1.0, currentBaseColors[idx + 2] * luminanceMultiplier);
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      // Gentle global constellation rotation
      particleSystem.rotation.y += 0.0005;
      particleSystem.rotation.x += 0.00025;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      onThemeSwatchesChangeRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaQuery.removeEventListener('change', handleMotionPreference);

      geometry.dispose();
      glowTexture.dispose();
      pMaterial.dispose();
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Run once on mount! Decoupled from theme re-renders so particles stay alive & glide colors smoothly

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-35 transition-opacity duration-1000 ${className}`}
    />
  );
};
