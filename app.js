/* =============================================
   IC Circuit Simulator — Main Application
   ============================================= */

// ==========================================
// IC PIN DEFINITIONS
// ==========================================
const IC_DEFINITIONS = {
    IC7408: {
        name: '74LS08',
        fullName: 'IC 7408 — Quad 2-Input AND Gate',
        descAr: 'بوابة AND رباعية ثنائية المدخل',
        pinCount: 14,
        pins: [
            { num: 1, name: '1A', type: 'input', side: 'left' },
            { num: 2, name: '1B', type: 'input', side: 'left' },
            { num: 3, name: '1Y', type: 'output', side: 'left' },
            { num: 4, name: '2A', type: 'input', side: 'left' },
            { num: 5, name: '2B', type: 'input', side: 'left' },
            { num: 6, name: '2Y', type: 'output', side: 'left' },
            { num: 7, name: 'GND', type: 'power', side: 'left' },
            { num: 8, name: '3Y', type: 'output', side: 'right' },
            { num: 9, name: '3A', type: 'input', side: 'right' },
            { num: 10, name: '3B', type: 'input', side: 'right' },
            { num: 11, name: '4Y', type: 'output', side: 'right' },
            { num: 12, name: '4A', type: 'input', side: 'right' },
            { num: 13, name: '4B', type: 'input', side: 'right' },
            { num: 14, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates) {
            const g = (p) => pinStates[p] || 0;
            return {
                3: g(1) & g(2),
                6: g(4) & g(5),
                8: g(9) & g(10),
                11: g(12) & g(13),
            };
        },
        pinout: `     ┌──U──┐
  1A │1  14│ VCC
  1B │2  13│ 4B
  1Y │3  12│ 4A
  2A │4  11│ 4Y
  2B │5  10│ 3B
  2Y │6   9│ 3A
 GND │7   8│ 3Y
     └─────┘`,
        truthTable: {
            headers: ['A', 'B', 'Y = A·B'],
            rows: [
                [0, 0, 0],
                [0, 1, 0],
                [1, 0, 0],
                [1, 1, 1],
            ]
        }
    },
    IC7485: {
        name: '74LS85',
        fullName: 'IC 7485 — 4-Bit Magnitude Comparator',
        descAr: 'مقارن حجم 4-بت',
        pinCount: 16,
        pins: [
            { num: 1, name: 'B3', type: 'input', side: 'left' },
            { num: 2, name: 'IA<B', type: 'input', side: 'left' },
            { num: 3, name: 'IA=B', type: 'input', side: 'left' },
            { num: 4, name: 'IA>B', type: 'input', side: 'left' },
            { num: 5, name: 'OA>B', type: 'output', side: 'left' },
            { num: 6, name: 'OA=B', type: 'output', side: 'left' },
            { num: 7, name: 'A<B', type: 'output', side: 'left' },
            { num: 8, name: 'GND', type: 'power', side: 'left' },
            { num: 9, name: 'B0', type: 'input', side: 'right' },
            { num: 10, name: 'A0', type: 'input', side: 'right' },
            { num: 11, name: 'B1', type: 'input', side: 'right' },
            { num: 12, name: 'A1', type: 'input', side: 'right' },
            { num: 13, name: 'A2', type: 'input', side: 'right' },
            { num: 14, name: 'B2', type: 'input', side: 'right' },
            { num: 15, name: 'A3', type: 'input', side: 'right' },
            { num: 16, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates, comp, nets) {
            const g = (p) => pinStates[p] || 0;

            // STRICT: Cascade inputs must be properly wired for standalone use
            // Pin 2 (IA<B) → must be connected to GND
            // Pin 3 (IA=B) → must be HIGH (connected to VCC)
            // Pin 4 (IA>B) → must be connected to GND
            const pin2Grounded = isPinGrounded(comp, 2, nets);
            const pin4Grounded = isPinGrounded(comp, 4, nets);
            const pin3High = g(3) === 1;

            if (!pin2Grounded || !pin3High || !pin4Grounded) {
                // Cascade inputs not properly wired — no valid output
                return { 5: 0, 6: 0, 7: 0 };
            }

            const A = [g(10), g(12), g(13), g(15)]; // A0-A3
            const B = [g(9), g(11), g(14), g(1)];  // B0-B3

            // Compare from MSB to LSB
            for (let i = 3; i >= 0; i--) {
                if (A[i] > B[i]) return { 5: 1, 6: 0, 7: 0 };
                if (A[i] < B[i]) return { 5: 0, 6: 0, 7: 1 };
            }
            // All equal — cascade inputs confirm: A=B
            return { 5: 0, 6: 1, 7: 0 };
        },
        pinout: `      ┌──U──┐
  B3 │1  16│ VCC
IA<B │2  15│ A3
IA=B │3  14│ B2
IA>B │4  13│ A2
OA>B │5  12│ A1
OA=B │6  11│ B1
 A<B │7  10│ A0
 GND │8   9│ B0
      └─────┘`,
        truthTable: {
            headers: ['A vs B', 'OA>B', 'OA=B', 'A<B'],
            rows: [
                ['A > B', 1, 0, 0],
                ['A = B', 0, 1, 0],
                ['A < B', 0, 0, 1],
            ]
        }
    }
};

// ==========================================
// GLOBALS
// ==========================================
let compIdCounter = 0;
let wireIdCounter = 0;
const components = new Map();
const wires = new Map();

let currentTool = 'select';
let placingType = null;
let selectedCompId = null;

// Wire colors palette
const WIRE_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#00bcd4', '#ff6b81', '#feca57',
    '#fd79a8', '#a29bfe', '#55efc4', '#fab1a0', '#74b9ff',
];

const LED_COLORS = [
    { name: 'Red', value: 'red', hex: '#ff4457' },
    { name: 'Green', value: 'green', hex: '#2ecc71' },
    { name: 'Blue', value: 'blue', hex: '#3498db' },
    { name: 'Yellow', value: 'yellow', hex: '#f1c40f' },
    { name: 'Orange', value: 'orange', hex: '#e67e22' },
    { name: 'Purple', value: 'purple', hex: '#9b59b6' },
    { name: 'Cyan', value: 'cyan', hex: '#1abc9c' }
];
let wireColorIdx = 0;

// Wire drawing state
let wireStartComp = null;
let wireStartPin = null;
let wireDrawLine = null;
let wireWaypoints = []; // Manual waypoints during wire drawing

// Workspace pan/zoom
let wsZoom = 1;
let wsPanX = 0;
let wsPanY = 0;
let isPanning = false;
let panStartX = 0, panStartY = 0;
let panStartPanX = 0, panStartPanY = 0;

// Drag state
let isDragging = false;
let dragComp = null;
let dragOffsetX = 0, dragOffsetY = 0;

// DOM refs
const workspace = document.getElementById('workspace');
const wsContainer = document.getElementById('workspace-container');
const componentsLayer = document.getElementById('components-layer');
const wireLayer = document.getElementById('wire-layer');
const infoContent = document.getElementById('info-content');
const infoPlaceholder = document.getElementById('info-placeholder');
const infoDetails = document.getElementById('info-details');
const statusTool = document.getElementById('status-tool');
const statusHint = document.getElementById('status-hint');
const statusCoords = document.getElementById('status-coords');
const zoomLevelText = document.getElementById('zoom-level');

// ==========================================
// UTILITY
// ==========================================
function snap(val, grid = 10) {
    return Math.round(val / grid) * grid;
}

function newCompId() {
    return 'comp-' + (++compIdCounter);
}

function newWireId() {
    return 'wire-' + (++wireIdCounter);
}

function getWorkspaceCoords(clientX, clientY) {
    const rect = wsContainer.getBoundingClientRect();
    const x = (clientX - rect.left - wsPanX) / wsZoom;
    const y = (clientY - rect.top - wsPanY) / wsZoom;
    return { x, y };
}

function getPinWorldPos(compId, pinNum) {
    const el = document.querySelector(`.pin-dot[data-comp="${compId}"][data-pin="${pinNum}"]`);
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    return getWorkspaceCoords(clientX, clientY);
}

function getPinDirection(compId, pinNum) {
    const comp = components.get(compId);
    if (!comp) return { dx: 0, dy: 0 };

    if (comp.type === 'IC7408' || comp.type === 'IC7485') {
        const def = IC_DEFINITIONS[comp.type];
        const pin = def.pins.find(p => p.num === pinNum);
        if (!pin) return { dx: 0, dy: 0 };
        return pin.side === 'left' ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };
    }

    if (comp.type === 'SWITCH') return { dx: 0, dy: -1 };
    if (comp.type === 'LED') return { dx: 0, dy: 1 };
    if (comp.type === 'VCC') return { dx: 0, dy: 1 };
    if (comp.type === 'GND') return { dx: 0, dy: 1 };

    if (comp.type === 'RESISTOR') {
        return pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
    }

    return { dx: 0, dy: 0 };
}

