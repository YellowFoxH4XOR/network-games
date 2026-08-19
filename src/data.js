export const NETWORK_KEYWORDS = [
  'PING', 'PORT', 'PROXY', 'ROUTER', 'SWITCH', 'MODEM', 'BRIDGE', 'FIBER',
  'TOKEN', 'PACKET', 'FRAME', 'SUBNET', 'GATEWAY', 'FIREWALL', 'ETHERNET',
  'WIFI', 'SOCKET', 'DOMAIN', 'SERVER', 'CLIENT', 'NODE', 'LINK', 'CACHE',
  'CLOUD', 'HOST', 'BYTE', 'VLAN', 'DHCP', 'HTTP', 'SMTP', 'PROTOCOL',
  'BANDWIDTH', 'LATENCY', 'TOPOLOGY', 'NETWORK', 'ENCRYPT', 'PAYLOAD',
  'HANDSHAKE', 'DOWNLOAD', 'UPLOAD', 'STREAM', 'ROUTING', 'TUNNEL',
  'TELNET', 'TRACERT', 'NETMASK', 'UNICAST', 'DUPLEX', 'SEGMENT', 'DATAGRAM',
];

// ALL questions are strictly NETWORKING-related and centred on network gear —
// switches, routers, load balancers, firewalls — plus the everyday concepts
// (Wi-Fi, IP, DNS, cables, the cloud) that go with them.
// Difficulty: EASY / beginner. The concept in each question is basic, but the
// wrong options are real networking things (often another device's actual job),
// so you must read them — the answer isn't a giveaway.
//
// NOTE: `correct` positions vary across the set, but never rely on that for
// fairness — quizRound() reshuffles every question's options at runtime so the
// answer's index is randomised per play. See quizRound()/shuffleOptions() below.
const Q = (question, options, correct) => ({ question, options, correct });

