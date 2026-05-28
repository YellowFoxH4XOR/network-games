import { useState, useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, RoundedBox, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import TopBar from './TopBar.jsx';
import { DEVICES } from '../lib/devices3d.js';

/**
 * Lay device groups out as individual port meshes on the front face (+Z).
 * Geometry lives here; the educational copy lives in lib/devices3d.js.
 * Every port carries its group's label/detail so a tap can explain it.
 */
function buildPorts(device) {
  const z = device.size[2] / 2 + 0.04;
  const ports = [];
  const byId = id => device.groups.find(g => g.id === id);
  const push = (g, x, y, extra = {}) =>
    ports.push({
      key: `${g.id}-${ports.length}`, groupId: g.id, color: g.color,
      label: g.label, detail: g.detail, position: [x, y, z], ...extra,
    });

  if (device.id === 'switch') {
    const cols = 12, x0 = -1.25, x1 = 0.95, step = (x1 - x0) / (cols - 1);
    const access = byId('access');
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < cols; c++) push(access, x0 + c * step, r === 0 ? 0.09 : -0.09);
    const uplink = byId('uplink');
    push(uplink, 1.3, 0.09); push(uplink, 1.3, -0.09);
    push(byId('console'), -1.5, 0);
  } else if (device.id === 'router') {
    push(byId('wan'), -0.95, 0);
    [-0.5, -0.2, 0.1, 0.4].forEach(x => push(byId('lan'), x, 0));
    push(byId('console'), 0.85, 0);
  } else if (device.id === 'loadbalancer') {
    push(byId('vip'), -1.0, 0.08, { size: [0.24, 0.18, 0.07] });
    const pool = byId('pool');
    for (let r = 0; r < 2; r++)
      for (const x of [0.2, 0.6, 1.0]) push(pool, x, r === 0 ? 0.13 : -0.13);
    push(byId('health'), -1.0, device.size[1] / 2, { size: [0.1, 0.05, 0.1] });
  }
  return ports;
}

function Port({ instance, active, onSelect }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.material.emissiveIntensity = active
      ? 2.2 + Math.sin(state.clock.elapsedTime * 5) * 0.7
      : 1.4;
  });
  return (
    <mesh
      ref={ref}
      position={instance.position}
      scale={active ? 1.3 : 1}
      onClick={(e) => { e.stopPropagation(); onSelect(instance); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <boxGeometry args={instance.size || [0.16, 0.12, 0.07]} />
      <meshStandardMaterial
        color={instance.color} emissive={instance.color}
        emissiveIntensity={1.4} toneMapped={false} metalness={0.1} roughness={0.35}
      />
    </mesh>
  );
}

/** Brand logo as a textured plane laid on the top-front of the chassis. */
function Logo({ src, width, position, rotation }) {
  const tex = useTexture(src);
  const img = tex.image;
  const aspect = img && img.height ? img.width / img.height : 2;
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, width / aspect]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

function DeviceModel({ device, ports, selectedGroup, onSelect }) {
  const [w, h, d] = device.size;
  return (
    <group>
      {/* Colourful glossy chassis */}
      <RoundedBox args={device.size} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={device.body} metalness={0.55} roughness={0.3} />
      </RoundedBox>

      {/* Dark front panel so the glowing ports pop */}
      <mesh position={[0, 0, d / 2 + 0.005]}>
        <boxGeometry args={[w * 0.97, h * 0.82, 0.05]} />
        <meshStandardMaterial color="#0b0f17" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Bright accent strip along the top-front edge */}
      <mesh position={[0, h / 2 - 0.04, d / 2 - 0.01]}>
        <boxGeometry args={[w * 0.96, 0.03, 0.02]} />
        <meshStandardMaterial color={device.accent} emissive={device.accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* Antennas (routers) */}
      {Array.from({ length: device.antennas || 0 }).map((_, i) => {
        const x = device.antennas === 1 ? 0 : (i === 0 ? -0.75 : 0.75);
        return (
          <mesh key={i} position={[x, h / 2 + 0.45, -d / 2 + 0.12]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.9, 12]} />
            <meshStandardMaterial color={device.accent} metalness={0.4} roughness={0.45} />
          </mesh>
        );
      })}

      {/* Brand logo on the top-front of the chassis */}
      {device.logo && (
        <Suspense fallback={null}>
          <Logo
            src={device.logo}
            width={device.logoWidth || 0.7}
            position={[0, h / 2 + 0.005, d * 0.2]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        </Suspense>
      )}

      {ports.map(p => (
        <Port key={p.key} instance={p} active={selectedGroup === p.groupId} onSelect={onSelect} />
      ))}
    </group>
  );
}

/**
 * Smoothly flies the camera to a focused port, or back to the overview when
 * cleared. Once a "home" (overview) move settles, it calls onHome so the parent
 * can drop the focus and let auto-rotate resume from the default framing.
 */