// Get per-pin extension distance so parallel wires spread apart
function getWireExtension(compId, pinNum) {
    const comp = components.get(compId);
    if (!comp) return 30;

    if (comp.type === 'IC7408' || comp.type === 'IC7485') {
        const def = IC_DEFINITIONS[comp.type];
        const pin = def.pins.find(p => p.num === pinNum);
        if (!pin) return 30;

        const sameSidePins = def.pins.filter(p => p.side === pin.side);
        const idx = sameSidePins.findIndex(p => p.num === pinNum);
        // Spread: base 20px + 6px per pin slot
        return 20 + idx * 6;
    }

    return 30;
}

// Get bounding boxes of all components (for obstacle avoidance)
function getComponentBounds(excludeCompIds) {
    const bounds = [];
    const MARGIN = 12;
    for (const [id, comp] of components) {
        if (excludeCompIds.includes(id)) continue;
        const el = document.getElementById(id);
        if (!el) continue;
        bounds.push({
            x1: comp.x - MARGIN,
            y1: comp.y - MARGIN,
            x2: comp.x + el.offsetWidth + MARGIN,
            y2: comp.y + el.offsetHeight + MARGIN
        });
    }
    return bounds;
}

// ==========================================
// COMPONENT CREATION
// ==========================================
function createComponent(type, x, y) {
    const id = newCompId();
    const comp = {
        id,
        type,
        x: snap(x),
        y: snap(y),
        pinStates: {},
        outputStates: {},
        state: 0, // for switches
    };

    if (type === 'IC7408' || type === 'IC7485') {
        const def = IC_DEFINITIONS[type];
        def.pins.forEach(p => {
            comp.pinStates[p.num] = 0;
        });
    } else if (type === 'SWITCH') {
        comp.state = 0;
        comp.pinStates = { 1: 0 };
    } else if (type === 'LED') {
        comp.state = 0;
        comp.burned = false;
        comp.color = 'red'; // Default color
        comp.pinStates = { 1: 0 };
    } else if (type === 'RESISTOR') {
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'VCC') {
        comp.voltage = '5V'; // Default voltage label
        comp.pinStates = { 1: 1 };
    } else if (type === 'GND') {
        comp.pinStates = { 1: 0 };
    }

    components.set(id, comp);
    renderComponent(comp);
    simulate();
    return comp;
}

// ==========================================
// COMPONENT RENDERING
// ==========================================
function renderComponent(comp) {
    // Remove old element if re-rendering (e.g. color change)
    const oldEl = document.getElementById(comp.id);
    if (oldEl) oldEl.remove();

    const el = document.createElement('div');
    el.className = 'component';
    el.id = comp.id;
    el.dataset.type = comp.type;
    el.style.left = comp.x + 'px';
    el.style.top = comp.y + 'px';

    if (comp.type === 'IC7408' || comp.type === 'IC7485') {
        renderIC(el, comp);
    } else if (comp.type === 'SWITCH') {
        renderSwitch(el, comp);
    } else if (comp.type === 'LED') {
        renderLED(el, comp);
    } else if (comp.type === 'RESISTOR') {
        renderResistor(el, comp);
    } else if (comp.type === 'VCC') {
        renderVCC(el, comp);
    } else if (comp.type === 'GND') {
        renderGND(el, comp);
    }

    componentsLayer.appendChild(el);
}