export const QUIZ_QUESTIONS = [
  // ── SWITCHES ────────────────────────────────────────────────
  Q('What does a network switch mainly do?', ['Connects several devices together on the same local network', 'Connects your home to the internet provider', 'Blocks unsafe traffic from the network', 'Spreads traffic across many servers'], 0),
  Q('Which device connects many computers together in one office network?', ['A modem', 'A switch', 'A firewall', 'A microphone'], 1),
  Q('A switch usually connects devices using what?', ['Radio satellites', 'Power cords only', 'Network (Ethernet) cables', 'HDMI cables'], 2),
  Q('When a switch receives data, it tries to send it to…?', ['Every device on the internet', 'The nearest phone', 'A random server', 'The correct device it is meant for'], 3),
  Q('Where would you most likely find a network switch?', ['Connecting computers in an office', 'Inside a phone battery', 'On a weather satellite', 'In a TV remote'], 0),

  // ── ROUTERS ─────────────────────────────────────────────────
  Q('What does a router mainly do?', ['Stores your photos and files', 'Connects your network to other networks like the internet', 'Cools down the computer', 'Scans USB sticks for viruses'], 1),
  Q('Which device lets all your home devices share one internet connection?', ['A printer', 'A monitor', 'A router', 'A keyboard'], 2),
  Q('What does a home Wi-Fi router give you?', ['Free electricity', 'Extra storage space', 'A louder speaker', 'Wireless internet access in your home'], 3),
  Q('A router decides where to send data so it reaches the…?', ['Right destination network', 'Nearest power outlet', 'Closest printer', 'Brightest screen'], 0),
  Q('Which device usually connects your home network to the internet?', ['A router', 'A webcam', 'A speaker', 'A game controller'], 0),

  // ── LOAD BALANCERS ──────────────────────────────────────────
  Q('What does a load balancer do?', ['Stores all the passwords', 'Spreads incoming traffic across several servers', 'Connects cables together', 'Charges the servers'], 1),
  Q('Why do busy websites use a load balancer?', ['To make the text bigger', 'To save electricity at night', 'So no single server gets overloaded', 'To print reports'], 2),
  Q('A load balancer helps a website stay…?', ['Colourful', 'Quiet', 'Offline', 'Fast and available even with many visitors'], 3),
  Q('If one server stops working, a load balancer can…?', ['Send traffic to the other working servers', 'Turn off the whole internet', 'Email everyone', 'Restart your phone'], 0),
  Q('A load balancer is most useful when a website has…?', ['Only one visitor a day', 'A lot of visitors at once', 'No servers at all', 'A broken keyboard'], 1),

  // ── FIREWALLS ───────────────────────────────────────────────
  Q('What does a firewall do?', ['Speeds up downloads', 'Filters network traffic to block unwanted or unsafe connections', 'Stores your files', 'Charges your devices'], 1),
  Q('A firewall mainly helps with…?', ['Screen brightness', 'Battery life', 'Security — controlling what traffic is allowed', 'Printing documents'], 2),
  Q('Which device acts as a barrier between your network and online threats?', ['A modem', 'A switch', 'A webcam', 'A firewall'], 3),
  Q('A firewall is designed to block…?', ['Suspicious or unauthorised network traffic', 'Sunlight', 'Loud noises', 'Phone calls only'], 0),
  Q('If a connection looks unsafe, a firewall will usually…?', ['Allow it anyway', 'Block or stop it', 'Print it', 'Save it to the cloud'], 1),

  // ── MODEMS / ACCESS POINTS / WI-FI ──────────────────────────
  Q('What does a modem do?', ['Connects devices on your local network', 'Blocks online threats', 'Connects your home to your internet service provider', 'Balances traffic across servers'], 2),
  Q('What does a wireless access point provide?', ['Wired power', 'Extra storage', 'A louder sound', 'Wi-Fi so devices can connect without cables'], 3),
  Q('How does Wi-Fi let devices connect?', ['Wirelessly, using radio signals', 'Only with cables', 'Using sunlight', 'Using sound waves'], 0),
  Q('What does the Wi-Fi symbol on your phone show?', ['Battery level', 'Wireless signal strength', 'Storage space', 'Volume'], 1),
  Q('A stronger Wi-Fi signal usually means…?', ['A dead battery', 'A broken phone', 'Faster, more reliable internet', 'Less storage'], 2),
  Q('What is a "hotspot"?', ['A hot meal', 'A warm room', 'A speaker', 'A device or phone that shares its internet'], 3),
  Q('What does a Wi-Fi extender do?', ['Increases the range of your Wi-Fi', 'Charges your devices', 'Stores your files', 'Prints pages'], 0),

  // ── SERVERS / CLIENTS / LAN / WAN ───────────────────────────
  Q('What is a server?', ['A waiter in a restaurant', 'A computer that provides data or services to other computers', 'A type of cable', 'A phone charger'], 1),
  Q('What is a client device?', ['A bank customer', 'A printer cable', 'A device that requests data from a server, like a laptop', 'A power outlet'], 2),
  Q('When you open a website, your device acts as the…?', ['Server', 'Router', 'Cable', 'Client requesting the page'], 3),
  Q('What does LAN stand for?', ['Local Area Network', 'Large Audio Node', 'Long Access Number', 'Light And Noise'], 0),
  Q('What is a typical example of a LAN?', ['The whole internet', 'Your home or office network', 'A satellite in space', 'A single cable'], 1),
  Q('What does WAN stand for?', ['Wireless Audio Network', 'Web Access Node', 'Wide Area Network', 'World Audio Net'], 2),
  Q('The internet is a huge example of a…?', ['LAN', 'USB stick', 'Printer', 'WAN (wide area network)'], 3),

  // ── IP / DNS / DHCP ─────────────────────────────────────────
  Q('What is an IP address?', ['A number that identifies a device on a network', 'A type of password', 'A website logo', 'A kind of cable'], 0),
  Q('Why does a device need an IP address?', ['To charge faster', 'So data can be sent to the right place', 'To play music', 'To save photos'], 1),
  Q('What does DNS do?', ['Stores your photos', 'Charges the router', 'Turns website names into IP addresses', 'Blocks viruses'], 2),
  Q('When you type a website name, DNS helps find its…?', ['Password', 'Colour', 'Battery level', 'IP address'], 3),
  Q('What does DHCP do on a network?', ['Automatically gives devices an IP address', 'Encrypts your emails', 'Cools the router', 'Streams video'], 0),
  Q('Without DHCP, IP addresses would have to be…?', ['Bought online', 'Set manually on each device', 'Printed on paper', 'Sung aloud'], 1),

  // ── EVERYDAY PROTOCOLS / TERMS ──────────────────────────────
  Q('What is HTTP used for?', ['Sending electrical power', 'Storing files locally', 'Loading web pages', 'Charging phones'], 2),
  Q('What does the "S" in HTTPS mean?', ['Speed', 'Storage', 'Sound', 'Secure (encrypted)'], 3),
  Q('The padlock icon in a browser means the connection is…?', ['Secure and encrypted', 'Faster', 'Free', 'Colourful'], 0),
  Q('What is a "protocol" in networking?', ['A set of rules for how devices communicate', 'A type of cable', 'A brand of router', 'A power supply'], 0),
  Q('What does "ping" check?', ['Battery health', 'Whether another device is reachable on the network', 'Screen size', 'How many files you have'], 1),
  Q('What is an Ethernet cable used for?', ['Charging a phone', 'Playing audio', 'Connecting a device to a network by wire', 'Cooling a PC'], 2),
  Q('Wired Ethernet is usually…?', ['Slower than dial-up', 'Wireless', 'Unable to connect', 'More stable than Wi-Fi'], 3),
  Q('Fibre internet sends data using…?', ['Light through thin glass strands', 'Water in pipes', 'Metal rods', 'Sound waves'], 0),

  // ── SECURITY / CLOUD / OTHER DEVICES ────────────────────────
  Q('What does a VPN do?', ['Creates a private, encrypted connection over the internet', 'Makes the screen brighter', 'Adds storage space', 'Charges the device'], 0),
  Q('What does "encryption" do?', ['Deletes your data', 'Scrambles data so only the right person can read it', 'Prints your data', 'Colours your data'], 1),
  Q('Why use a strong Wi-Fi password?', ['To charge faster', 'To brighten the screen', 'To stop strangers using your network', 'For decoration'], 2),
  Q('What is a gateway in networking?', ['A garden gate', 'A music app', 'A keyboard key', 'A device that connects two different networks'], 3),
  Q('What is "the cloud" in computing?', ['Storage and services delivered over the internet', 'A weather forecast', 'A type of cable', 'A screen filter'], 0),
  Q('What does a proxy server act as?', ['A power source', 'A middleman for your internet requests', 'A backup battery', 'A printer'], 1),
  Q('What does a hub do (simply)?', ['Routes between networks', 'Blocks threats', 'Connects devices but sends data to all of them', 'Assigns IP addresses'], 2),
  Q('In a "star" network, devices all connect to a…?', ['Satellite', 'Printer', 'Battery', 'Central switch or hub'], 3),

  // ── PERFORMANCE / EVERYDAY ──────────────────────────────────
  Q('What is bandwidth?', ['How much data a connection can carry', 'The colour of the router', 'The length of a cable', 'The size of the screen'], 0),
  Q('What is latency?', ['The size of a file', 'The delay before data arrives', 'The screen brightness', 'The price of internet'], 1),
  Q('Lower latency is usually…?', ['Worse', 'The same', 'Better (less delay)', 'Impossible'], 2),
  Q('What does "Mbps" measure?', ['Storage', 'Battery', 'Volume', 'Internet speed'], 3),
  Q('What does "download" mean?', ['Getting a file from the internet to your device', 'Sending a file out from your device', 'Deleting a file', 'Printing a file'], 0),
  Q('What does "upload" mean?', ['Receiving a file', 'Sending a file from your device to the internet', 'Charging a file', 'Deleting a file'], 1),
  Q('What is "streaming"?', ['Printing media', 'Saving everything to a USB first', 'Watching or listening over the internet without downloading it all first', 'A type of cable'], 2),
  Q('What does "online" mean?', ['Out of battery', 'Switched off', 'Locked', 'Connected to the internet'], 3),
  Q('What is a "data packet"?', ['A small chunk of data sent over a network', 'A snack', 'A paper parcel', 'A spare battery'], 0),
  Q('What does a network "port" act like?', ['A real ship harbour', 'A doorway for a specific kind of connection', 'A power outlet only', 'A camera'], 1),
];

