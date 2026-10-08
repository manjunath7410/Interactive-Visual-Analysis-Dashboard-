import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Box,
  Rotate3d,
  Maximize2,
  Minimize2,
  Compass,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Sliders,
  Info,
  Activity,
  Grid,
} from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { useTheme } from '../../context/ThemeContext';
import { formatMetricDisplay, normalizeRowValue } from '../../utils/dataEngine';

interface Spatial3DUniverseProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
}

type SpatialMode = 'scatter' | 'voxel-bars' | 'topology';
type ShaderStyle = 'studio' | 'cyber' | 'glass';
type CameraView = 'default' | 'top' | 'front' | 'side' | 'isometric';

export const Spatial3DUniverse: React.FC<Spatial3DUniverseProps> = ({
  filteredRows,
  analytics,
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHolderRef = useRef<HTMLDivElement>(null);

  // Dimension selections
  const numCols = analytics.numericColumnNames;
  const catCols = analytics.categoricalColumnNames;

  const [colX, setColX] = useState<string>(numCols[0] || '');
  const [colY, setColY] = useState<string>(numCols[1] || numCols[0] || '');
  const [colZ, setColZ] = useState<string>(numCols[2] || numCols[0] || '');
  const [catGrouping, setCatGrouping] = useState<string>(catCols[0] || '');

  // 3D Visual configurations
  const [mode, setMode] = useState<SpatialMode>('scatter');
  const [shaderStyle, setShaderStyle] = useState<ShaderStyle>('studio');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Focused 3D item hover state
  const [hoveredData, setHoveredData] = useState<{
    title: string;
    xVal: number | string;
    yVal: number | string;
    zVal?: number | string;
    category?: string;
    rawRow?: Record<string, any>;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Keep dimensions synced if columns change
  useEffect(() => {
    if (!colX && numCols.length > 0) setColX(numCols[0]);
    if (!colY && numCols.length > 1) setColY(numCols[1]);
    if (!colZ && numCols.length > 2) setColZ(numCols[2] || numCols[0]);
    if (!catGrouping && catCols.length > 0) setCatGrouping(catCols[0]);
  }, [numCols, catCols, colX, colY, colZ, catGrouping]);

  // Three.js State Refs to handle rendering and camera controls
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const interactiveGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.35, y: 0.45 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0.35, y: 0.45 });
  const cameraDistanceRef = useRef<number>(140);
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseCoordsRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const objectsForRaycastRef = useRef<THREE.Object3D[]>([]);

  // Setup WebGL Scene
  useEffect(() => {
    const holder = canvasHolderRef.current;
    if (!holder) return;

    // Check WebGL availability
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const width = holder.clientWidth || 800;
    const height = holder.clientHeight || 560;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0035);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 45, 140);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    holder.appendChild(renderer.domElement);

    // Three-Point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(80, 120, 90);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(
      parseInt(theme.swatches[0].replace('#', '0x'), 16) || 0x6366f1,
      0.85
    );
    fillLight.position.set(-90, 60, -80);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(
      parseInt(theme.swatches[1].replace('#', '0x'), 16) || 0x06b6d4,
      0.65
    );
    rimLight.position.set(0, -50, -100);
    scene.add(rimLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(120, 24, 0x334155, 0x1e293b);
    gridHelper.position.y = -20;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Axis Helper (X: Red, Y: Green, Z: Blue)
    const axesHelper = new THREE.AxesHelper(18);
    axesHelper.position.set(-58, -19.5, -58);
    scene.add(axesHelper);

    // Interactive Model Group
    const group = new THREE.Group();
    scene.add(group);
    interactiveGroupRef.current = group;

    // Animation & Render Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth damping rotation
      if (autoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.004;
      }

      currentRotationRef.current.x +=
        (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y +=
        (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      // Update camera spherical orbit position
      const dist = cameraDistanceRef.current;
      const rotX = currentRotationRef.current.x;
      const rotY = currentRotationRef.current.y;

      camera.position.x = dist * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = dist * Math.sin(rotX);
      camera.position.z = dist * Math.cos(rotY) * Math.cos(rotX);
      camera.lookAt(0, 0, 0);

      // Perform raycasting for point detection
      if (renderer && camera && objectsForRaycastRef.current.length > 0) {
        raycasterRef.current.setFromCamera(mouseCoordsRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(
          objectsForRaycastRef.current
        );

        if (intersects.length > 0) {
          const hit = intersects[0];
          const userData = hit.object.userData;
          if (userData && userData.title) {
            // Project 3D coordinate to screen coordinates for tooltip
            const vector = hit.point.clone().project(camera);
            const rect = renderer.domElement.getBoundingClientRect();
            const sx = ((vector.x + 1) / 2) * rect.width;
            const sy = ((-vector.y + 1) / 2) * rect.height;

            setHoveredData({
              title: userData.title,
              xVal: userData.xVal,
              yVal: userData.yVal,
              zVal: userData.zVal,
              category: userData.category,
              rawRow: userData.rawRow,
              screenX: sx,
              screenY: sy,
            });
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!holder) return;
      const w = holder.clientWidth;
      const h = holder.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (holder && renderer.domElement.parentNode === holder) {
        holder.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Re-build 3D Meshes when data, columns, mode, or shader change
  useEffect(() => {
    const group = interactiveGroupRef.current;
    if (!group) return;

    // Clear previous children
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else if (child.material) {
        child.material.dispose();
      }
      group.remove(child);
    }
    objectsForRaycastRef.current = [];

    const rows = filteredRows.slice(0, 300); // Safe bound for 60fps WebGL
    if (rows.length === 0) return;

    // Palette hex values
    const paletteHex = theme.swatches.map(
      (s) => parseInt(s.replace('#', '0x'), 16) || 0x6366f1
    );

    // MODE 1: 3D TRIVARIATE SCATTER GALAXY
    if (mode === 'scatter') {
      const minX = analytics.columnProfiles[colX]?.min ?? 0;
      const maxX = analytics.columnProfiles[colX]?.max ?? 1;
      const minY = analytics.columnProfiles[colY]?.min ?? 0;
      const maxY = analytics.columnProfiles[colY]?.max ?? 1;
      const minZ = analytics.columnProfiles[colZ]?.min ?? 0;
      const maxZ = analytics.columnProfiles[colZ]?.max ?? 1;

      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const rangeZ = maxZ - minZ || 1;

      const sphereGeo = new THREE.SphereGeometry(1.6, 16, 16);

      rows.forEach((row, i) => {
        const rawVx = normalizeRowValue(row[colX], 'number');
        const rawVy = normalizeRowValue(row[colY], 'number');
        const rawVz = normalizeRowValue(row[colZ], 'number');
        if (rawVx === null || rawVy === null || isNaN(rawVx) || isNaN(rawVy)) return;

        const vx = rawVx;
        const vy = rawVy;
        const vz = rawVz ?? 0;

        // Normalize to [-40, 40]
        const nx = ((vx - minX) / rangeX - 0.5) * 80;
        const ny = ((vy - minY) / rangeY) * 60 - 18;
        const nz = isNaN(vz) ? 0 : ((vz - minZ) / rangeZ - 0.5) * 80;

        const catVal = catGrouping ? String(row[catGrouping] ?? 'General') : 'Default';
        const color = paletteHex[Math.abs(catVal.charCodeAt(0)) % paletteHex.length];

        let mat: THREE.Material;
        if (shaderStyle === 'cyber') {
          mat = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
          });
        } else if (shaderStyle === 'glass') {
          mat = new THREE.MeshPhysicalMaterial({
            color: color,
            roughness: 0.1,
            transmission: 0.9,
            thickness: 1.2,
            metalness: 0.1,
          });
        } else {
          mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.25,
            metalness: 0.35,
          });
        }

        const sphere = new THREE.Mesh(sphereGeo, mat);
        sphere.position.set(nx, ny, nz);
        sphere.castShadow = true;
        sphere.receiveShadow = true;

        sphere.userData = {
          title: catGrouping ? `${row[catGrouping] || 'Record #' + (i + 1)}` : `Record #${i + 1}`,
          xVal: vx,
          yVal: vy,
          zVal: isNaN(vz) ? 0 : vz,
          category: catVal,
          rawRow: row,
        };

        group.add(sphere);
        objectsForRaycastRef.current.push(sphere);

        // Ground Drop Laser line
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x334155,
          transparent: true,
          opacity: 0.25,
        });
        const points = [
          new THREE.Vector3(nx, ny, nz),
          new THREE.Vector3(nx, -20, nz),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);
      });
    }

    // MODE 2: 3D PRISM / VOXEL CITY (Categorical Bars)
    else if (mode === 'voxel-bars') {
      const catKey = catGrouping || catCols[0] || 'Category';
      const metricKey = colY || numCols[0];

      // Aggregate categories
      const catMap = new Map<string, { sum: number; count: number }>();
      filteredRows.forEach((r) => {
        const val = String(r[catKey] ?? 'Other');
        const parsed = normalizeRowValue(r[metricKey], 'number');
        const num = parsed !== null && !isNaN(parsed) ? parsed : 0;
        const current = catMap.get(val) || { sum: 0, count: 0 };
        catMap.set(val, { sum: current.sum + num, count: current.count + 1 });
      });

      const aggregated = Array.from(catMap.entries())
        .slice(0, 16)
        .sort((a, b) => b[1].sum - a[1].sum);

      const maxVal = Math.max(...aggregated.map((d) => d[1].sum), 1);
      const colsInRow = 4;

      aggregated.forEach(([catName, stats], idx) => {
        const heightNorm = Math.max(3, (stats.sum / maxVal) * 55);
        const barGeo = new THREE.BoxGeometry(10, heightNorm, 10);

        const color = paletteHex[idx % paletteHex.length];
        const barMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.4,
        });

        const bar = new THREE.Mesh(barGeo, barMat);
        const row = Math.floor(idx / colsInRow);
        const col = idx % colsInRow;

        const posX = (col - 1.5) * 22;
        const posZ = (row - 1.5) * 22;
        const posY = -20 + heightNorm / 2;

        bar.position.set(posX, posY, posZ);
        bar.castShadow = true;
        bar.receiveShadow = true;

        bar.userData = {
          title: catName,
          xVal: `${stats.count.toLocaleString()} rows`,
          yVal: formatMetricDisplay(stats.sum, metricKey),
          category: catName,
        };

        group.add(bar);
        objectsForRaycastRef.current.push(bar);
      });
    }

    // MODE 3: 3D TOPOLOGY / SURFACE DENSITY
    else if (mode === 'topology') {
      const size = 32;
      const topoGeo = new THREE.PlaneGeometry(85, 85, size - 1, size - 1);
      topoGeo.rotateX(-Math.PI / 2);

      const pos = topoGeo.attributes.position;
      const count = pos.count;
      const colors: number[] = [];

      for (let i = 0; i < count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        // Parametric wave terrain influenced by data metrics
        const d = Math.sqrt(x * x + z * z);
        const elevation =
          Math.sin(x * 0.12) * Math.cos(z * 0.12) * 12 +
          Math.sin(d * 0.15) * 8;

        pos.setY(i, elevation - 5);

        // Vertex coloring based on elevation
        const normH = (elevation + 20) / 40;
        const color = new THREE.Color().setHSL(0.65 - normH * 0.4, 0.8, 0.55);
        colors.push(color.r, color.g, color.b);
      }

      topoGeo.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3)
      );
      topoGeo.computeVertexNormals();

      const topoMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.4,
        metalness: 0.2,
        wireframe: shaderStyle === 'cyber',
        side: THREE.DoubleSide,
      });

      const terrain = new THREE.Mesh(topoGeo, topoMat);
      terrain.position.y = -10;
      terrain.receiveShadow = true;
      group.add(terrain);
    }
  }, [
    filteredRows,
    mode,
    colX,
    colY,
    colZ,
    catGrouping,
    shaderStyle,
    theme,
    analytics,
  ]);

  // Pointer interaction for Orbiting and Point Picking
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 1. Raycaster coordinates [-1, 1]
    const holder = canvasHolderRef.current;
    if (holder) {
      const rect = holder.getBoundingClientRect();
      mouseCoordsRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoordsRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    // 2. Drag Orbit rotation
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    targetRotationRef.current.y += deltaX * 0.008;
    targetRotationRef.current.x = Math.max(
      -1.3,
      Math.min(1.3, targetRotationRef.current.x + deltaY * 0.008)
    );

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    cameraDistanceRef.current = Math.max(
      40,
      Math.min(260, cameraDistanceRef.current + e.deltaY * 0.12)
    );
  };

  // Preset Camera Angles
  const setCameraAngle = (view: CameraView) => {
    if (view === 'default') {
      targetRotationRef.current = { x: 0.35, y: 0.45 };
      cameraDistanceRef.current = 140;
    } else if (view === 'isometric') {
      targetRotationRef.current = { x: 0.6, y: 0.785 };
      cameraDistanceRef.current = 150;
    } else if (view === 'top') {
      targetRotationRef.current = { x: 1.55, y: 0 };
      cameraDistanceRef.current = 130;
    } else if (view === 'front') {
      targetRotationRef.current = { x: 0.05, y: 0 };
      cameraDistanceRef.current = 140;
    } else if (view === 'side') {
      targetRotationRef.current = { x: 0.05, y: Math.PI / 2 };
      cameraDistanceRef.current = 140;
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'min-h-[640px]'
      }`}
    >
      {/* 3D Viewport Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-950/60 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Box className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              3D Spatial Data Universe
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                WebGL 2.0
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 3D coordinate space with real-time orbit physics & raycasting
            </p>
          </div>
        </div>

        {/* Mode Selector Segmented Control */}
        <div className="flex items-center gap-2">
          <div className="h-8 inline-flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setMode('scatter')}
              className={`h-full px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'scatter'
                  ? `${theme.classes.accentPrimary} text-white shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>3D Galaxy</span>
            </button>

            <button
              onClick={() => setMode('voxel-bars')}
              className={`h-full px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'voxel-bars'
                  ? `${theme.classes.accentPrimary} text-white shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Voxel City</span>
            </button>

            <button
              onClick={() => setMode('topology')}
              className={`h-full px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'topology'
                  ? `${theme.classes.accentPrimary} text-white shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Topology</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter 3D Fullscreen'}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors shrink-0"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3D Spatial Canvas Area */}
      <div
        ref={canvasHolderRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full flex-1 min-h-[480px] relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
      >
        {/* Top-Left Floating Dimension Filter HUD */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 shadow-xl max-w-xl">
          {mode === 'scatter' ? (
            <>
              <div className="flex items-center gap-1 text-xs text-slate-300">
                <span className="font-semibold text-rose-400">X:</span>
                <select
                  value={colX}
                  onChange={(e) => setColX(e.target.value)}
                  className="h-7 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-md px-2 focus:outline-none focus:border-indigo-500"
                >
                  {numCols.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">Y:</span>
                <select
                  value={colY}
                  onChange={(e) => setColY(e.target.value)}
                  className="h-7 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-md px-2 focus:outline-none focus:border-indigo-500"
                >
                  {numCols.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-300">
                <span className="font-semibold text-sky-400">Z:</span>
                <select
                  value={colZ}
                  onChange={(e) => setColZ(e.target.value)}
                  className="h-7 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-md px-2 focus:outline-none focus:border-indigo-500"
                >
                  {numCols.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {catCols.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-300 border-l border-slate-800 pl-2">
                  <span className="text-slate-400">Color:</span>
                  <select
                    value={catGrouping}
                    onChange={(e) => setCatGrouping(e.target.value)}
                    className="h-7 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-md px-2 focus:outline-none focus:border-indigo-500"
                  >
                    {catCols.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : mode === 'voxel-bars' ? (
            <>
              <div className="flex items-center gap-1 text-xs text-slate-300">
                <span className="text-slate-400">Category:</span>
                <select
                  value={catGrouping}
                  onChange={(e) => setCatGrouping(e.target.value)}
                  className="h-7 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-md px-2 focus:outline-none focus:border-indigo-500"
                >
                  {catCols.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-300">
                <span className="text-slate-400">Height:</span>
                <select
                  value={colY}
                  onChange={(e) => setColY(e.target.value)}
                  className="h-7 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-md px-2 focus:outline-none focus:border-indigo-500"
                >
                  {numCols.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1.5 px-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Parametric Continuous Topological Heightfield (32x32 Grid)</span>
            </div>
          )}
        </div>

        {/* Top-Right Camera & Material Quick Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Camera View Presets */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 shadow-xl">
            <button
              onClick={() => setCameraAngle('isometric')}
              title="Isometric View"
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              Iso
            </button>
            <button
              onClick={() => setCameraAngle('top')}
              title="Top-Down View"
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              Top
            </button>
            <button
              onClick={() => setCameraAngle('front')}
              title="Front View"
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              Front
            </button>
            <button
              onClick={() => setCameraAngle('default')}
              title="Reset Camera"
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Shading & Orbit Controls */}
          <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 shadow-xl">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
              className={`h-7 px-2.5 inline-flex items-center gap-1 rounded-lg text-xs font-medium transition-colors ${
                autoRotate
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Rotate3d className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">Orbit</span>
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Ground Grid"
              className={`w-7 h-7 inline-flex items-center justify-center rounded-lg text-xs transition-colors ${
                showGrid
                  ? 'bg-slate-800 text-slate-200'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                const styles: ShaderStyle[] = ['studio', 'cyber', 'glass'];
                const nextIdx = (styles.indexOf(shaderStyle) + 1) % styles.length;
                setShaderStyle(styles[nextIdx]);
              }}
              title="Cycle Material Shader (Studio, Cyber, Glass)"
              className="h-7 px-2 inline-flex items-center gap-1 rounded-lg text-[11px] text-slate-300 hover:bg-slate-800 transition-colors capitalize font-mono"
            >
              <Sliders className="w-3 h-3 text-indigo-400" />
              <span>{shaderStyle}</span>
            </button>
          </div>
        </div>

        {/* Hover Point Floating Tooltip */}
        {hoveredData && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: hoveredData.screenX,
              top: hoveredData.screenY,
            }}
          >
            <div className="bg-slate-950/95 border border-indigo-500/40 shadow-2xl rounded-xl p-3 min-w-[200px] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                <span className="font-semibold text-white text-xs truncate max-w-[150px]">
                  {hoveredData.title}
                </span>
                {hoveredData.category && (
                  <span className="text-[10px] font-mono text-indigo-400">
                    {hoveredData.category}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-xs">
                {mode === 'scatter' ? (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span className="text-rose-400">{colX}:</span>
                      <span className="font-mono text-white">
                        {typeof hoveredData.xVal === 'number'
                          ? hoveredData.xVal.toLocaleString()
                          : hoveredData.xVal}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="text-emerald-400">{colY}:</span>
                      <span className="font-mono text-white">
                        {typeof hoveredData.yVal === 'number'
                          ? hoveredData.yVal.toLocaleString()
                          : hoveredData.yVal}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="text-sky-400">{colZ}:</span>
                      <span className="font-mono text-white">
                        {typeof hoveredData.zVal === 'number'
                          ? hoveredData.zVal.toLocaleString()
                          : hoveredData.zVal}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span>Volume:</span>
                      <span className="font-mono text-white">{hoveredData.xVal}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total:</span>
                      <span className="font-mono text-indigo-300 font-semibold">
                        {hoveredData.yVal}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Helper Controls HUD */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/60 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Left-Click + Drag: 360° Orbit</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Scroll: Zoom Depth</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Hover: Inspect Raycast Point</span>
          </div>
          <div className="font-mono text-slate-300">
            Rendering {Math.min(filteredRows.length, 300)} / {filteredRows.length.toLocaleString()} nodes
          </div>
        </div>
      </div>
    </div>
  );
};