function renderIC(el, comp) {
    const def = IC_DEFINITIONS[comp.type];
    const leftPins = def.pins.filter(p => p.side === 'left');
    const rightPins = def.pins.filter(p => p.side === 'right').reverse(); // reverse for top-to-bottom on right side

    el.classList.add('ic-component');
    el.innerHTML = `
        <div class="ic-pins-col ic-pins-left">
            ${leftPins.map(p => `
                <div class="ic-pin" data-comp="${comp.id}" data-pin="${p.num}">
                    <div class="pin-dot" data-comp="${comp.id}" data-pin="${p.num}"></div>
                    <span class="pin-num">${p.num}</span>
                    <span class="pin-name">${p.name}</span>
                </div>
            `).join('')}
        </div>
        <div class="ic-body-el">
            <div class="ic-notch"></div>
            <span class="ic-chip-label">${def.name}</span>
            <span class="ic-chip-sublabel">${comp.type === 'IC7408' ? 'AND' : 'CMP'}</span>
        </div>
        <div class="ic-pins-col ic-pins-right">
            ${rightPins.map(p => `
                <div class="ic-pin" data-comp="${comp.id}" data-pin="${p.num}">
                    <span class="pin-name">${p.name}</span>
                    <span class="pin-num">${p.num}</span>
                    <div class="pin-dot" data-comp="${comp.id}" data-pin="${p.num}"></div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSwitch(el, comp) {
    el.classList.add('switch-component');
    el.innerHTML = `
        <div class="switch-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="switch-body ${comp.state ? 'on' : ''}" data-comp="${comp.id}">
            <div class="switch-knob"></div>
        </div>
        <span class="switch-label">${comp.state ? 'HIGH' : 'LOW'}</span>
    `;
}

function renderLED(el, comp) {
    el.classList.add('led-component');
    el.innerHTML = `
        <div class="led-body ${comp.color || 'red'} ${comp.state ? 'on' : ''}" data-comp="${comp.id}"></div>
        <span class="led-label">LED</span>
        <div class="led-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
    `;
}

function renderResistor(el, comp) {
    el.classList.add('resistor-component');
    el.innerHTML = `
        <div class="resistor-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="resistor-body">
            <div class="resistor-bands">
                <div class="resistor-band band-orange"></div>
                <div class="resistor-band band-orange"></div>
                <div class="resistor-band band-brown"></div>
                <div class="resistor-band band-gold"></div>
            </div>
            <span class="resistor-label">330Ω</span>
        </div>
        <div class="resistor-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
    `;
}

function renderVCC(el, comp) {
    el.classList.add('vcc-component');
    el.innerHTML = `
        <div class="vcc-symbol">+${comp.voltage || '5V'}</div>
        <div class="power-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
    `;
}

function renderGND(el, comp) {
    el.classList.add('gnd-component');
    el.innerHTML = `
        <div class="gnd-symbol">GND</div>
        <div class="power-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
    `;
}

// ==========================================
// COMPONENT UPDATE (refresh visuals)
// ==========================================
function updateComponentVisuals(comp) {
    const el = document.getElementById(comp.id);
    if (!el) return;

    if (comp.type === 'SWITCH') {
        const body = el.querySelector('.switch-body');
        const label = el.querySelector('.switch-label');
        if (body) body.classList.toggle('on', !!comp.state);
        if (label) label.textContent = comp.state ? 'HIGH' : 'LOW';
    } else if (comp.type === 'LED') {
        const body = el.querySelector('.led-body');
        if (body) {
            body.classList.toggle('on', !!comp.state && !comp.burned);
            body.classList.toggle('burned', !!comp.burned);
        }
        const label = el.querySelector('.led-label');
        if (label) label.textContent = comp.burned ? '💥 محروق!' : 'LED';
    }

    // IC power indicator
    if (comp.type === 'IC7408' || comp.type === 'IC7485') {
        const powered = isICPowered(comp);
        el.classList.toggle('unpowered', !powered);
    }

    // Update pin dots for ALL components
    const dots = el.querySelectorAll('.pin-dot');
    dots.forEach(dot => {
        const pinNum = parseInt(dot.dataset.pin);
        const val = comp.pinStates[pinNum] || 0;
        dot.classList.toggle('high', !!val);
    });
}

// ==========================================
// WIRE CREATION & RENDERING
// ==========================================
function createWire(fromCompId, fromPin, toCompId, toPin, waypoints = []) {
    // Don't connect a pin to itself
    if (fromCompId === toCompId && fromPin === toPin) return null;

    // Check if wire already exists
    for (const [, w] of wires) {
        if ((w.from.comp === fromCompId && w.from.pin === fromPin &&
            w.to.comp === toCompId && w.to.pin === toPin) ||
            (w.from.comp === toCompId && w.from.pin === toPin &&
                w.to.comp === fromCompId && w.to.pin === fromPin)) {
            return null;
        }
    }

    const id = newWireId();
    const wire = {
        id,
        from: { comp: fromCompId, pin: fromPin },
        to: { comp: toCompId, pin: toPin },
        waypoints: waypoints,
        active: false,
        color: WIRE_COLORS[wireColorIdx++ % WIRE_COLORS.length],
    };
    wires.set(id, wire);
    renderWire(wire);
    simulate();
    return wire;
}


// Manual wire segments through user-placed waypoints
function getManualWireSegments(wire, p1, p2) {
    const segments = [];
    const dir1 = getPinDirection(wire.from.comp, wire.from.pin);
    const dir2 = getPinDirection(wire.to.comp, wire.to.pin);
    const EXT = 15;
    const exit1 = { x: p1.x + dir1.dx * EXT, y: p1.y + dir1.dy * EXT };
    const exit2 = { x: p2.x + dir2.dx * EXT, y: p2.y + dir2.dy * EXT };
    const allPoints = [p1, exit1, ...wire.waypoints, exit2, p2];

    for (let i = 0; i < allPoints.length - 1; i++) {
        const from = allPoints[i];
        const to = allPoints[i + 1];
        if (Math.abs(from.x - to.x) > 0.5 && Math.abs(from.y - to.y) > 0.5) {
            segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: from.y, type: 'H' });
            segments.push({ x1: to.x, y1: from.y, x2: to.x, y2: to.y, type: 'V' });
        } else if (Math.abs(from.x - to.x) > 0.5) {
            segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, type: 'H' });
        } else if (Math.abs(from.y - to.y) > 0.5) {
            segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, type: 'V' });
        }
    }
    return segments;
}

function getWireSegments(wire) {
    if (!wire) return [];
    const p1 = getPinWorldPos(wire.from.comp, wire.from.pin);
    const p2 = getPinWorldPos(wire.to.comp, wire.to.pin);

    // Use manual routing if waypoints exist
    if (wire.waypoints && wire.waypoints.length > 0) {
        return getManualWireSegments(wire, p1, p2);
    }

    // Auto-routing
    const dir1 = getPinDirection(wire.from.comp, wire.from.pin);
    const dir2 = getPinDirection(wire.to.comp, wire.to.pin);

    // Per-pin extension for parallel wire spacing
    const ext1 = getWireExtension(wire.from.comp, wire.from.pin);
    const ext2 = getWireExtension(wire.to.comp, wire.to.pin);

    let e1x = p1.x + dir1.dx * ext1;
    let e1y = p1.y + dir1.dy * ext1;
    let e2x = p2.x + dir2.dx * ext2;
    let e2y = p2.y + dir2.dy * ext2;

    // Component avoidance: push extension points further if they collide with components
    const obstacles = getComponentBounds([wire.from.comp, wire.to.comp]);

    for (const box of obstacles) {
        if (dir1.dx !== 0) {
            // Horizontal exit → vertical connecting segment at x=e1x
            if (e1x >= box.x1 && e1x <= box.x2) {
                const yMin = Math.min(p1.y, e2y);
                const yMax = Math.max(p1.y, e2y);
                if (!(yMax < box.y1 || yMin > box.y2)) {
                    e1x = dir1.dx < 0 ? Math.min(e1x, box.x1 - 5) : Math.max(e1x, box.x2 + 5);
                }
            }
        } else {
            // Vertical exit → horizontal connecting segment at y=e1y
            if (e1y >= box.y1 && e1y <= box.y2) {
                const xMin = Math.min(p1.x, e2x);
                const xMax = Math.max(p1.x, e2x);
                if (!(xMax < box.x1 || xMin > box.x2)) {
                    e1y = dir1.dy < 0 ? Math.min(e1y, box.y1 - 5) : Math.max(e1y, box.y2 + 5);
                }
            }
        }
        if (dir2.dx !== 0) {
            // Target horizontal exit → vertical segment at x=e2x
            if (e2x >= box.x1 && e2x <= box.x2) {
                const yMin = Math.min(p2.y, e1y);
                const yMax = Math.max(p2.y, e1y);
                if (!(yMax < box.y1 || yMin > box.y2)) {
                    e2x = dir2.dx < 0 ? Math.min(e2x, box.x1 - 5) : Math.max(e2x, box.x2 + 5);
                }
            }
        } else {
            // Target vertical exit → horizontal segment at y=e2y
            if (e2y >= box.y1 && e2y <= box.y2) {
                const xMin = Math.min(p2.x, e1x);
                const xMax = Math.max(p2.x, e1x);
                if (!(xMax < box.x1 || xMin > box.x2)) {
                    e2y = dir2.dy < 0 ? Math.min(e2y, box.y1 - 5) : Math.max(e2y, box.y2 + 5);
                }
            }
        }
    }

    const segments = [];

    if (dir1.dx !== 0) {
        // Horizontal start
        segments.push({ x1: p1.x, y1: p1.y, x2: e1x, y2: p1.y, type: 'H' });
        segments.push({ x1: e1x, y1: p1.y, x2: e1x, y2: e2y, type: 'V' });
        segments.push({ x1: e1x, y1: e2y, x2: e2x, y2: e2y, type: 'H' });
        segments.push({ x1: e2x, y1: e2y, x2: p2.x, y2: p2.y, type: 'V' });
    } else {
        // Vertical start
        segments.push({ x1: p1.x, y1: p1.y, x2: p1.x, y2: e1y, type: 'V' });
        segments.push({ x1: p1.x, y1: e1y, x2: e2x, y2: e1y, type: 'H' });
        segments.push({ x1: e2x, y1: e1y, x2: e2x, y2: e2y, type: 'V' });
        segments.push({ x1: e2x, y1: e2y, x2: p2.x, y2: p2.y, type: 'H' });
    }
    return segments;
}