/* ─── Per-stall content partitioning ───────────────────────────────────────
 * Each stall plays a different slice of the shared content so the three booths
 * feel distinct without authoring three full content sets.
 *  - Quiz: a DISJOINT round-robin split (~66 Qs → ~22 per stall, no overlap),
 *    and each round draws 5 at random with options reshuffled per play.
 *  - Word search: an OVERLAPPING 25-word window per stall. The list is only 50
 *    words, and a 10-word grid needs a comfortable pool, so we offset windows
 *    rather than cutting it into smaller disjoint slices (which would starve
 *    the grid).
 *
 * The set of REAL stalls (codes, names) lives in the Supabase `stalls` table —
 * this list only drives content partitioning. Keep the two in sync: a slug here
 * with no DB row is unreachable, and a DB stall whose slug is missing here falls
 * back to stall-1's content (stallIndex → 0).
 */
export const STALL_SLUGS = ['stall-1', 'stall-2', 'stall-3'];

/* Which games each stall offers, keyed by slug. This is the single definition
 * the landing page, the rules modal and the score summary all read, so a stall's
 * line-up is changed here rather than in a slug comparison at each use site.
 * api/_games.js mirrors it to reject a score for a game its stall doesn't run.
 * An unknown slug falls back to stall-1's line-up, matching stallIndex() above. */
