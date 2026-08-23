import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CityWebGLScene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.3, 7.5);

    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // Particle constellation starfield
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color('#FF6B35'), // Saffron
      new THREE.Color('#10B981'), // Jade Emerald
      new THREE.Color('#FFAA64'), // Amber Highlight
      new THREE.Color('#34D399'), // Mint Jade
      new THREE.Color('#134E42')  // Deep Emerald
    ];

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const radius = 1.2 + Math.random() * 3.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;

      starPos[idx] = radius * Math.cos(theta) * Math.cos(phi);
      starPos[idx + 1] = radius * Math.sin(phi) * 0.7;
      starPos[idx + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[idx] = c.r;
      starColors[idx + 1] = c.g;
      starColors[idx + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeo, starMat);
    orbitGroup.add(stars);

    // Orbital Rings
    const ringConfigs = [
      { radius: 2.4, yScale: 0.75, rotZ: -0.28, rotX: 0.35, color: '#FF6B35', opacity: 0.45 },
      { radius: 1.9, yScale: 0.62, rotZ: 0.42, rotX: -0.25, color: '#10B981', opacity: 0.4 },
      { radius: 1.45, yScale: 0.48, rotZ: -0.75, rotX: 0.15, color: '#FFAA64', opacity: 0.35 }
    ];

    ringConfigs.forEach(({ radius, yScale, rotZ, rotX, color, opacity }) => {
      const pts = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * yScale, 0));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const ringMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity
      });
      const ringMesh = new THREE.Line(ringGeo, ringMat);
      ringMesh.rotation.z = rotZ;
      ringMesh.rotation.x = rotX;
      orbitGroup.add(ringMesh);
    });

    // Central Core Pulse (Hyderabad Node)
    const coreGeo = new THREE.SphereGeometry(0.24, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF6B35 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    orbitGroup.add(core);

    const haloGeo = new THREE.SphereGeometry(0.42, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xFF6B35,
      transparent: true,
      opacity: 0.15
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    orbitGroup.add(halo);

    // Orbiting Venue Nodes
    const venueNodes = [
      { pos: [-1.8, 0.75, 0.2], color: '#10B981' },
      { pos: [1.6, 0.85, -0.2], color: '#F59E0B' },
      { pos: [1.85, -0.7, 0.1], color: '#8B5CF6' },
      { pos: [-1.5, -0.85, -0.15], color: '#3B82F6' },
      { pos: [0.1, 1.4, 0.3], color: '#EB5E28' }
    ];

    venueNodes.forEach(({ pos, color }) => {
      const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(...pos);
      orbitGroup.add(node);
    });

    // Pointer interactivity
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove);

    const handleResize = () => {
      if (!host || !renderer) return;
      const { width, height } = host.getBoundingClientRect();
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pr);
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);
    handleResize();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animId;

    const animate = (time) => {
      const t = time * 0.001;

      // Smooth pointer interpolation
      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;

      if (!reducedMotion) {
        orbitGroup.rotation.y = t * 0.09 + pointer.x * 0.25;
        orbitGroup.rotation.x = Math.sin(t * 0.2) * 0.05 - pointer.y * 0.18;
        stars.rotation.y = t * 0.02;

        const pulse = 1 + Math.sin(t * 2.5) * 0.08;
        core.scale.setScalar(pulse);
        halo.scale.setScalar(pulse * 1.05);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      starGeo.dispose();
      starMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="webgl-orbit-canvas"
      aria-label="Interactive 3D WebGL Cultural Signal Orbit"
    />
  );
}