function getAllHorizontalSegments(excludeWireId) {
    const list = [];
    for (const [id, w] of wires) {
        if (id === excludeWireId) continue;
        const segs = getWireSegments(w);
        for (const s of segs) {
            if (s.type === 'H') list.push(s);
        }
    }
    return list;
}

function renderWire(wire) {
    const p1 = getPinWorldPos(wire.from.comp, wire.from.pin);

    // We need to rebuild the path logic segment by segment
    // But now injecting jumps on vertical segments.
    const segments = getWireSegments(wire);
    const otherHoriz = getAllHorizontalSegments(wire.id);

    let d = `M ${p1.x} ${p1.y}`;

    // We'll track current pen position
    let cx = p1.x;
    let cy = p1.y;

    const ARC_R = 4; // Jump radius

    for (const seg of segments) {
        if (seg.type === 'H') {
            // Horizontal segment: just draw line
            d += ` L ${seg.x2} ${seg.y2}`;
            cx = seg.x2;
            cy = seg.y2;
        } else {
            // Vertical segment: check for collisions
            const x = seg.x1;
            const yStart = seg.y1;
            const yEnd = seg.y2;
            const yMin = Math.min(yStart, yEnd);
            const yMax = Math.max(yStart, yEnd);
            const goingDown = yEnd > yStart;

            // Find intersections
            // Intersection if: other.y is between yMin and yMax
            // AND x is between other.xMin and other.xMax
            // AND we want to avoid jumping at the very start/end of segment if it connects exactly
            const hits = [];
            for (const h of otherHoriz) {
                const hxMin = Math.min(h.x1, h.x2);
                const hxMax = Math.max(h.x1, h.x2);
                const hy = h.y1; // horizontal y is constant

                if (hy > yMin + ARC_R && hy < yMax - ARC_R) { // ensure space for jump
                    if (x > hxMin && x < hxMax) { // cross detected
                        hits.push(hy);
                    }
                }
            }

            // Sort hits based on direction
            hits.sort((a, b) => goingDown ? a - b : b - a);

            // Draw segment with jumps
            let currentY = yStart;
            for (const hy of hits) {
                // approaches intersection
                const approachY = goingDown ? hy - ARC_R : hy + ARC_R;
                d += ` L ${x} ${approachY}`;

                // arc
                // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
                // sweep-flag: 1 for clockwise, 0 for counter-clockwise
                // We want a bump to the RIGHT (usually) or just standard?
                // Visual standard: Jump Over. Usually a half circle.
                // If going down: (x, hy-r) -> (x, hy+r). Arc bulges to +x or -x? Standard is usually simple.
                // Let's bulge to +x (right).
                const landY = goingDown ? hy + ARC_R : hy - ARC_R;

                // Arc radius r. Distance 2r.
                d += ` A ${ARC_R} ${ARC_R} 0 0 1 ${x} ${landY}`;

                currentY = landY;
            }
            // Finish segment
            d += ` L ${x} ${yEnd}`;
            cx = x;
            cy = yEnd;
        }
    }

    let pathEl = wireLayer.querySelector(`#${wire.id}`);
    if (!pathEl) {
        pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.id = wire.id;
        pathEl.classList.add('wire');
        pathEl.dataset.wireId = wire.id;
        wireLayer.appendChild(pathEl);
    }

    pathEl.setAttribute('d', d);
    pathEl.style.stroke = wire.active ? wire.color : 'var(--wire-inactive)';
    pathEl.classList.toggle('active', wire.active);
    pathEl.style.fill = 'none'; // Ensure no fill
    if (wire.active) {
        pathEl.style.filter = `drop-shadow(0 0 5px ${wire.color})`;
    } else {
        pathEl.style.filter = '';
    }
}

function updateAllWires() {
    for (const [, wire] of wires) {
        renderWire(wire);
    }
}

function deleteWire(wireId) {
    const pathEl = wireLayer.querySelector(`#${wireId}`);
    if (pathEl) pathEl.remove();
    wires.delete(wireId);
    simulate();
}

// ==========================================
// COMPONENT DELETION
// ==========================================
function deleteComponent(compId) {
    // Remove all connected wires
    const toDelete = [];
    for (const [wid, w] of wires) {
        if (w.from.comp === compId || w.to.comp === compId) {
            toDelete.push(wid);
        }
    }
    toDelete.forEach(wid => deleteWire(wid));

    // Remove DOM element
    const el = document.getElementById(compId);
    if (el) el.remove();

    // Remove from map
    components.delete(compId);

    if (selectedCompId === compId) {
        selectedCompId = null;
        showInfoPlaceholder();
    }
    simulate();
}

// ==========================================
// PHYSICS HELPERS
// ==========================================
function isICPowered(comp) {
    const def = IC_DEFINITIONS[comp.type];
    const vccPin = def.pins.find(p => p.name === 'VCC');
    const gndPin = def.pins.find(p => p.name === 'GND');
    if (!vccPin || !gndPin) return false;

    // VCC must be HIGH
    const vccHigh = comp.pinStates[vccPin.num] === 1;

    // GND must be connected (has a wire to it)
    let gndConnected = false;
    for (const [, wire] of wires) {
        if ((wire.from.comp === comp.id && wire.from.pin === gndPin.num) ||
            (wire.to.comp === comp.id && wire.to.pin === gndPin.num)) {
            gndConnected = true;
            break;
        }
    }
    return vccHigh && gndConnected;
}


function isLEDProtected(ledComp, nets) {
    // LED is protected if its net contains a resistor pin
    for (const net of nets) {
        const hasLED = net.some(p => p.comp === ledComp.id && p.pin === 1);
        if (hasLED) {
            return net.some(p => {
                const c = components.get(p.comp);
                return c && c.type === 'RESISTOR';
            });
        }
    }
    return false;
}

function isPinGrounded(comp, pinNum, nets) {
    for (const net of nets) {
        const hasPin = net.some(p => p.comp === comp.id && p.pin === pinNum);
        if (hasPin) {
            return net.some(p => {
                const c = components.get(p.comp);
                return c && c.type === 'GND';
            });
        }
    }
    return false;
}

