"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const HUB = { name: "Aicoo", sub: "hub", color: "#7c3aed" } as const;

interface AgentNode {
  name: string;
  score: number;
  color: string;
  role: string;
}

const AGENTS: AgentNode[] = [
  { name: "Backend", score: 76, color: "#10b981", role: "Backend Agent" },
  { name: "Frontend", score: 68, color: "#10b981", role: "Frontend Agent" },
  { name: "DevOps", score: 68, color: "#10b981", role: "DevOps Agent" },
  { name: "AI/ML", score: 60, color: "#f59e0b", role: "AI/ML Agent" },
  { name: "UI/UX", score: 60, color: "#f59e0b", role: "UI/UX Agent" },
  { name: "QA", score: 60, color: "#f59e0b", role: "QA Agent" },
];

const STAR_COUNT = 900;

// Hex positions: 6 nodes around center in a flat hex grid
// row offsets give the hex "stagger"
const HEX_POSITIONS: [number, number][] = [
  [0, -2.8],    // top: AI/ML
  [-2.4, -1.0], // top-left: DevOps
  [2.4, -1.0],  // top-right: Frontend
  [-2.4, 1.0],  // bottom-left: Backend
  [2.4, 1.0],   // bottom-right: UI/UX
  [0, 2.8],     // bottom: QA
];

