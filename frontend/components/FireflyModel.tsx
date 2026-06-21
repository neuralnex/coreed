"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function FireflyModel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    camera.position.set(0, 0.5, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Glow sprite
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const ctx = glowCanvas.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(191,255,0,0.8)");
    g.addColorStop(0.15, "rgba(191,255,0,0.3)");
    g.addColorStop(0.4, "rgba(191,255,0,0.08)");
    g.addColorStop(1, "rgba(191,255,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);

    const spriteMat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(spriteMat);
    glow.scale.set(4, 4, 1);
    scene.add(glow);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfff00, 0.3);
    fill.position.set(-2, -1, -2);
    scene.add(fill);

    // State
    let model: THREE.Group | null = null;
    let origPos: Float32Array | null = null;
    let geom: THREE.BufferGeometry | null = null;
    const wingThreshold = 0.35;

    new GLTFLoader().load(
      "/models/firefly.glb",
      (gltf) => {
        model = gltf.scene;
        model.position.y = 0.1;
        scene.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        if (Math.max(size.x, size.y, size.z) > 2)
          model.scale.setScalar(2 / Math.max(size.x, size.y, size.z));

        // Find the mesh and store original positions
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            geom = child.geometry;
            const pos = geom!.attributes.position;
            origPos = new Float32Array(pos.array);
          }
        });
      },
      undefined,
      (err) => console.error("GLB error:", err)
    );

    // Animation
    let animId: number;
    let t = 0;

    function animate() {
      t += 0.016;

      if (model) {
        model.rotation.y += 0.006;
        model.position.y = 0.1 + Math.sin(t * 1.2) * 0.04;
      }

      // Wing flap by directly modifying vertex positions
      if (geom && origPos) {
        const pos = geom.attributes.position.array as Float32Array;
        const flapAngle = Math.sin(t * 10) * 0.45;

        for (let i = 0; i < pos.length; i += 3) {
          const x = origPos[i];
          const y = origPos[i + 1];
          const z = origPos[i + 2];
          const ax = Math.abs(x);

          if (ax > wingThreshold && y > -0.1) {
            const wingFactor = Math.min(1, (ax - wingThreshold) / 0.4);
            const hingeX = Math.sign(x) * wingThreshold;
            const angle = flapAngle * wingFactor;
            const dx = x - hingeX;
            const dy = y - 0.05;
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            pos[i] = hingeX + dx * c - dy * s;
            pos[i + 1] = 0.05 + dx * s + dy * c;
          } else {
            pos[i] = x;
            pos[i + 1] = y;
          }
        }
        geom.attributes.position.needsUpdate = true;
        geom.computeVertexNormals();
      }

      spriteMat.opacity = 0.3 + Math.sin(t * 2) * 0.15;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }

    animate();

    const resize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