// ==========================================
// SIMULATION ENGINE
// ==========================================
function simulate() {
    const nets = buildNets();

    // CRITICAL: Reset ALL non-source states to 0 before simulation
    // This prevents stale IC output values from driving LED nets
    for (const [, comp] of components) {
        if (comp.type === 'IC7408' || comp.type === 'IC7485') {
            const def = IC_DEFINITIONS[comp.type];
            def.pins.forEach(p => {
                if (p.type === 'input' || p.type === 'output') {
                    comp.pinStates[p.num] = 0;
                }
                if (p.type === 'power') {
                    const inNet = nets.some(net => net.some(np => np.comp === comp.id && np.pin === p.num));
                    if (!inNet) comp.pinStates[p.num] = 0;
                }
            });
        } else if (comp.type === 'LED') {
            comp.state = 0;
            comp.pinStates[1] = 0;
        } else if (comp.type === 'RESISTOR') {
            comp.pinStates[1] = 0;
            comp.pinStates[2] = 0;
        }
    }

    // Iterative evaluation (max 20 iterations for stability)
    for (let iter = 0; iter < 20; iter++) {
        let changed = false;

        // 1. Resolve net values
        for (const net of nets) {
            let value = 0;
            for (const pin of net) {
                const comp = components.get(pin.comp);
                if (!comp) continue;
                if (comp.type === 'VCC') {
                    value = 1;
                } else if (comp.type === 'GND') {
                    // value stays 0
                } else if (comp.type === 'SWITCH') {
                    value = value || comp.state;
                } else if (comp.type === 'RESISTOR') {
                    const otherPin = pin.pin === 1 ? 2 : 1;
                    value = value || (comp.pinStates[otherPin] || 0);
                } else if (comp.type === 'IC7408' || comp.type === 'IC7485') {
                    const def = IC_DEFINITIONS[comp.type];
                    const pinDef = def.pins.find(p => p.num === pin.pin);
                    if (pinDef && pinDef.type === 'output') {
                        value = value || (comp.pinStates[pin.pin] || 0);
                    }
                }
            }

            // Propagate to all pins in this net
            for (const pin of net) {
                const comp = components.get(pin.comp);
                if (!comp) continue;
                if (comp.type === 'LED') {
                    if (comp.pinStates[1] !== value) { comp.pinStates[1] = value; changed = true; }
                    comp.state = value;
                } else if (comp.type === 'RESISTOR') {
                    if (comp.pinStates[pin.pin] !== value) { comp.pinStates[pin.pin] = value; changed = true; }
                } else if (comp.type === 'IC7408' || comp.type === 'IC7485') {
                    const def = IC_DEFINITIONS[comp.type];
                    const pinDef = def.pins.find(p => p.num === pin.pin);
                    if (pinDef && (pinDef.type === 'input' || pinDef.type === 'power')) {
                        if (comp.pinStates[pin.pin] !== value) {
                            comp.pinStates[pin.pin] = value;
                            changed = true;
                        }
                    }
                }
            }
        }

        // 2. Evaluate IC outputs — ONLY if IC is powered
        for (const [, comp] of components) {
            if (comp.type === 'IC7408' || comp.type === 'IC7485') {
                if (!isICPowered(comp)) {
                    // IC not powered — force all outputs to 0
                    const def = IC_DEFINITIONS[comp.type];
                    def.pins.forEach(p => {
                        if (p.type === 'output' && comp.pinStates[p.num] !== 0) {
                            comp.pinStates[p.num] = 0;
                            changed = true;
                        }
                    });
                    continue;
                }
                const def = IC_DEFINITIONS[comp.type];
                const outputs = def.evaluate(comp.pinStates, comp, nets);
                for (const [pin, val] of Object.entries(outputs)) {
                    const pinNum = parseInt(pin);
                    if (comp.pinStates[pinNum] !== val) {
                        comp.pinStates[pinNum] = val;
                        changed = true;
                    }
                }
            }
        }

        if (!changed) break;
    }

    // 3. Check LED protection (burn-out detection)
    for (const [, comp] of components) {
        if (comp.type === 'LED') {
            if (comp.state) {
                comp.burned = !isLEDProtected(comp, nets);
            } else {
                comp.burned = false;
            }
        }
    }

    // 4. Update wire visual states
    for (const [, wire] of wires) {
        const fromComp = components.get(wire.from.comp);
        const toComp = components.get(wire.to.comp);
        let active = false;
        if (fromComp) {
            if (fromComp.type === 'VCC') active = true;
            else if (fromComp.type === 'SWITCH') active = !!fromComp.state;
            else active = !!(fromComp.pinStates[wire.from.pin]);
        }
        if (toComp && !active) {
            if (toComp.type === 'VCC') active = true;
            else if (toComp.type === 'SWITCH') active = !!toComp.state;
            else active = !!(toComp.pinStates[wire.to.pin]);
        }
        wire.active = active;
        const pathEl = wireLayer.querySelector(`#${wire.id}`);
        if (pathEl) {
            pathEl.style.stroke = wire.active ? wire.color : 'var(--wire-inactive)';
            pathEl.classList.toggle('active', active);
            pathEl.style.filter = active ? `drop-shadow(0 0 5px ${wire.color})` : '';
        }
    }

    // 5. Update component visuals
    for (const [, comp] of components) {
        updateComponentVisuals(comp);
    }

    // 6. Update info panel
    if (selectedCompId) {
        const comp = components.get(selectedCompId);
        if (comp && (comp.type === 'IC7408' || comp.type === 'IC7485')) {
            updatePinStatesDisplay(comp);
        }
    }
}

function buildNets() {
    const nets = [];
    const pinToNet = new Map();

    function pinKey(comp, pin) {
        return `${comp}:${pin}`;
    }

    for (const [, wire] of wires) {
        const k1 = pinKey(wire.from.comp, wire.from.pin);
        const k2 = pinKey(wire.to.comp, wire.to.pin);

        const net1 = pinToNet.get(k1);
        const net2 = pinToNet.get(k2);

        if (net1 !== undefined && net2 !== undefined) {
            if (net1 !== net2) {
                // Merge net2 into net1
                const net2Pins = nets[net2];
                for (const p of net2Pins) {
                    nets[net1].push(p);
                    pinToNet.set(pinKey(p.comp, p.pin), net1);
                }
                nets[net2] = [];
            }
        } else if (net1 !== undefined) {
            nets[net1].push({ comp: wire.to.comp, pin: wire.to.pin });
            pinToNet.set(k2, net1);
        } else if (net2 !== undefined) {
            nets[net2].push({ comp: wire.from.comp, pin: wire.from.pin });
            pinToNet.set(k1, net2);
        } else {
            const idx = nets.length;
            nets.push([
                { comp: wire.from.comp, pin: wire.from.pin },
                { comp: wire.to.comp, pin: wire.to.pin }
            ]);
            pinToNet.set(k1, idx);
            pinToNet.set(k2, idx);
        }
    }

    return nets.filter(n => n.length > 0);
}

// ==========================================
// INFO PANEL
// ==========================================
function showInfoPlaceholder() {
    infoPlaceholder.style.display = '';
    infoDetails.style.display = 'none';
}