function CameraRig({ focus, controlsRef, onHome }) {
  const { camera } = useThree();
  const prev = useRef(null);
  const settled = useRef(false);
  useFrame(() => {
    const c = controlsRef.current;
    if (!focus || !c) return;
    if (prev.current !== focus) { prev.current = focus; settled.current = false; }
    if (settled.current) return;
    camera.position.lerp(focus.pos, 0.1);
    c.target.lerp(focus.target, 0.1);
    c.update();
    if (camera.position.distanceTo(focus.pos) < 0.08) {
      settled.current = true;
      if (focus.home) onHome();
    }
  });
  return null;
}

const DEFAULT_CAM = [0, 1.7, 5.2];

export default function Visualize({ onBack }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(null);
  const controlsRef = useRef();

  const device = DEVICES[index];
  const ports = useMemo(() => buildPorts(device), [device]);

  // Fly the camera back to the overview, then resume auto-rotate (via onHome).
  const goHome = () => setFocus({
    pos: new THREE.Vector3(...DEFAULT_CAM),
    target: new THREE.Vector3(0, 0, 0),
    home: true,
  });
  const clear = () => { setSelected(null); goHome(); };
  const pickDevice = (i) => { setIndex(i); setSelected(null); goHome(); };

  const selectPort = (inst) => {
    setSelected(inst);
    setFocus({
      pos: new THREE.Vector3(inst.position[0] * 0.45, inst.position[1] + 0.9, inst.position[2] + 2.6),
      target: new THREE.Vector3(...inst.position),
      home: false,
    });
  };

  return (
    <div className="screen" style={{ padding: '0 0 32px' }}>
      <TopBar onBack={onBack} title="Visualize" />

      {/* Device tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 22px 0', animation: 'fadeDown 0.4s var(--ease-out)' }}>
        {DEVICES.map((d, i) => {
          const on = i === index;
          return (
            <button
              key={d.id}
              onClick={() => pickDevice(i)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                background: on ? 'var(--bg2)' : 'transparent',
                border: `1px solid ${on ? 'var(--b2)' : 'var(--b1)'}`,
                boxShadow: on ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s var(--ease-out)',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', margin: '0 auto 6px', background: d.accent, boxShadow: on ? `0 0 10px ${d.accent}` : 'none' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: on ? 'var(--text)' : 'var(--text3)' }}>{d.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3D stage */}
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{
          height: 'min(46vh, 360px)', borderRadius: 18, overflow: 'hidden',
          border: '1px solid var(--b1)', boxShadow: 'var(--shadow-sm)',
          background: `radial-gradient(circle at 50% 38%, color-mix(in oklch, ${device.accent} 26%, #0c1322) 0%, #070b13 72%)`,
        }}>
          <Canvas
            shadows dpr={[1, 2]} camera={{ position: [0, 1.7, 5.2], fov: 40 }}
            gl={{ alpha: true }}
            onPointerMissed={() => { if (selected) clear(); }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[4, 6, 4]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
            <spotLight position={[0, 5, 6]} angle={0.6} penumbra={0.7} intensity={1.4} />
            <pointLight position={[-4, 1, -3]} intensity={1.0} color={device.accent} />
            <pointLight position={[4, 0, -3]} intensity={0.6} color="#ffffff" />
            <DeviceModel device={device} ports={ports} selectedGroup={selected?.groupId} onSelect={selectPort} />
            <ContactShadows position={[0, -device.size[1] / 2 - 0.01, 0]} opacity={0.5} scale={12} blur={2.6} far={4} />
            <OrbitControls
              ref={controlsRef} makeDefault enableDamping enablePan={false}
              autoRotate={!focus} autoRotateSpeed={0.8} minDistance={3} maxDistance={9}
              minPolarAngle={0.7} maxPolarAngle={Math.PI / 2.05}
            />
            <CameraRig focus={focus} controlsRef={controlsRef} onHome={() => setFocus(null)} />
          </Canvas>
        </div>
      </div>

      {/* Info panel */}
      <div style={{ padding: '16px 22px 0' }}>
        <div className="grad-border">
          <div style={{ background: 'var(--bg2)', borderRadius: 18.5, padding: '18px 20px', minHeight: 120 }}>
            {selected ? (
              <div style={{ animation: 'fadeUp 0.3s var(--ease-out)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: selected.color, boxShadow: `0 0 12px ${selected.color}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{selected.label}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{selected.detail}</p>
                <button
                  onClick={clear}
                  style={{
                    marginTop: 14, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    background: 'var(--bg2)', border: '1px solid var(--b1)', boxShadow: 'var(--shadow-sm)',
                    fontSize: 12, fontWeight: 700, color: 'var(--text2)',
                  }}
                >
                  ↺ Overview
                </button>
              </div>
            ) : (
              <div style={{ animation: 'fadeUp 0.3s var(--ease-out)' }}>
                <span className="label" style={{ color: device.accent }}>{device.tagline}</span>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', margin: '6px 0 8px', color: 'var(--text)' }}>{device.name}</div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{device.blurb}</p>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text4)', letterSpacing: '0.06em' }}>
                  ◈ TAP A GLOWING PORT · DRAG TO ROTATE
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