export const STALL_GAMES = {
  'stall-1': ['quiz', 'wordsearch'],
  'stall-2': ['quiz', 'wordsearch'],
  'stall-3': ['memory', 'ztp'],
};

export function stallGames(slug) {
  return STALL_GAMES[slug] || STALL_GAMES['stall-1'];
}

/* Where each game caches its result. Built in one place so the writer (the game)
 * and the readers (landing page, boot sync) can't drift onto different keys —
 * a mismatch silently re-opens a one-attempt game. `wordsearch` keeps its
 * historical `_ws` suffix: renaming it would orphan every score already cached
 * on a player's device. */
export const GAME_KEY_SUFFIX = {
  quiz: '_quiz',
  wordsearch: '_ws',
  memory: '_memory',
  ztp: '_ztp',
};

export function gameStorageKey(username, slug, game) {
  return `sns_${username}_${slug}${GAME_KEY_SUFFIX[game]}`;
}

export function stallIndex(slug) {
  const i = STALL_SLUGS.indexOf(slug);
  return i < 0 ? 0 : i;
}

export function stallQuiz(slug) {
  const idx = stallIndex(slug);
  const n = STALL_SLUGS.length;
  return QUIZ_QUESTIONS.filter((_, k) => k % n === idx);
}

export function stallKeywords(slug) {
  const idx = stallIndex(slug);
  const L = NETWORK_KEYWORDS.length;
  const start = Math.floor((idx * L) / STALL_SLUGS.length); // 0, 16, 33
  const windowSize = Math.ceil(L / 2);                      // 25
  const out = [];
  for (let k = 0; k < windowSize; k++) out.push(NETWORK_KEYWORDS[(start + k) % L]);
  return [...new Set(out)];
}

// Fisher–Yates: an unbiased shuffle. (sort(() => Math.random() - 0.5) is NOT
// uniform — it skews toward leaving elements near their original position.)
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Randomise a question's option order and remap `correct` to the new index, so
// the right answer never sits in a fixed slot. Without this, an authoring habit
// of "correct is option A" would let players win by always tapping the top one.
function shuffleOptions(q) {
  const order = shuffle(q.options.map((_, i) => i));
  return {
    ...q,
    options: order.map(i => q.options[i]),
    correct: order.indexOf(q.correct),
  };
}

// One quiz round: `count` random questions from the stall's slice, each with its
// options shuffled. This is the only function the Quiz component should consume.
export function quizRound(slug, count = 5) {
  return shuffle(stallQuiz(slug)).slice(0, count).map(shuffleOptions);
}