function showComponentInfo(comp) {
    infoPlaceholder.style.display = 'none';
    infoDetails.style.display = '';

    if (comp.type === 'IC7408' || comp.type === 'IC7485') {
        showICInfo(comp);
    } else if (comp.type === 'SWITCH') {
        infoDetails.innerHTML = `
            <div class="info-title">مفتاح تبديل</div>
            <div class="info-subtitle">Toggle Switch — ${comp.state ? 'HIGH (1)' : 'LOW (0)'}</div>
            <div class="info-section">
                <div class="info-section-title">الحالة</div>
                <p style="color: ${comp.state ? 'var(--high)' : 'var(--text-muted)'}; font-size:18px; font-weight:700; text-align:center; padding:10px;">
                    ${comp.state ? '⬤ HIGH (1)' : '○ LOW (0)'}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    انقر على المفتاح لتبديل الحالة بين HIGH و LOW. قم بتوصيل المخرج بمدخل IC عبر سلك.
                </p>
            </div>
        `;
    } else if (comp.type === 'LED') {
        const nets = buildNets();
        const protectedLED = isLEDProtected(comp, nets);
        let statusHTML = '';
        if (comp.burned) {
            statusHTML = `
                <p style="color: var(--danger); font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    💥 LED محروق! <br><small style="font-size:11px; font-weight:400;">لم يتم توصيل مقاومة حماية</small>
                </p>`;
        } else if (comp.state) {
            statusHTML = `
                <p style="color: var(--led-on); font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    🔴 مضاء (ON) ${protectedLED ? '✅' : ''}
                </p>`;
        } else {
            statusHTML = `
                <p style="color: var(--text-muted); font-size:16px; font-weight:700; text-align:center; padding:10px;">
                    ⚫ مطفأ (OFF)
                </p>`;
        }
        infoDetails.innerHTML = `
            <div class="info-title">مؤشر LED</div>
            <div class="info-subtitle">Light Emitting Diode — Vf = 2V, If = 20mA</div>
            <div class="info-section">
                <div class="info-section-title">الحالة</div>
                ${statusHTML}
            </div>
            <div class="info-section">
                <div class="info-section-title">الحماية</div>
                <p style="font-size:11px; color: ${protectedLED ? 'var(--high)' : 'var(--danger)'}; line-height:1.6; padding:6px; background:rgba(0,0,0,0.2); border-radius:6px;">
                    ${protectedLED
                ? '✅ محمي بمقاومة — التيار محدود والدائرة آمنة'
                : '⚠️ غير محمي! يجب توصيل مقاومة (330Ω) بين الخرج وLED لمنع احتراقه'}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">ملاحظة تعليمية</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    في الواقع، توصيل LED مباشرة بـ 5V بدون مقاومة يسبب تدفق تيار زائد يحرق LED. المقاومة تحد التيار إلى قيمة آمنة.
                </p>
            </div>
        `;
    } else if (comp.type === 'VCC') {
        infoDetails.innerHTML = `
            <div class="info-title">VCC (+5V)</div>
            <div class="info-subtitle">مصدر تغذية موجبة</div>
            <div class="info-section">
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    يوفر جهد HIGH ثابت (+5V). قم بتوصيله بأطراف VCC للدوائر المتكاملة أو كمدخل HIGH.
                </p>
            </div>
        `;
    } else if (comp.type === 'GND') {
        infoDetails.innerHTML = `
            <div class="info-title">GND (الأرضي)</div>
            <div class="info-subtitle">مرجع الجهد الصفري</div>
            <div class="info-section">
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    يوفر جهد LOW ثابت (0V). قم بتوصيله بأطراف GND للدوائر المتكاملة.
                </p>
            </div>
        `;
    } else if (comp.type === 'RESISTOR') {
        infoDetails.innerHTML = `
            <div class="info-title">مقاومة 330Ω</div>
            <div class="info-subtitle">Resistor</div>
            <div class="info-section">
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    مقاومة للحد من التيار. تستخدم عادةً مع LED لحماية المؤشر الضوئي من التيار الزائد.
                </p>
            </div>
        `;
    }
}

function showICInfo(comp) {
    const def = IC_DEFINITIONS[comp.type];

    let pinStatesHTML = '';
    def.pins.forEach(p => {
        if (p.type === 'power') return;
        const val = comp.pinStates[p.num] || 0;
        pinStatesHTML += `
            <li class="pin-state-item">
                <span class="pin-state-name">Pin ${p.num} (${p.name})</span>
                <span class="pin-state-val ${val ? 'high' : 'low'}">${val ? 'HIGH' : 'LOW'}</span>
            </li>
        `;
    });

    let truthHTML = '';
    def.truthTable.rows.forEach(row => {
        truthHTML += '<tr>' + row.map(v => `<td>${v}</td>`).join('') + '</tr>';
    });

    infoDetails.innerHTML = `
        <div class="info-title">${def.fullName}</div>
        <div class="info-subtitle">${def.descAr}</div>

        <div class="info-section">
            <div class="info-section-title">مخطط الأطراف (PINOUT)</div>
            <div class="pinout-diagram">${def.pinout}</div>
        </div>

        <div class="info-section">
            <div class="info-section-title">جدول الحقيقة</div>
            <table class="truth-table">
                <thead>
                    <tr>${def.truthTable.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>${truthHTML}</tbody>
            </table>
        </div>

        <div class="info-section">
            <div class="info-section-title">حالة الأطراف الحالية</div>
            <ul class="pin-states" id="pin-states-list">${pinStatesHTML}</ul>
        </div>
    `;
}

function updatePinStatesDisplay(comp) {
    const list = document.getElementById('pin-states-list');
    if (!list) return;
    const def = IC_DEFINITIONS[comp.type];
    let html = '';
    def.pins.forEach(p => {
        if (p.type === 'power') return;
        const val = comp.pinStates[p.num] || 0;
        html += `
            <li class="pin-state-item">
                <span class="pin-state-name">Pin ${p.num} (${p.name})</span>
                <span class="pin-state-val ${val ? 'high' : 'low'}">${val ? 'HIGH' : 'LOW'}</span>
            </li>
        `;
    });
    list.innerHTML = html;
}

// ==========================================
// EVENT HANDLERS
// ==========================================

// --- Tool selection ---
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setTool(btn.dataset.tool);
    });
});

function setTool(tool) {
    currentTool = tool;
    placingType = null;
    cancelWireDrawing();

    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    wsContainer.className = '';
    if (tool === 'wire') wsContainer.classList.add('tool-wire');
    else if (tool === 'delete') wsContainer.classList.add('tool-delete');
    else if (tool === 'cut-wire') wsContainer.classList.add('tool-cut-wire');

    const toolNames = { select: 'اختيار', wire: 'سلك', delete: 'حذف', 'cut-wire': 'قطع سلك' };
    statusTool.textContent = `🔧 الأداة: ${toolNames[tool] || tool}`;
    updateHint();
}

function updateHint() {
    if (placingType) {
        statusHint.textContent = 'انقر على مساحة العمل لوضع المكون';
    } else if (currentTool === 'wire') {
        statusHint.textContent = wireStartComp
            ? `انقر على مساحة العمل لإضافة نقطة انعطاف (${wireWaypoints.length}) — أو انقر على طرف لإتمام التوصيل — Esc للإلغاء`
            : 'انقر على طرف (pin) لبدء رسم السلك';
    } else if (currentTool === 'delete') {
        statusHint.textContent = 'انقر على مكون أو سلك لحذفه';
    } else if (currentTool === 'cut-wire') {
        statusHint.textContent = 'انقر على سلك لقطعه — لن يتم حذف المكونات';
    } else {
        statusHint.textContent = 'انقر على مكون من القائمة ثم انقر على مساحة العمل — أو اسحب المكونات لتحريكها';
    }
}

// --- Component palette ---
document.querySelectorAll('.comp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        placingType = btn.dataset.type;
        setTool('select');
        placingType = btn.dataset.type;
        wsContainer.className = 'tool-place';
        statusHint.textContent = `انقر على مساحة العمل لوضع ${btn.querySelector('.comp-name').textContent}`;
    });
});

