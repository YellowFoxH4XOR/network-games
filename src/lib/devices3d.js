/**
 * Content for the Visualize section — what each device is and what its ports mean.
 * Kept separate from the 3D rendering (Visualize.jsx) so the educational copy is
 * easy to edit without touching geometry. Colors are concrete hex (three.js can't
 * read the app's oklch CSS variables).
 *
 * Restrained, role-based palette (light theme — calm, not neon):
 *   teal  #3a9fa7  → internal data ports (access / lan / pool)
 *   coral #c54536  → external / upstream links (uplink / wan / vip)
 *   slate #7e8893  → management & status (console / health)
 * Chassis bodies are a near-neutral light grey, faintly tinted per device so the
 * three devices stay distinguishable without adding loud color.
 */
import { stallIndex } from '../data.js';

export const DEVICES = [
  {
    id: 'switch',
    name: 'Switch',
    tagline: 'Layer 2 · MAC forwarding',
    accent: '#3a9fa7',
    body: '#c2cdd0',
    logo: '/logos/cisco.png',
    logoWidth: 0.95,
    blurb: 'Forwards Ethernet frames between devices on the same LAN using a learned MAC-address table.',
    size: [3.4, 0.5, 1.3],
    antennas: 0,
    groups: [
      {
        id: 'access', label: 'Access ports', count: 24, color: '#3a9fa7',
        detail: 'Connect end devices — PCs, phones, printers. Each port is its own collision domain and typically carries one access VLAN.',
      },
      {
        id: 'uplink', label: 'SFP uplinks', count: 2, color: '#c54536',
        detail: 'High-speed fibre links to the distribution or core switch, carrying aggregated traffic from every access port.',
      },
      {
        id: 'console', label: 'Console port', count: 1, color: '#7e8893',
        detail: 'Out-of-band management. Plug a laptop in over serial/USB to reach the CLI even when the network is down.',
      },
    ],
  },
  {
    id: 'router',
    name: 'Router',
    tagline: 'Layer 3 · IP routing',
    accent: '#6f98c8',
    body: '#c4cbd6',
    logo: '/logos/cisco.png',
    logoWidth: 0.8,
    blurb: 'Routes IP packets between different networks and connects your LAN to the internet.',
    size: [2.4, 0.6, 1.5],
    antennas: 2,
    groups: [
      {
        id: 'wan', label: 'WAN port', count: 1, color: '#c54536',
        detail: 'Uplink to your ISP — the public-facing interface where NAT and the default route live.',
      },
      {
        id: 'lan', label: 'LAN ports', count: 4, color: '#3a9fa7',
        detail: 'Internal ports for your local network. Hosts here share the router’s private subnet and gateway.',
      },
      {
        id: 'console', label: 'Console port', count: 1, color: '#7e8893',
        detail: 'Serial management port for CLI configuration and password recovery.',
      },
    ],
  },
  {
    id: 'loadbalancer',
    name: 'Load Balancer',
    tagline: 'Layer 4–7 · traffic distribution',
    accent: '#8a6fb0',
    body: '#cac6d2',
    logo: '/logos/f5.png',
    logoWidth: 0.5,
    blurb: 'Spreads incoming client traffic across a pool of backend servers for scale and resilience.',
    size: [2.8, 0.7, 1.5],
    antennas: 0,
    groups: [
      {
        id: 'vip', label: 'Virtual IP (VIP)', count: 1, color: '#c54536',
        detail: 'The single public address clients connect to. The balancer terminates connections here before choosing a backend.',
      },
      {
        id: 'pool', label: 'Backend pool', count: 6, color: '#3a9fa7',
        detail: 'Links to the real servers. Traffic is spread by an algorithm — round-robin, least-connections, weighted, and so on.',
      },
      {
        id: 'health', label: 'Health-check LED', count: 1, color: '#7e8893',
        detail: 'Reflects active health probes. Unhealthy backends are automatically pulled out of rotation.',
      },
    ],
  },
];

/**
 * Per-stall device ordering. With only three devices and four stalls there
 * can't be a fully unique set per stall, so each stall leads with a different
 * device (rotated order) to give the visualization some per-stall flavor.
 */
export function getStallDevices(slug) {
  const r = stallIndex(slug) % DEVICES.length;
  return DEVICES.slice(r).concat(DEVICES.slice(0, r));
}