// ---------------------------------------------------------------------------
// Rounded-rect shape (for ExtrudeGeometry -> flat card)
// ---------------------------------------------------------------------------
function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Topology3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<AgentNode | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x0a0a0f, 1);
    container.appendChild(renderer.domElement);

    // ── Label renderer ───────────────────────────────────────────────────────
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.left = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    container.appendChild(labelRenderer.domElement);

    // ── Scene + camera (isometric-ish tilt) ──────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.008);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200);
    camera.position.set(0, 14, 12);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 12;
    controls.maxDistance = 30;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2.2;

    // ── Root group ───────────────────────────────────────────────────────────
    const root = new THREE.Group();
    scene.add(root);

    // ── Lighting ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.8));
    const key = new THREE.PointLight(0x8b5cf6, 1.4, 60);
    key.position.set(4, 10, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x06b6d4, 0.6, 60);
    rim.position.set(-6, 6, -6);
    scene.add(rim);

    // ── Starfield ────────────────────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starCol = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 16 + Math.random() * 24;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
      const t = 0.55 + Math.random() * 0.45;
      starCol[i * 3] = t;
      starCol[i * 3 + 1] = t;
      starCol[i * 3 + 2] = t * (0.85 + Math.random() * 0.15);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Grid floor (subtle) ──────────────────────────────────────────────────
    const gridHelper = new THREE.GridHelper(20, 20, 0x1f1f27, 0x1f1f27);
    gridHelper.position.y = -0.6;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    root.add(gridHelper);

    // ── Hub (rounded rect, flat, glowing) ────────────────────────────────────
    const hubShape = roundedRectShape(2.8, 1.4, 0.25);
    const hubGeo = new THREE.ExtrudeGeometry(hubShape, {
      depth: 0.18,
      bevelEnabled: false,
    });
    hubGeo.rotateX(-Math.PI / 2);

    const hubMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(HUB.color),
      emissive: new THREE.Color(HUB.color),
      emissiveIntensity: 1.6,
      roughness: 0.3,
      metalness: 0.1,
    });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.layers.enable(1);
    root.add(hubMesh);

    // Hub glow plane (additive)
    const hubGlowGeo = new THREE.PlaneGeometry(3.6, 2.2);
    const hubGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(HUB.color),
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hubGlow = new THREE.Mesh(hubGlowGeo, hubGlowMat);
    hubGlow.rotation.x = -Math.PI / 2;
    hubGlow.position.y = 0.01;
    hubGlow.layers.enable(1);
    root.add(hubGlow);

    // Hub label
    const hubLabelDiv = document.createElement("div");
    hubLabelDiv.className = "topology-label topology-label-hub";
    hubLabelDiv.innerHTML = `<span class="tl-title">${HUB.name}</span><span class="tl-sub">${HUB.sub}</span>`;
    const hubLabel = new CSS2DObject(hubLabelDiv);
    hubLabel.position.set(0, 1.2, 0);
    root.add(hubLabel);

    // ── Agent nodes (flat rounded-rect cards) + routes + particles ───────────
    const nodeMeshes: THREE.Mesh[] = [];
    const routeLines: THREE.Line[] = [];
    const routeParticles: THREE.Points[] = [];
    const routeParticleProgress: number[] = [];

    AGENTS.forEach((agent, i) => {
      const [x, z] = HEX_POSITIONS[i];

      // Card
      const cardShape = roundedRectShape(2.2, 1.0, 0.18);
      const cardGeo = new THREE.ExtrudeGeometry(cardShape, {
        depth: 0.12,
        bevelEnabled: false,
      });
      cardGeo.rotateX(-Math.PI / 2);

      const cardMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(agent.color),
        emissive: new THREE.Color(agent.color),
        emissiveIntensity: 0.9,
        roughness: 0.45,
        metalness: 0.1,
      });
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.position.set(x, 0, z);
      cardMesh.layers.enable(1);
      cardMesh.userData = { agent, baseY: 0 };
      root.add(cardMesh);
      nodeMeshes.push(cardMesh);

      // Card glow plane
      const glowGeo = new THREE.PlaneGeometry(2.6, 1.4);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(agent.color),
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.rotation.x = -Math.PI / 2;
      glowMesh.position.set(x, 0.02, z);
      glowMesh.layers.enable(1);
      root.add(glowMesh);

      // Node label
      const labelDiv = document.createElement("div");
      labelDiv.className = "topology-label";
      labelDiv.innerHTML = `<span class="tl-title">${agent.name}</span><span class="tl-score" style="color:${agent.color}">${agent.score}%</span>`;
      const label = new CSS2DObject(labelDiv);
      label.position.set(0, 0.9, 0);
      cardMesh.add(label);

      // Route line (from hub edge toward node)
      const nodeWorldPos = new THREE.Vector3(x, 0, z);
      const dir = nodeWorldPos.clone().normalize();
      const hubEdge = dir.clone().multiplyScalar(1.6); // start just outside hub card
      const nodeEdge = nodeWorldPos.clone().sub(dir.clone().multiplyScalar(1.3)); // end just outside node card

      const lineGeo = new THREE.BufferGeometry().setFromPoints([hubEdge, nodeEdge]);
      const lineMat = new THREE.LineDashedMaterial({
        color: new THREE.Color(agent.color),
        dashSize: 0.2,
        gapSize: 0.14,
        transparent: true,
        opacity: 0.45,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      root.add(line);
      routeLines.push(line);

      // Traveling particle
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
      const pMat = new THREE.PointsMaterial({
        color: new THREE.Color(agent.color),
        size: 0.18,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particle = new THREE.Points(pGeo, pMat);
      particle.layers.enable(1);
      root.add(particle);
      routeParticles.push(particle);
      routeParticleProgress.push(Math.random());
    });

    // ── Postprocessing ───────────────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.8, 0.65, 0.15);
    composer.addPass(bloom);

    // ── Hover raycaster ──────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-99, -99);
    let hovered: THREE.Mesh | null = null;

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    // ── Auto-rotation pause ──────────────────────────────────────────────────
    let userInteracting = false;
    let resumeAt = 0;
    function onStart() { userInteracting = true; }
    function onEnd() { resumeAt = performance.now() + 1200; userInteracting = false; }
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    // ── Resize ───────────────────────────────────────────────────────────────
    function onResize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
      composer.setSize(w, h);
      bloom.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    // ── Animation loop ───────────────────────────────────────────────────────
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tmpVec = new THREE.Vector3();

    function tick() {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      elapsed += dt;

      // Gentle auto-rotate (pause on drag)
      if (!userInteracting && performance.now() > resumeAt) {
        root.rotation.y += dt * 0.12;
      }

      // Hub pulse
      const pulse = 1 + Math.sin(elapsed * 1.6) * 0.02;
      hubMesh.scale.set(pulse, 1, pulse);
      hubGlow.scale.set(pulse, 1, pulse);

      // Hover raycast
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(nodeMeshes, false);
      const hit = hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;

      if (hit !== hovered) {
        hovered = hit;
        if (hit) {
          setHover(hit.userData.agent as AgentNode);
          document.body.style.cursor = "pointer";
        } else {
          setHover(null);
          document.body.style.cursor = "";
        }
      }

      // Lerp node elevation on hover
      for (const mesh of nodeMeshes) {
        const targetY = mesh === hovered ? 0.35 : 0;
        mesh.position.y += (targetY - mesh.position.y) * 0.12;
      }

      // Traveling particles
      for (let i = 0; i < routeParticles.length; i++) {
        routeParticleProgress[i] = (routeParticleProgress[i] + dt * 0.3) % 1;
        const p = routeParticleProgress[i];
        const [nx, nz] = HEX_POSITIONS[i];
        const dir = new THREE.Vector3(nx, 0, nz).normalize();
        const hubEdge = dir.clone().multiplyScalar(1.6);
        const nodeEdge = new THREE.Vector3(nx, 0, nz).sub(dir.clone().multiplyScalar(1.3));
        tmpVec.lerpVectors(hubEdge, nodeEdge, p);
        tmpVec.y = 0.08;
        const attr = routeParticles[i].geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.setXYZ(0, tmpVec.x, tmpVec.y, tmpVec.z);
        attr.needsUpdate = true;
        (routeParticles[i].material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(p * Math.PI) * 0.5;
      }

      controls.update();
      composer.render();
      labelRenderer.render(scene, camera);
    }
    tick();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      controls.dispose();

      scene.traverse((obj) => {
        const o = obj as { geometry?: { dispose?: () => void }; material?: THREE.Material | THREE.Material[] };
        if (o.geometry?.dispose) o.geometry.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else if (o.material) o.material.dispose();
      });

      composer.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      if (labelRenderer.domElement.parentNode) labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full" style={{ height: 440 }}>
      <div ref={containerRef} className="absolute inset-0" />

      {hover && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-3 z-10 px-3 py-2 rounded-lg border text-xs shadow-lg backdrop-blur-md"
          style={{
            borderColor: `${hover.color}66`,
            backgroundColor: "rgba(10,10,15,0.88)",
            color: "var(--text-primary)",
            boxShadow: `0 0 18px ${hover.color}33`,
          }}
        >
          <div className="font-semibold">{hover.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hover.color }} />
            <span style={{ color: hover.color }}>{hover.score}% match</span>
            <span className="text-[color:var(--text-muted)] ml-1">{hover.role}</span>
          </div>
        </div>
      )}
    </div>
  );
}