// --- Workspace click (place component) ---
wsContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('#zoom-controls')) return;

    // Place component
    if (placingType && e.button === 0) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        createComponent(placingType, coords.x - 40, coords.y - 30);
        // Stay in placing mode for quick multiple placements
        // placingType = null;
        // wsContainer.className = '';
        // updateHint();
        return;
    }

    // Pin click for wire
    // CHANGED: Allow clicking on the pin container (number, etc), not just the dot
    const pinEl = e.target.closest('[data-pin]');
    if (pinEl && (currentTool === 'wire' || currentTool === 'select')) {
        // Safety check: ignore if the element is the component body itself (unlikely but safe)
        if (pinEl.classList.contains('component')) return;

        const ci = pinEl.dataset.comp;
        const pi = parseInt(pinEl.dataset.pin);
        handlePinClick(ci, pi, e);
        return;
    }

    // Waypoint for manual wire routing (click empty space while drawing)
    if (wireStartComp && e.button === 0 && (currentTool === 'wire' || currentTool === 'select')) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        wireWaypoints.push({ x: coords.x, y: coords.y });
        updateHint();
        return;
    }

    // Wire click for deletion in delete / cut-wire mode
    if (currentTool === 'delete' || currentTool === 'cut-wire') {
        const wirePath = e.target.closest('.wire');
        if (wirePath) {
            e.stopPropagation(); // منع التداخل مع أحداث أخرى
            deleteWire(wirePath.dataset.wireId);
            return;
        }
        // في وضع cut-wire، فقط قطع الأسلاك وليس حذف المكونات
        if (currentTool === 'cut-wire') return;
        const comp = e.target.closest('.component');
        if (comp) {
            deleteComponent(comp.id);
            return;
        }
    }


    // Switch toggle
    if (currentTool === 'select') {
        const switchBody = e.target.closest('.switch-body');
        if (switchBody) {
            const comp = components.get(switchBody.dataset.comp);
            if (comp) {
                comp.state = comp.state ? 0 : 1;
                comp.pinStates[1] = comp.state;
                simulate();
                updateComponentVisuals(comp);
                showComponentInfo(comp);
            }
            return;
        }
    }

    // Select component
    if (currentTool === 'select' && !placingType) {
        const compEl = e.target.closest('.component');
        if (compEl && e.button === 0) {
            // Select
            selectComponent(compEl.id);

            // Start drag
            const comp = components.get(compEl.id);
            if (comp) {
                isDragging = true;
                dragComp = comp;
                const coords = getWorkspaceCoords(e.clientX, e.clientY);
                dragOffsetX = coords.x - comp.x;
                dragOffsetY = coords.y - comp.y;
                compEl.style.cursor = 'grabbing';
                compEl.style.zIndex = '100';
            }
            return;
        }

        // Start panning
        if (!compEl && e.button === 0) {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartPanX = wsPanX;
            panStartPanY = wsPanY;
            wsContainer.style.cursor = 'grabbing';
        }
    }

    // Pan with middle mouse button
    if (e.button === 1) {
        e.preventDefault();
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartPanX = wsPanX;
        panStartPanY = wsPanY;
        wsContainer.style.cursor = 'grabbing';
    }
});

// --- Mouse move ---
document.addEventListener('mousemove', (e) => {
    // Update coordinates display
    const coords = getWorkspaceCoords(e.clientX, e.clientY);
    statusCoords.textContent = `X: ${Math.round(coords.x)}  Y: ${Math.round(coords.y)}`;

    // Dragging component
    if (isDragging && dragComp) {
        const c = getWorkspaceCoords(e.clientX, e.clientY);
        dragComp.x = snap(c.x - dragOffsetX);
        dragComp.y = snap(c.y - dragOffsetY);
        const el = document.getElementById(dragComp.id);
        if (el) {
            el.style.left = dragComp.x + 'px';
            el.style.top = dragComp.y + 'px';
        }
        updateAllWires();
        return;
    }

    // Panning
    if (isPanning) {
        wsPanX = panStartPanX + (e.clientX - panStartX);
        wsPanY = panStartPanY + (e.clientY - panStartY);
        applyTransform();
        return;
    }

    // Wire drawing preview (with waypoints)
    if (wireStartComp && wireDrawLine) {
        const wsRect = wsContainer.getBoundingClientRect();
        const mx = (e.clientX - wsRect.left - wsPanX) / wsZoom;
        const my = (e.clientY - wsRect.top - wsPanY) / wsZoom;

        const p1 = getPinWorldPos(wireStartComp, wireStartPin);
        const allPts = [p1, ...wireWaypoints, { x: mx, y: my }];
        let d = `M ${allPts[0].x} ${allPts[0].y}`;
        for (let i = 1; i < allPts.length; i++) {
            d += ` H ${allPts[i].x} V ${allPts[i].y}`;
        }
        wireDrawLine.setAttribute('d', d);
    }
});

// --- Mouse up ---
document.addEventListener('mouseup', (e) => {
    if (isDragging && dragComp) {
        const el = document.getElementById(dragComp.id);
        if (el) {
            el.style.cursor = 'grab';
            el.style.zIndex = '15';
        }
        isDragging = false;
        dragComp = null;
        updateAllWires();
    }

    if (isPanning) {
        isPanning = false;
        wsContainer.style.cursor = '';
    }
});

// --- Zoom ---
wsContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newZoom = Math.max(0.3, Math.min(3, wsZoom + delta));

    // Zoom toward mouse position
    const rect = wsContainer.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    wsPanX = mx - (mx - wsPanX) * (newZoom / wsZoom);
    wsPanY = my - (my - wsPanY) * (newZoom / wsZoom);
    wsZoom = newZoom;

    applyTransform();
    updateAllWires();
}, { passive: false });

document.getElementById('btn-zoom-in').addEventListener('click', () => {
    wsZoom = Math.min(3, wsZoom + 0.15);
    applyTransform();
    updateAllWires();
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
    wsZoom = Math.max(0.3, wsZoom - 0.15);
    applyTransform();
    updateAllWires();
});

document.getElementById('btn-zoom-fit').addEventListener('click', () => {
    wsZoom = 1;
    wsPanX = 0;
    wsPanY = 0;
    applyTransform();
    updateAllWires();
});

function applyTransform() {
    workspace.style.transform = `translate(${wsPanX}px, ${wsPanY}px) scale(${wsZoom})`;
    zoomLevelText.textContent = Math.round(wsZoom * 100) + '%';
}

// --- Pin click (wire drawing) ---
function handlePinClick(compId, pinNum, e) {
    e.stopPropagation();

    if (!wireStartComp) {
        // Start wire
        wireStartComp = compId;
        wireStartPin = pinNum;
        wireWaypoints = [];

        // Create drawing line
        wireDrawLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        wireDrawLine.classList.add('wire-drawing');
        wireLayer.appendChild(wireDrawLine);

        const p = getPinWorldPos(compId, pinNum);
        wireDrawLine.setAttribute('d', `M ${p.x} ${p.y} L ${p.x} ${p.y}`);

        updateHint();
    } else {
        // Complete wire with waypoints
        createWire(wireStartComp, wireStartPin, compId, pinNum, [...wireWaypoints]);
        cancelWireDrawing();
    }
}

function cancelWireDrawing() {
    wireStartComp = null;
    wireStartPin = null;
    wireWaypoints = [];
    if (wireDrawLine) {
        wireDrawLine.remove();
        wireDrawLine = null;
    }
    updateHint();
}

// --- Selection ---
function selectComponent(compId) {
    // Deselect previous
    document.querySelectorAll('.component.selected').forEach(el => el.classList.remove('selected'));

    selectedCompId = compId;
    const el = document.getElementById(compId);
    if (el) el.classList.add('selected');

    const comp = components.get(compId);
    if (comp) showComponentInfo(comp);
}

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cancelWireDrawing();
        placingType = null;
        wsContainer.className = '';
        updateHint();
    }
    if (e.key === 's' || e.key === 'S') setTool('select');
    if (e.key === 'w' || e.key === 'W') setTool('wire');
    if (e.key === 'x' || e.key === 'X') setTool('cut-wire');
    if (e.key === 'd' || e.key === 'D') setTool('delete');
    if (e.key === 'Delete' && selectedCompId) {
        deleteComponent(selectedCompId);
    }
});

// --- Right-click context menu ---
let contextMenu = null;

wsContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    removeContextMenu();

    const compEl = e.target.closest('.component');
    const wirePath = e.target.closest('.wire');

    if (!compEl && !wirePath) return;

    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';

    if (compEl) {
        const comp = components.get(compEl.id);
        let extraOptions = '';

        if (comp.type === 'LED') {
            const swatches = LED_COLORS.map(c => `
                <div class="color-swatch ${comp.color === c.value ? 'active' : ''}" 
                     data-color="${c.value}" 
                     style="background:${c.hex};"
                     title="${c.name}">
                </div>
            `).join('');

            extraOptions = `
                <div class="context-menu-item no-hover" style="cursor:default; flex-direction:column; align-items:flex-start; pointer-events:none;">
                    <span style="margin-bottom:6px; font-size:11px; opacity:0.8; font-weight:600;">🎨 لون الإضاءة</span>
                    <div class="color-picker-row" style="pointer-events:all;">
                        ${swatches}
                    </div>
                </div>
            `;
        } else if (comp.type === 'VCC') {
            extraOptions = `<div class="context-menu-item" data-action="voltage">⚡ تغيير الجهد (${comp.voltage || '5V'})</div>`;
        }

        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="info">ℹ️ معلومات</div>
            ${extraOptions}
            <div class="context-menu-item danger" data-action="delete">🗑️ حذف</div>
        `;
        contextMenu.addEventListener('click', (ev) => {
            const action = ev.target.closest('.context-menu-item')?.dataset.action;
            const swatch = ev.target.closest('.color-swatch');

            if (action === 'delete') deleteComponent(compEl.id);
            if (action === 'info') selectComponent(compEl.id);

            if (swatch) {
                const newColor = swatch.dataset.color;
                comp.color = newColor;

                // Update basic render
                renderComponent(comp);
                // Ensure dynamic states (on/off) are reapplied
                updateComponentVisuals(comp);

                removeContextMenu();
            }

            if (action === 'voltage') {
                const volts = ['5V', '3.3V', '12V'];
                const currIdx = volts.indexOf(comp.voltage || '5V');
                comp.voltage = volts[(currIdx + 1) % volts.length];
                renderComponent(comp);
            }
            if (action) removeContextMenu();
        });
    } else if (wirePath) {
        contextMenu.innerHTML = `
        <div class="context-menu-item danger" data-action="delete">🗑️ حذف السلك</div>
    `;
        contextMenu.addEventListener('click', (ev) => {
            const action = ev.target.closest('.context-menu-item')?.dataset.action;
            if (action === 'delete') {
                e.stopPropagation(); // إضافة هذا السطر
                deleteWire(wirePath.dataset.wireId);
            }
            removeContextMenu();
        });
    }

    document.body.appendChild(contextMenu);
});

document.addEventListener('click', () => removeContextMenu());

function removeContextMenu() {
    if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
    }
}

// --- Clear all ---
document.getElementById('btn-clear').addEventListener('click', () => {
    if (components.size === 0) return;
    // Clear all
    componentsLayer.innerHTML = '';
    wireLayer.innerHTML = '';
    components.clear();
    wires.clear();
    selectedCompId = null;
    showInfoPlaceholder();
    cancelWireDrawing();
});


// ==========================================
// EXAMPLE CIRCUITS
// ==========================================
function clearAll() {
    componentsLayer.innerHTML = '';
    wireLayer.innerHTML = '';
    components.clear();
    wires.clear();
    compIdCounter = 0;
    wireIdCounter = 0;
    cancelWireDrawing();
    showInfoPlaceholder();
}

document.getElementById('btn-clear').addEventListener('click', () => {
    clearAll();
});

// --- Example 1: AND Gate (IC7408) ---
document.getElementById('btn-example1').addEventListener('click', () => {
    clearAll();

    const ic = createComponent('IC7408', 350, 220);
    const sw1 = createComponent('SWITCH', 150, 200);
    const sw2 = createComponent('SWITCH', 150, 280);
    const res = createComponent('RESISTOR', 560, 230);
    const led = createComponent('LED', 650, 230);
    const vcc = createComponent('VCC', 530, 100);
    const gnd = createComponent('GND', 300, 430);

    led.color = 'green';
    renderComponent(led);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            createWire(sw1.id, 1, ic.id, 1);
            createWire(sw2.id, 1, ic.id, 2);
            createWire(ic.id, 3, res.id, 1);
            createWire(res.id, 2, led.id, 1);
            createWire(vcc.id, 1, ic.id, 14);
            createWire(gnd.id, 1, ic.id, 7);

            updateAllWires();
            simulate();
            selectComponent(ic.id);
        });
    });
});

// --- Example 2: 4-Bit Comparator (IC7485) ---
document.getElementById('btn-example2').addEventListener('click', () => {
    clearAll();

    const ic = createComponent('IC7485', 400, 180);

    // A inputs: A0=pin10, A1=pin12, A2=pin13, A3=pin15
    const swA0 = createComponent('SWITCH', 120, 100);
    const swA1 = createComponent('SWITCH', 120, 160);
    const swA2 = createComponent('SWITCH', 120, 220);
    const swA3 = createComponent('SWITCH', 120, 280);

    // B inputs: B0=pin9, B1=pin11, B2=pin14, B3=pin1
    const swB0 = createComponent('SWITCH', 120, 360);
    const swB1 = createComponent('SWITCH', 120, 420);
    const swB2 = createComponent('SWITCH', 120, 480);
    const swB3 = createComponent('SWITCH', 120, 540);

    // Resistors + colored LEDs
    const resGT = createComponent('RESISTOR', 650, 200);
    const resEQ = createComponent('RESISTOR', 650, 280);
    const resLT = createComponent('RESISTOR', 650, 360);
    const ledGT = createComponent('LED', 750, 200);
    const ledEQ = createComponent('LED', 750, 280);
    const ledLT = createComponent('LED', 750, 360);

    const vcc = createComponent('VCC', 630, 80);
    const gnd = createComponent('GND', 340, 570);
    const vccCasc = createComponent('VCC', 200, 630);

    // LED colors: green=A>B, yellow=A=B, red=A<B
    ledGT.color = 'green';
    ledEQ.color = 'yellow';
    ledLT.color = 'red';
    renderComponent(ledGT);
    renderComponent(ledEQ);
    renderComponent(ledLT);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // A inputs
            createWire(swA0.id, 1, ic.id, 10);
            createWire(swA1.id, 1, ic.id, 12);
            createWire(swA2.id, 1, ic.id, 13);
            createWire(swA3.id, 1, ic.id, 15);

            // B inputs
            createWire(swB0.id, 1, ic.id, 9);
            createWire(swB1.id, 1, ic.id, 11);
            createWire(swB2.id, 1, ic.id, 14);
            createWire(swB3.id, 1, ic.id, 1);

            // Cascade (STRICT): pin2→GND, pin3→VCC, pin4→GND
            createWire(vccCasc.id, 1, ic.id, 3);
            createWire(gnd.id, 1, ic.id, 2);
            createWire(gnd.id, 1, ic.id, 4);

            // Outputs → Resistors → LEDs
            createWire(ic.id, 5, resGT.id, 1);
            createWire(resGT.id, 2, ledGT.id, 1);
            createWire(ic.id, 6, resEQ.id, 1);
            createWire(resEQ.id, 2, ledEQ.id, 1);
            createWire(ic.id, 7, resLT.id, 1);
            createWire(resLT.id, 2, ledLT.id, 1);

            // Power
            createWire(vcc.id, 1, ic.id, 16);
            createWire(gnd.id, 1, ic.id, 8);

            updateAllWires();
            simulate();
            selectComponent(ic.id);
        });
    });
});

// ==========================================
// INITIALIZATION
// ==========================================
applyTransform();
showInfoPlaceholder();
updateHint();

// Center the workspace initially
wsPanX = 100;
wsPanY = 50;
applyTransform();
