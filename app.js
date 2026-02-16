/* =============================================
IC Circuit Simulator — Main Application
============================================= */

// ==========================================
// IC PIN DEFINITIONS
// ==========================================
const IC_DEFINITIONS = {
    IC7408: {
        name: '74LS08',
        fullName: 'IC 7408 — Quad 2-Input AND Gates',
        descAr: 'بوابات AND ثنائية المدخل (4 بوابات)',
        sublabel: 'AND',
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
                3: g(1) && g(2),
                6: g(4) && g(5),
                8: g(9) && g(10),
                11: g(12) && g(13),
            };
        },
        pinout: `      ┌──U──┐
1A │1  14│ VCC
1B │2  13│ 4B
1Y │3  12│ 4A
2A │4  11│ 4Y
2B │5  10│ 3B
2Y │6   9│ 3A
GND│7   8│ 3Y
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
        sublabel: 'CMP',
        pinCount: 16,
        pins: [
            { num: 1, name: 'B3', type: 'input', side: 'left' },
            { num: 2, name: 'IA<B', type: 'input', side: 'left' },
            { num: 3, name: 'IA=B', type: 'input', side: 'left' },
            { num: 4, name: 'IA>B', type: 'input', side: 'left' },
            { num: 5, name: 'OA>B', type: 'output', side: 'left' },
            { num: 6, name: 'OA=B', type: 'output', side: 'left' },
            { num: 7, name: 'OA<B', type: 'output', side: 'left' },
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
            const pin2Grounded = isPinGrounded(comp, 2, nets);
            const pin4Grounded = isPinGrounded(comp, 4, nets);
            const pin3High = g(3) === 1;

            if (!pin2Grounded || !pin3High || !pin4Grounded) {
                return { 5: 0, 6: 0, 7: 0 };
            }

            const A = [g(10), g(12), g(13), g(15)];
            const B = [g(9), g(11), g(14), g(1)];

            for (let i = 3; i >= 0; i--) {
                if (A[i] > B[i]) return { 5: 1, 6: 0, 7: 0 };
                if (A[i] < B[i]) return { 5: 0, 6: 0, 7: 1 };
            }
            return { 5: 0, 6: 1, 7: 0 };
        },
        pinout: `      ┌──U──┐
B3 │1  16│ VCC
IA<B│2  15│ A3
IA=B│3  14│ B2
IA>B│4  13│ A2
OA>B│5  12│ A1
OA=B│6  11│ B1
OA<B│7  10│ A0
GND │8   9│ B0
      └─────┘`,
        truthTable: {
            headers: ['A vs B', 'OA>B', 'OA=B', 'OA<B'],
            rows: [
                ['A > B', 1, 0, 0],
                ['A = B', 0, 1, 0],
                ['A < B', 0, 0, 1],
            ]
        }
    },
    IC7447: {
        name: '74LS47',
        fullName: 'IC 7447 — BCD to 7-Segment Decoder',
        descAr: 'محوّل BCD إلى شاشة 7 أجزاء',
        sublabel: 'BCD→7S',
        pinCount: 16,
        pins: [
            { num: 1, name: 'A1', type: 'input', side: 'left' },
            { num: 2, name: 'A2', type: 'input', side: 'left' },
            { num: 3, name: 'LT', type: 'input', side: 'left' },
            { num: 4, name: 'BI/RBO', type: 'input', side: 'left' },
            { num: 5, name: 'RBI', type: 'input', side: 'left' },
            { num: 6, name: 'A3', type: 'input', side: 'left' },
            { num: 7, name: 'A0', type: 'input', side: 'left' },
            { num: 8, name: 'GND', type: 'power', side: 'left' },
            { num: 9, name: 'e', type: 'output', side: 'right' },
            { num: 10, name: 'd', type: 'output', side: 'right' },
            { num: 11, name: 'c', type: 'output', side: 'right' },
            { num: 12, name: 'b', type: 'output', side: 'right' },
            { num: 13, name: 'a', type: 'output', side: 'right' },
            { num: 14, name: 'g', type: 'output', side: 'right' },
            { num: 15, name: 'f', type: 'output', side: 'right' },
            { num: 16, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates) {
            const g = (p) => pinStates[p] || 0;
            const A0 = g(7), A1 = g(1), A2 = g(2), A3 = g(6);
            const bcd = A0 + A1 * 2 + A2 * 4 + A3 * 8;

            if (g(4) === 0) return { 13: 1, 12: 1, 11: 1, 10: 1, 9: 1, 15: 1, 14: 1 };
            if (g(3) === 0) return { 13: 0, 12: 0, 11: 0, 10: 0, 9: 0, 15: 0, 14: 0 };
            if (g(5) === 0 && bcd === 0) return { 13: 1, 12: 1, 11: 1, 10: 1, 9: 1, 15: 1, 14: 1 };

            const T = [
                [0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 1, 1, 1, 1],
                [0, 0, 1, 0, 0, 1, 0],
                [0, 0, 0, 0, 1, 1, 0],
                [1, 0, 0, 1, 1, 0, 0],
                [0, 1, 0, 0, 1, 0, 0],
                [1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0],
                [1, 1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0],
                [1, 0, 1, 1, 1, 0, 0],
                [0, 1, 1, 0, 1, 0, 0],
                [1, 1, 1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ];
            const s = T[bcd] || T[15];
            return { 13: s[0], 12: s[1], 11: s[2], 10: s[3], 9: s[4], 15: s[5], 14: s[6] };
        },
        pinout: `      ┌──U──┐
A1 │1  16│ VCC
A2 │2  15│ f
LT │3  14│ g
BI/RBO│4  13│ a
RBI │5  12│ b
A3 │6  11│ c
A0 │7  10│ d
GND │8   9│ e
      └─────┘`,
        truthTable: {
            headers: ['BCD', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
            rows: [
                [0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 0, 0, 1, 1, 1, 1],
                [2, 0, 0, 1, 0, 0, 1, 0],
                [3, 0, 0, 0, 0, 1, 1, 0],
                [4, 1, 0, 0, 1, 1, 0, 0],
                [5, 0, 1, 0, 0, 1, 0, 0],
                [6, 1, 1, 0, 0, 0, 0, 0],
                [7, 0, 0, 0, 1, 1, 1, 1],
                [8, 0, 0, 0, 0, 0, 0, 0],
                [9, 0, 0, 0, 1, 1, 0, 0]
            ]
        }
    },
    IC74193: {
        name: '74LS193',
        fullName: 'IC 74193 — 4-Bit Up/Down Counter',
        descAr: 'عدّاد ثنائي 4-بت صعودي/نزولي',
        sublabel: 'CTR',
        pinCount: 16,
        pins: [
            { num: 1, name: 'D1', type: 'input', side: 'left' },
            { num: 2, name: 'Q1', type: 'output', side: 'left' },
            { num: 3, name: 'Q0', type: 'output', side: 'left' },
            { num: 4, name: 'DN', type: 'input', side: 'left' },
            { num: 5, name: 'UP', type: 'input', side: 'left' },
            { num: 6, name: 'Q2', type: 'output', side: 'left' },
            { num: 7, name: 'Q3', type: 'output', side: 'left' },
            { num: 8, name: 'GND', type: 'power', side: 'left' },
            { num: 9, name: 'D3', type: 'input', side: 'right' },
            { num: 10, name: 'D2', type: 'input', side: 'right' },
            { num: 11, name: 'LOAD', type: 'input', side: 'right' },
            { num: 12, name: 'CO', type: 'output', side: 'right' },
            { num: 13, name: 'BO', type: 'output', side: 'right' },
            { num: 14, name: 'CLR', type: 'input', side: 'right' },
            { num: 15, name: 'D0', type: 'input', side: 'right' },
            { num: 16, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates, comp) {
            const g = (p) => pinStates[p] || 0;
            if (comp.counterValue === undefined) comp.counterValue = 0;
            if (!comp._prevClk) comp._prevClk = { up: 0, dn: 0 };

            const UP = g(5), DN = g(4), CLR = g(14), LOAD = g(11);

            if (CLR === 1) {
                comp.counterValue = 0;
            } else if (LOAD === 0) {
                comp.counterValue = g(15) + g(1) * 2 + g(10) * 4 + g(9) * 8;
            } else if (!comp._edgeProcessed) {
                if (UP === 1 && comp._prevClk.up === 0) {
                    comp.counterValue = (comp.counterValue + 1) & 0xF;
                    comp._edgeProcessed = true;
                }
                if (DN === 1 && comp._prevClk.dn === 0) {
                    comp.counterValue = (comp.counterValue - 1) & 0xF;
                    comp._edgeProcessed = true;
                }
            }

            const v = comp.counterValue;
            const CO = (v === 15 && UP === 1) ? 0 : 1;
            const BO = (v === 0 && DN === 1) ? 0 : 1;

            return {
                3: (v >> 0) & 1,
                2: (v >> 1) & 1,
                6: (v >> 2) & 1,
                7: (v >> 3) & 1,
                12: CO,
                13: BO
            };
        },
        pinout: `      ┌──U──┐
D1 │1  16│ VCC
Q1 │2  15│ D0
Q0 │3  14│ CLR
DN │4  13│ BO
UP │5  12│ CO
Q2 │6  11│ LOAD
Q3 │7  10│ D2
GND │8   9│ D3
      └─────┘`,
        truthTable: {
            headers: ['Action', 'Q3', 'Q2', 'Q1', 'Q0'],
            rows: [
                ['CLR=1', '0', '0', '0', '0'],
                ['LOAD=0', 'D3', 'D2', 'D1', 'D0'],
                ['UP↑', 'Count+1', '', '', ''],
                ['DN↑', 'Count-1', '', '', '']
            ]
        }
    },
    IC555: {
        name: 'NE555',
        fullName: 'IC 555 — Timer / Oscillator',
        descAr: 'مؤقت دقيق / مولد نبضات',
        sublabel: 'TMR',
        pinCount: 8,
        pins: [
            { num: 1, name: 'GND', type: 'power', side: 'left' },
            { num: 2, name: 'TRIG', type: 'input', side: 'left' },
            { num: 3, name: 'OUT', type: 'output', side: 'left' },
            { num: 4, name: 'RESET', type: 'input', side: 'left' },
            { num: 5, name: 'CTRL', type: 'input', side: 'right' },
            { num: 6, name: 'THRES', type: 'input', side: 'right' },
            { num: 7, name: 'DISCH', type: 'output', side: 'right' },
            { num: 8, name: 'VCC', type: 'power', side: 'right' },
        ],
        evaluate(pinStates, comp, nets) {
            const g = (p) => pinStates[p] || 0;

            if (comp.timerState === undefined) {
                comp.timerState = {
                    output: 0,
                    discharge: 0,
                    lastTrigger: 0,
                    lastThreshold: 0
                };
            }

            const state = comp.timerState;
            const reset = g(4);
            const trigger = g(2);
            const threshold = g(6);

            if (reset === 0) {
                state.output = 0;
                state.discharge = 0;
                return { 3: 0, 7: 0 };
            }

            if (trigger === 0) {
                state.output = 1;
                state.discharge = 0;
            } else if (threshold === 1) {
                state.output = 0;
                state.discharge = 1;
            }

            return {
                3: state.output,
                7: state.discharge
            };
        },
        pinout: `      ┌──U──┐
GND │1   8│ VCC
TRIG│2   7│ DISCH
OUT │3   6│ THRES
RST │4   5│ CTRL
      └─────┘`,
        truthTable: {
            headers: ['TRIG', 'THRES', 'RESET', 'OUT'],
            rows: [
                ['0', 'X', '1', '1'],
                ['1', '0', '1', 'Maintain'],
                ['1', '1', '1', '0'],
                ['X', 'X', '0', '0'],
            ]
        }
    },
};

// ==========================================
// 7-SEGMENT DISPLAY CONSTANTS
// ==========================================
const SEVEN_SEG_PINS = [
    { num: 1, name: 'e', side: 'left' },
    { num: 2, name: 'd', side: 'left' },
    { num: 3, name: 'COM', side: 'left' },
    { num: 4, name: 'c', side: 'left' },
    { num: 5, name: 'dp', side: 'left' },
    { num: 6, name: 'b', side: 'right' },
    { num: 7, name: 'a', side: 'right' },
    { num: 8, name: 'COM', side: 'right' },
    { num: 9, name: 'f', side: 'right' },
    { num: 10, name: 'g', side: 'right' },
];

const SEG_TO_PIN = { a: 7, b: 6, c: 4, d: 2, e: 1, f: 9, g: 10, dp: 5 };

function isICType(type) { return type in IC_DEFINITIONS; }
function isSevenSegType(type) { return type === 'SEVEN_SEG_CC' || type === 'SEVEN_SEG_CA'; }

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
let selectedCompIds = new Set();
let isSelecting = false;
let selectionStartX = 0, selectionStartY = 0;
let selectionRect = null;
let toolFloatLabel = null;

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
let wireStartComp = null;
let wireStartPin = null;
let wireDrawLine = null;
let wireWaypoints = [];

let wsZoom = 1;
let wsPanX = 0;
let wsPanY = 0;
let isPanning = false;
let panStartX = 0, panStartY = 0;
let panStartPanX = 0, panStartPanY = 0;

let isDragging = false;
let dragComp = null;
let dragOffsetX = 0, dragOffsetY = 0;

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

function rotateDir(dir, rotation) {
    if (!rotation) return dir;
    let { dx, dy } = dir;
    const steps = Math.round(((rotation % 360) + 360) % 360 / 90);
    for (let i = 0; i < steps; i++) {
        const tmp = dx;
        dx = -dy;
        dy = tmp;
    }
    return { dx, dy };
}

function getPinDirection(compId, pinNum) {
    const comp = components.get(compId);
    if (!comp) return { dx: 0, dy: 0 };
    let dir;

    if (isICType(comp.type)) {
        const def = IC_DEFINITIONS[comp.type];
        const pin = def.pins.find(p => p.num === pinNum);
        if (!pin) return { dx: 0, dy: 0 };
        dir = pin.side === 'left' ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };
    } else if (isSevenSegType(comp.type)) {
        const pin = SEVEN_SEG_PINS.find(p => p.num === pinNum);
        if (!pin) return { dx: -1, dy: 0 };
        dir = pin.side === 'left' ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };
    } else if (comp.type === 'DIP_SWITCH') {
        dir = pinNum <= 4 ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };
    } else if (comp.type === 'SWITCH') {
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
    } else if (comp.type === 'PUSH_BUTTON') {
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
    } else if (comp.type === 'LED') {
        dir = { dx: 0, dy: 1 };
    } else if (comp.type === 'VCC') {
        dir = { dx: 0, dy: 1 };
    } else if (comp.type === 'GND') {
        dir = { dx: 0, dy: 1 };
    } else if (comp.type === 'RESISTOR') {
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
    } else if (comp.type === 'CAPACITOR') {
        dir = pinNum === 1 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
    } else {
        dir = { dx: 0, dy: 0 };
    }

    return rotateDir(dir, comp.rotation);
}

function getWireExtension(compId, pinNum) {
    const comp = components.get(compId);
    if (!comp) return 30;

    if (isICType(comp.type)) {
        const def = IC_DEFINITIONS[comp.type];
        const pin = def.pins.find(p => p.num === pinNum);
        if (!pin) return 30;
        const sameSidePins = def.pins.filter(p => p.side === pin.side);
        const idx = sameSidePins.findIndex(p => p.num === pinNum);
        return 20 + idx * 6;
    }

    if (isSevenSegType(comp.type)) {
        const pin = SEVEN_SEG_PINS.find(p => p.num === pinNum);
        if (!pin) return 30;
        const sameSidePins = SEVEN_SEG_PINS.filter(p => p.side === pin.side);
        const idx = sameSidePins.findIndex(p => p.num === pinNum);
        return 20 + idx * 6;
    }

    if (comp.type === 'DIP_SWITCH') return 12;
    if (comp.type === 'SWITCH' || comp.type === 'PUSH_BUTTON') return 12;
    return 12;
}

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
        state: 0,
        rotation: 0,
    };

    if (isICType(type)) {
        const def = IC_DEFINITIONS[type];
        def.pins.forEach(p => { comp.pinStates[p.num] = 0; });
        if (type === 'IC74193') {
            comp.counterValue = 0;
            comp._prevClk = { up: 0, dn: 0 };
            comp._edgeProcessed = false;
        }
        if (type === 'IC555') {
            comp.timerState = { output: 0, discharge: 0, lastTrigger: 0, lastThreshold: 0 };
        }
    } else if (isSevenSegType(type)) {
        comp.pinStates = {};
        SEVEN_SEG_PINS.forEach(p => { comp.pinStates[p.num] = 0; });
        comp.color = 'red';
    } else if (type === 'SWITCH') {
        comp.state = 0;
        comp.pinStates = { 1: 0 };
    } else if (type === 'PUSH_BUTTON') {
        comp.state = 0;
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'DIP_SWITCH') {
        comp.state = [0, 0, 0, 0];
        comp.pinStates = { 1: 0, 2: 0, 3: 0, 4: 0 };
    } else if (type === 'LED') {
        comp.state = 0;
        comp.burned = false;
        comp.color = 'red';
        comp.pinStates = { 1: 0 };
    } else if (type === 'RESISTOR') {
        comp.resistance = 330;
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'CAPACITOR') {
        comp.capacitance = '100nF';
        comp.pinStates = { 1: 0, 2: 0 };
    } else if (type === 'VCC') {
        comp.voltage = '5V';
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
    const oldEl = document.getElementById(comp.id);
    if (oldEl) oldEl.remove();

    const el = document.createElement('div');
    el.className = 'component';
    el.id = comp.id;
    el.dataset.type = comp.type;
    el.style.left = comp.x + 'px';
    el.style.top = comp.y + 'px';

    if (comp.rotation) {
        el.style.transform = `rotate(${comp.rotation}deg)`;
        el.style.transformOrigin = 'center center';
    }

    if (isICType(comp.type)) {
        renderIC(el, comp);
    } else if (isSevenSegType(comp.type)) {
        renderSevenSeg(el, comp);
    } else if (comp.type === 'SWITCH') {
        renderSwitch(el, comp);
    } else if (comp.type === 'PUSH_BUTTON') {
        renderPushButton(el, comp);
    } else if (comp.type === 'DIP_SWITCH') {
        renderDIPSwitch(el, comp);
    } else if (comp.type === 'LED') {
        renderLED(el, comp);
    } else if (comp.type === 'RESISTOR') {
        renderResistor(el, comp);
    } else if (comp.type === 'CAPACITOR') {
        renderCapacitor(el, comp);
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
    const rightPins = def.pins.filter(p => p.side === 'right').reverse();

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
            <span class="ic-chip-sublabel">${def.sublabel || ''}</span>
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
        <div class="switch-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
    `;
}

function renderPushButton(el, comp) {
    el.classList.add('push-button-component');
    el.innerHTML = `
        <div class="switch-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="push-button-body ${comp.state ? 'pressed' : ''}" data-comp="${comp.id}">
            <div class="push-button-cap"></div>
        </div>
        <div class="switch-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
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

function formatResistance(r) {
    if (r >= 1000000) return (r / 1000000).toFixed(r % 1000000 === 0 ? 0 : 1) + 'MΩ';
    if (r >= 1000) return (r / 1000).toFixed(r % 1000 === 0 ? 0 : 1) + 'kΩ';
    return r + 'Ω';
}

function getResistorBandColor(r) {
    if (r >= 1000000) return 'band-blue';
    if (r >= 100000) return 'band-green';
    if (r >= 10000) return 'band-orange';
    if (r >= 1000) return 'band-red';
    if (r >= 100) return 'band-brown';
    return 'band-black';
}

function renderResistor(el, comp) {
    el.classList.add('resistor-component');
    const r = comp.resistance || 330;
    const bandClass = getResistorBandColor(r);
    el.innerHTML = `
        <div class="resistor-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="resistor-body">
            <div class="resistor-bands">
                <div class="resistor-band ${bandClass}"></div>
                <div class="resistor-band ${bandClass}"></div>
                <div class="resistor-band band-brown"></div>
                <div class="resistor-band band-gold"></div>
            </div>
            <span class="resistor-label">${formatResistance(r)}</span>
        </div>
        <div class="resistor-pin" data-comp="${comp.id}" data-pin="2">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="2"></div>
        </div>
    `;
}

function renderCapacitor(el, comp) {
    el.classList.add('capacitor-component');
    el.innerHTML = `
        <div class="capacitor-pin" data-comp="${comp.id}" data-pin="1">
            <div class="pin-dot" data-comp="${comp.id}" data-pin="1"></div>
        </div>
        <div class="capacitor-body">
            <div class="capacitor-symbol">
                <div class="cap-plate"></div>
                <div class="cap-gap"></div>
                <div class="cap-plate"></div>
            </div>
            <span class="capacitor-label">${comp.capacitance || '100nF'}</span>
        </div>
        <div class="capacitor-pin" data-comp="${comp.id}" data-pin="2">
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

function renderDIPSwitch(el, comp) {
    el.classList.add('dip-switch-component');
    const states = comp.state;

    el.innerHTML = `
        <div class="dip-switch-row">
            <div class="dip-switch-col-pins">
                ${[1, 2, 3, 4].map(p => `
                    <div class="dip-pin-wrap" data-comp="${comp.id}" data-pin="${p}">
                        <div class="pin-dot left" data-comp="${comp.id}" data-pin="${p}"></div>
                    </div>
                `).join('')}
            </div>
            <div class="dip-switch-body-container" data-comp="${comp.id}">
                ${[0, 1, 2, 3].map((i, idx) => `
                    <div class="dip-bit-row">
                        <span class="dip-num-left">${idx + 1}</span>
                        <div class="dip-bit ${states[i] ? 'on' : ''}" data-comp="${comp.id}" data-bit="${i}">
                            <div class="dip-bit-knob"></div>
                        </div>
                        <span class="dip-num-right">ON</span>
                    </div>
                `).join('')}
            </div>
            <div class="dip-switch-col-pins">
                ${[8, 7, 6, 5].map(p => `
                    <div class="dip-pin-wrap" data-comp="${comp.id}" data-pin="${p}">
                        <div class="pin-dot right" data-comp="${comp.id}" data-pin="${p}"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSevenSeg(el, comp) {
    el.classList.add('seven-seg-component');
    const leftPins = SEVEN_SEG_PINS.filter(p => p.side === 'left');
    const rightPins = SEVEN_SEG_PINS.filter(p => p.side === 'right').reverse();
    const colorClass = comp.color || 'red';
    const typeLabel = comp.type === 'SEVEN_SEG_CC' ? 'CC' : 'CA';

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
        <div class="seven-seg-body">
            <div class="ic-notch"></div>
            <div class="seven-seg-display ${colorClass}" data-comp="${comp.id}">
                <svg viewBox="0 0 60 100" width="50" height="84">
                    <polygon class="seg seg-a" data-seg="a" points="12,6 48,6 44,12 16,12"/>
                    <polygon class="seg seg-b" data-seg="b" points="49,8 49,46 45,42 45,14"/>
                    <polygon class="seg seg-c" data-seg="c" points="49,52 49,90 45,86 45,56"/>
                    <polygon class="seg seg-d" data-seg="d" points="12,92 48,92 44,86 16,86"/>
                    <polygon class="seg seg-e" data-seg="e" points="11,52 11,90 15,86 15,56"/>
                    <polygon class="seg seg-f" data-seg="f" points="11,8 11,46 15,42 15,14"/>
                    <polygon class="seg seg-g" data-seg="g" points="13,47 47,47 45,52 15,52 13,49"/>
                    <circle class="seg seg-dp" data-seg="dp" cx="54" cy="92" r="3"/>
                </svg>
            </div>
            <span class="seven-seg-type-label">${typeLabel}</span>
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

// ==========================================
// COMPONENT UPDATE
// ==========================================
function updateComponentVisuals(comp) {
    const el = document.getElementById(comp.id);
    if (!el) return;

    if (comp.type === 'SWITCH') {
        const body = el.querySelector('.switch-body');
        if (body) body.classList.toggle('on', !!comp.state);
    } else if (comp.type === 'PUSH_BUTTON') {
        const body = el.querySelector('.push-button-body');
        if (body) body.classList.toggle('pressed', !!comp.state);
    } else if (comp.type === 'DIP_SWITCH') {
        const bits = el.querySelectorAll('.dip-bit');
        bits.forEach(bit => {
            const idx = parseInt(bit.dataset.bit);
            bit.classList.toggle('on', !!comp.state[idx]);
        });
    } else if (comp.type === 'LED') {
        const body = el.querySelector('.led-body');
        if (body) {
            const isBurned = !!comp.burned;
            const isOn = !!comp.state && !isBurned;
            body.classList.toggle('on', isOn);
            body.classList.toggle('burned', isBurned);

            if (isOn) {
                const brightness = comp.brightness !== undefined ? comp.brightness : 1;
                const brightFilter = 0.4 + (1.1 * brightness);
                body.style.filter = `brightness(${brightFilter})`;
                const glowSize = 5 + (25 * brightness);
                body.style.boxShadow = `0 0 ${glowSize}px var(--led-on-glow), 0 0 ${glowSize * 2.5}px var(--led-on-glow)`;
            } else {
                body.style.filter = '';
                body.style.boxShadow = '';
            }
        }
        const label = el.querySelector('.led-label');
        if (label) label.textContent = comp.burned ? '💥 محروق!' : 'LED';
    } else if (isSevenSegType(comp.type)) {
        const isCC = comp.type === 'SEVEN_SEG_CC';
        const comOK = comp._comOK || false;
        const segs = el.querySelectorAll('.seg');
        segs.forEach(seg => {
            const segName = seg.dataset.seg;
            const pinNum = SEG_TO_PIN[segName];
            if (!pinNum) return;
            const pinVal = comp.pinStates[pinNum] || 0;
            let on = false;
            if (comOK) {
                on = isCC ? (pinVal === 1) : (pinVal === 0 && isPinConnected(comp.id, pinNum));
            }
            seg.classList.toggle('on', on);
        });
    }

    if (isICType(comp.type)) {
        const powered = isICPowered(comp);
        el.classList.toggle('unpowered', !powered);
    }

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
    if (fromCompId === toCompId && fromPin === toPin) return null;

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

    if (wire.waypoints && wire.waypoints.length > 0) {
        return getManualWireSegments(wire, p1, p2);
    }

    const dir1 = getPinDirection(wire.from.comp, wire.from.pin);
    const dir2 = getPinDirection(wire.to.comp, wire.to.pin);
    const ext1 = getWireExtension(wire.from.comp, wire.from.pin);
    const ext2 = getWireExtension(wire.to.comp, wire.to.pin);

    let e1x = p1.x + dir1.dx * ext1;
    let e1y = p1.y + dir1.dy * ext1;
    let e2x = p2.x + dir2.dx * ext2;
    let e2y = p2.y + dir2.dy * ext2;

    const obstacles = getComponentBounds([wire.from.comp, wire.to.comp]);

    for (const box of obstacles) {
        if (dir1.dx !== 0) {
            if (e1x >= box.x1 && e1x <= box.x2) {
                const yMin = Math.min(p1.y, e2y);
                const yMax = Math.max(p1.y, e2y);
                if (!(yMax < box.y1 || yMin > box.y2)) {
                    e1x = dir1.dx < 0 ? Math.min(e1x, box.x1 - 5) : Math.max(e1x, box.x2 + 5);
                }
            }
        } else {
            if (e1y >= box.y1 && e1y <= box.y2) {
                const xMin = Math.min(p1.x, e2x);
                const xMax = Math.max(p1.x, e2x);
                if (!(xMax < box.x1 || xMin > box.x2)) {
                    e1y = dir1.dy < 0 ? Math.min(e1y, box.y1 - 5) : Math.max(e1y, box.y2 + 5);
                }
            }
        }
        if (dir2.dx !== 0) {
            if (e2x >= box.x1 && e2x <= box.x2) {
                const yMin = Math.min(p2.y, e1y);
                const yMax = Math.max(p2.y, e1y);
                if (!(yMax < box.y1 || yMin > box.y2)) {
                    e2x = dir2.dx < 0 ? Math.min(e2x, box.x1 - 5) : Math.max(e2x, box.x2 + 5);
                }
            }
        } else {
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
        segments.push({ x1: p1.x, y1: p1.y, x2: e1x, y2: p1.y, type: 'H' });
        segments.push({ x1: e1x, y1: p1.y, x2: e1x, y2: e2y, type: 'V' });
        segments.push({ x1: e1x, y1: e2y, x2: e2x, y2: e2y, type: 'H' });
        segments.push({ x1: e2x, y1: e2y, x2: p2.x, y2: p2.y, type: 'V' });
    } else {
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
    const segments = getWireSegments(wire);
    const otherHoriz = getAllHorizontalSegments(wire.id);

    let d = `M ${p1.x} ${p1.y}`;
    let cx = p1.x;
    let cy = p1.y;
    const ARC_R = 4;

    for (const seg of segments) {
        if (seg.type === 'H') {
            d += ` L ${seg.x2} ${seg.y2}`;
            cx = seg.x2;
            cy = seg.y2;
        } else {
            const x = seg.x1;
            const yStart = seg.y1;
            const yEnd = seg.y2;
            const yMin = Math.min(yStart, yEnd);
            const yMax = Math.max(yStart, yEnd);
            const goingDown = yEnd > yStart;

            const hits = [];
            for (const h of otherHoriz) {
                const hxMin = Math.min(h.x1, h.x2);
                const hxMax = Math.max(h.x1, h.x2);
                const hy = h.y1;

                if (hy > yMin + ARC_R && hy < yMax - ARC_R) {
                    if (x > hxMin && x < hxMax) {
                        hits.push(hy);
                    }
                }
            }

            hits.sort((a, b) => goingDown ? a - b : b - a);

            let currentY = yStart;
            for (const hy of hits) {
                const approachY = goingDown ? hy - ARC_R : hy + ARC_R;
                d += ` L ${x} ${approachY}`;
                const landY = goingDown ? hy + ARC_R : hy - ARC_R;
                d += ` A ${ARC_R} ${ARC_R} 0 0 1 ${x} ${landY}`;
                currentY = landY;
            }
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
    pathEl.style.fill = 'none';

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
    const toDelete = [];
    for (const [wid, w] of wires) {
        if (w.from.comp === compId || w.to.comp === compId) {
            toDelete.push(wid);
        }
    }
    toDelete.forEach(wid => deleteWire(wid));

    const comp = components.get(compId);
    const el = document.getElementById(compId);
    if (el) el.remove();
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

    const vccHigh = comp.pinStates[vccPin.num] === 1;

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
    for (const net of nets) {
        const hasLED = net.some(p => p.comp === ledComp.id && p.pin === 1);
        if (hasLED) {
            const res = net.find(p => {
                const c = components.get(p.comp);
                return c && c.type === 'RESISTOR';
            });
            if (res) {
                const resComp = components.get(res.comp);
                const r = resComp.resistance || 330;
                return r >= 150;
            }
            return false;
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

function isPinVCC(comp, pinNum, nets) {
    for (const net of nets) {
        const hasPin = net.some(p => p.comp === comp.id && p.pin === pinNum);
        if (hasPin) {
            return net.some(p => {
                const c = components.get(p.comp);
                return c && c.type === 'VCC';
            });
        }
    }
    return false;
}

function isPinConnected(compId, pinNum) {
    for (const [, wire] of wires) {
        if ((wire.from.comp === compId && wire.from.pin === pinNum) ||
            (wire.to.comp === compId && wire.to.pin === pinNum)) {
            return true;
        }
    }
    return false;
}

// ==========================================
// SIMULATION ENGINE
// ==========================================
function simulate() {
    const nets = buildNets();

    for (const [, comp] of components) {
        if (isICType(comp.type)) {
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
            if (comp.type === 'IC74193') comp._edgeProcessed = false;
        } else if (comp.type === 'LED') {
            comp.state = 0;
            comp.pinStates[1] = 0;
        } else if (isSevenSegType(comp.type)) {
            for (let p = 1; p <= 10; p++) comp.pinStates[p] = 0;
        } else if (comp.type === 'RESISTOR' || comp.type === 'CAPACITOR') {
            comp.pinStates[1] = 0;
            comp.pinStates[2] = 0;
        }
    }

    for (let iter = 0; iter < 20; iter++) {
        let changed = false;

        for (const net of nets) {
            let value = 0;
            for (const pin of net) {
                const comp = components.get(pin.comp);
                if (!comp) continue;
                if (comp.type === 'VCC') {
                    value = 1;
                } else if (comp.type === 'GND') {
                    // value stays 0
                } else if (comp.type === 'RESISTOR' || comp.type === 'CAPACITOR' || comp.type === 'SWITCH' || comp.type === 'PUSH_BUTTON') {
                    const otherPin = pin.pin === 1 ? 2 : 1;
                    value = value || (comp.pinStates[otherPin] || 0);
                } else if (comp.type === 'DIP_SWITCH') {
                    const pairs = { 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };
                    const otherPin = pairs[pin.pin];
                    if (otherPin) {
                        value = value || (comp.pinStates[otherPin] || 0);
                    }
                } else if (isICType(comp.type)) {
                    const def = IC_DEFINITIONS[comp.type];
                    const pinDef = def.pins.find(p => p.num === pin.pin);
                    if (pinDef && pinDef.type === 'output') {
                        value = value || (comp.pinStates[pin.pin] || 0);
                    }
                }
            }

            for (const pin of net) {
                const comp = components.get(pin.comp);
                if (!comp) continue;
                if (comp.type === 'LED') {
                    if (comp.pinStates[1] !== value) { comp.pinStates[1] = value; changed = true; }
                    comp.state = value;

                    if (value) {
                        let resistance = Infinity;
                        const hasDirectVCC = net.some(nep => {
                            const c = components.get(nep.comp);
                            return c && c.type === 'VCC';
                        });

                        if (hasDirectVCC) {
                            resistance = 0;
                        } else {
                            net.forEach(nep => {
                                const c = components.get(nep.comp);
                                if (c && c.type === 'RESISTOR') {
                                    const otherPin = nep.pin === 1 ? 2 : 1;
                                    const rVal = c.resistance || 330;
                                    resistance = Math.min(resistance, rVal);
                                } else if (c && isICType(c.type)) {
                                    resistance = Math.min(resistance, 220);
                                }
                            });
                        }

                        if (resistance === Infinity) resistance = 0;
                        const current = 3 / Math.max(1, resistance);

                        if (current > 0.05) {
                            comp.burned = true;
                            comp.state = 0;
                        } else {
                            comp.burned = false;
                            let ratio = current / 0.02;
                            if (ratio < 0) ratio = 0;
                            let b = Math.pow(ratio, 0.5);
                            if (b > 1.2) b = 1.2;
                            if (b < 0.1 && current > 0.0001) b = 0.1;
                            if (current <= 0.0001) b = 0;
                            comp.brightness = b;
                        }
                    } else {
                        comp.brightness = 0;
                        if (comp.burned) {
                            comp.burned = false;
                        }
                    }
                } else if (isSevenSegType(comp.type)) {
                    if (comp.pinStates[pin.pin] !== value) { comp.pinStates[pin.pin] = value; changed = true; }
                } else if (comp.type === 'RESISTOR' || comp.type === 'CAPACITOR') {
                    if (comp.pinStates[pin.pin] !== value) { comp.pinStates[pin.pin] = value; changed = true; }
                } else if (isICType(comp.type)) {
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

        for (const [, comp] of components) {
            if (isICType(comp.type)) {
                if (!isICPowered(comp)) {
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

    for (const [, comp] of components) {
        if (comp.type === 'IC74193') {
            if (!comp._prevClk) comp._prevClk = { up: 0, dn: 0 };
            comp._prevClk.up = comp.pinStates[5] || 0;
            comp._prevClk.dn = comp.pinStates[4] || 0;
        }
    }

    for (const [, comp] of components) {
        if (isSevenSegType(comp.type)) {
            const isCC = comp.type === 'SEVEN_SEG_CC';
            if (isCC) {
                comp._comOK = isPinGrounded(comp, 3, nets) || isPinGrounded(comp, 8, nets);
            } else {
                comp._comOK = isPinVCC(comp, 3, nets) || isPinVCC(comp, 8, nets);
            }
        }
    }

    for (const [, comp] of components) {
        if (comp.type === 'LED') {
            if (comp.state) {
                comp.burned = !isLEDProtected(comp, nets);
            } else {
                comp.burned = false;
            }
        }
    }

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

    for (const [, comp] of components) {
        updateComponentVisuals(comp);
    }

    if (selectedCompId) {
        const comp = components.get(selectedCompId);
        if (comp && isICType(comp.type)) {
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

    function merge(c1, p1, c2, p2) {
        const k1 = pinKey(c1, p1);
        const k2 = pinKey(c2, p2);
        const net1 = pinToNet.get(k1);
        const net2 = pinToNet.get(k2);

        if (net1 !== undefined && net2 !== undefined) {
            if (net1 !== net2) {
                const net2Pins = nets[net2];
                for (const p of net2Pins) {
                    nets[net1].push(p);
                    pinToNet.set(pinKey(p.comp, p.pin), net1);
                }
                nets[net2] = [];
            }
        } else if (net1 !== undefined) {
            nets[net1].push({ comp: c2, pin: p2 });
            pinToNet.set(k2, net1);
        } else if (net2 !== undefined) {
            nets[net2].push({ comp: c1, pin: p1 });
            pinToNet.set(k1, net2);
        } else {
            const idx = nets.length;
            nets.push([
                { comp: c1, pin: p1 },
                { comp: c2, pin: p2 }
            ]);
            pinToNet.set(k1, idx);
            pinToNet.set(k2, idx);
        }
    }

    for (const [, wire] of wires) {
        merge(wire.from.comp, wire.from.pin, wire.to.comp, wire.to.pin);
    }

    for (const [id, comp] of components) {
        if (comp.type === 'SWITCH') {
            if (comp.state) merge(id, 1, id, 2);
        } else if (comp.type === 'PUSH_BUTTON') {
            if (comp.state) merge(id, 1, id, 2);
        } else if (comp.type === 'DIP_SWITCH') {
            const states = comp.state;
            for (let i = 0; i < 4; i++) {
                if (states[i]) {
                    merge(id, i + 1, id, 8 - i);
                }
            }
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

    if (isICType(comp.type)) {
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
                    💥 LED محروق!<br><small style="font-size:11px; font-weight:400;">لم يتم توصيل مقاومة حماية</small>
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
    } else if (isSevenSegType(comp.type)) {
        const isCC = comp.type === 'SEVEN_SEG_CC';
        const typeName = isCC ? 'Common Cathode' : 'Common Anode';
        const typeAr = isCC ? 'كاثود مشترك' : 'أنود مشترك';
        let segStatesHTML = '';

        SEVEN_SEG_PINS.forEach(p => {
            const val = comp.pinStates[p.num] || 0;
            segStatesHTML += `
                <li class="pin-state-item">
                    <span class="pin-state-name">Pin ${p.num} (${p.name})</span>
                    <span class="pin-state-val ${val ? 'high' : 'low'}">${val}</span>
                </li>
            `;
        });

        const segOrder = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
        const segVals = segOrder.map(s => {
            const pin = SEG_TO_PIN[s];
            const raw = comp.pinStates[pin] || 0;
            return isCC ? raw : (isPinConnected(comp.id, pin) ? (raw === 0 ? 1 : 0) : 0);
        });

        const digitMap = {
            '1111110': '0', '0110000': '1', '1101101': '2', '1111001': '3',
            '0110011': '4', '1011011': '5', '1011111': '6', '1110000': '7',
            '1111111': '8', '1111011': '9', '1110111': 'A', '0011111': 'b',
            '1001110': 'C', '0111101': 'd', '1001111': 'E', '1000111': 'F'
        };
        const digit = (comp._comOK ? digitMap[segVals.join('')] : null) || '—';

        infoDetails.innerHTML = `
            <div class="info-title">شاشة 7-Segment (${typeAr})</div>
            <div class="info-subtitle">7-Segment Display — ${typeName}</div>
            <div class="info-section">
                <div class="info-section-title">الرقم المعروض</div>
                <p style="font-size:36px; font-weight:700; text-align:center; padding:10px; color:var(--led-on); font-family:var(--font-mono);">
                    ${digit}
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">حالة الأطراف</div>
                <ul class="pin-states">${segStatesHTML}</ul>
            </div>
            <div class="info-section">
                <div class="info-section-title">ترتيب الأطراف (DIP)</div>
                <div class="pinout-diagram">      ┌──────┐
e │1  10│ g
d │2   9│ f
COM │3   8│ COM
c │4   7│ a
dp │5   6│ b
      └──────┘</div>
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    ${isCC
            ? 'وصّل COM بـ GND. كل شريحة تضيء عندما يكون الطرف HIGH.'
            : 'وصّل COM بـ VCC. كل شريحة تضيء عندما يكون الطرف LOW. مناسب مع IC 7447.'}
                </p>
            </div>
        `;
    } else if (comp.type === 'RESISTOR') {
        const r = comp.resistance || 330;
        const current_mA = (3 / r * 1000).toFixed(1);
        const power_mW = (3 * 3 / r * 1000).toFixed(1);
        let statusMsg = '';

        if (r < 150) statusMsg = '<span style="color:#e74c3c; font-weight:700;">⚠️ تيار مرتفع جداً — LED سيحترق! (I > 20mA)</span>';
        else if (r > 10000) statusMsg = '<span style="color:#f39c12; font-weight:700;">⚡ تيار منخفض جداً — LED قد لا يضيء</span>';
        else statusMsg = '<span style="color:#2ecc71; font-weight:700;">✅ قيمة مناسبة — LED محمي</span>';

        infoDetails.innerHTML = `
            <div class="info-title">مقاومة ${formatResistance(r)}</div>
            <div class="info-subtitle">Resistor</div>
            <div class="info-section">
                <div class="info-section-title">القيمة</div>
                <p style="font-size:18px; font-weight:700; text-align:center; padding:10px;">${formatResistance(r)}</p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الحسابات (مع LED)</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.8;">
                    ⚡ التيار: I = (5V − 2V) / ${formatResistance(r)} = ${current_mA} mA<br>
                    🔋 القدرة: P = V²/R = ${power_mW} mW
                </p>
                ${statusMsg}
            </div>
            <div class="info-section">
                <div class="info-section-title">ملاحظة</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    كلّك يمين على المقاومة لتغيير القيمة.<br>
                    R ≥ 150Ω = LED محمي | R < 150Ω = LED يحترق | R > 10kΩ = ضعيف
                </p>
            </div>
        `;
    } else if (comp.type === 'CAPACITOR') {
        infoDetails.innerHTML = `
            <div class="info-title">مكثف ${comp.capacitance || '100nF'}</div>
            <div class="info-subtitle">Capacitor</div>
            <div class="info-section">
                <div class="info-section-title">السعة</div>
                <p style="font-size:18px; font-weight:700; text-align:center; padding:10px;">${comp.capacitance || '100nF'}</p>
            </div>
            <div class="info-section">
                <div class="info-section-title">الاستخدام</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    المكثف يخزن الشحنة الكهربائية. يُستخدم في دوائر التوقيت مع الـ 555 Timer.
                </p>
            </div>
            <div class="info-section">
                <div class="info-section-title">ملاحظة</div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                    كلّك يمين على المكثف لتغيير القيمة.
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

    // Add 555 Timer frequency info
    if (comp.type === 'IC555') {
        const extraInfo = document.createElement('div');
        extraInfo.className = 'info-section';
        extraInfo.innerHTML = `
            <div class="info-section-title">⚡ وضع التشغيل</div>
            <p style="font-size:11px; color:var(--text-secondary); line-height:1.6;">
                🔌 وضع غير مستقر (Astable) — يولد نبضات مستمرة<br>
                📊 وصل TRIG (2) مع THRES (6) للوضع غير المستقر<br>
                💡 التردد يعتمد على R1, R2, و C
            </p>
            <div class="info-section-title" style="margin-top:10px;">🔧 تغيير التردد</div>
            <p style="font-size:10px; color:var(--text-muted); line-height:1.6;">
                • كلّك يمين على المقاومات R1 أو R2 لتغيير القيم<br>
                • كلّك يمين على المكثف لتغيير السعة<br>
                • المعادلة: f = 1.44 / ((R1 + 2×R2) × C)
            </p>
        `;
        infoDetails.appendChild(extraInfo);
    }
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

    wsContainer.dataset.toolLabel = '';
    const toolNames = { select: 'اختيار', wire: 'سلك', delete: 'حذف', 'cut-wire': 'قطع سلك' };
    if (tool !== 'select') wsContainer.dataset.toolLabel = toolNames[tool] || tool;

    statusTool.textContent = `🔧 الأداة: ${toolNames[tool] || tool}`;
    removeGhostPreview();
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

document.querySelectorAll('.comp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        placingType = btn.dataset.type;
        setTool('select');
        placingType = btn.dataset.type;
        wsContainer.className = 'tool-place';
        statusHint.textContent = `انقر على مساحة العمل لوضع ${btn.querySelector('.comp-name').textContent}`;
        createGhostPreview(btn.dataset.type);
    });
});

let ghostPreview = null;

function createGhostPreview(type) {
    removeGhostPreview();
    const tempId = 'ghost-preview';
    const tempComp = { id: tempId, type: type, x: -9999, y: -9999, pinStates: {}, rotation: 0 };

    if (type === 'DIP_SWITCH') tempComp.state = [0, 0, 0, 0];
    else if (type === 'SWITCH') tempComp.state = 0;
    else if (type === 'LED') { tempComp.state = 0; tempComp.color = 'red'; }
    else if (type === 'VCC') tempComp.voltage = '5V';
    else if (type === 'RESISTOR') tempComp.resistance = 330;
    else if (type === 'CAPACITOR') tempComp.capacitance = '100nF';

    ghostPreview = document.createElement('div');
    ghostPreview.className = 'component ghost-preview';
    ghostPreview.style.position = 'absolute';
    ghostPreview.style.pointerEvents = 'none';
    ghostPreview.style.opacity = '0.45';
    ghostPreview.style.zIndex = '1000';
    ghostPreview.style.filter = 'blur(0.5px)';

    if (isICType(type)) renderIC(ghostPreview, tempComp);
    else if (type === 'SWITCH') {
        ghostPreview.classList.add('switch-component');
        ghostPreview.innerHTML = '<div class="switch-body"><div class="switch-track"><div class="switch-knob"></div></div><span class="switch-label">OFF</span></div>';
    } else if (type === 'LED') {
        ghostPreview.classList.add('led-component');
        ghostPreview.innerHTML = '<div class="led-body" style="background:rgba(255,0,0,0.3)"><div class="led-glow"></div></div>';
    } else if (type === 'VCC') renderVCC(ghostPreview, tempComp);
    else if (type === 'GND') renderGND(ghostPreview, tempComp);
    else if (type === 'RESISTOR') renderResistor(ghostPreview, tempComp);
    else if (type === 'CAPACITOR') renderCapacitor(ghostPreview, tempComp);
    else if (type === 'DIP_SWITCH') renderDIPSwitch(ghostPreview, tempComp);
    else if (isSevenSegType(type)) renderSevenSeg(ghostPreview, tempComp);

    workspace.appendChild(ghostPreview);
}

function removeGhostPreview() {
    if (ghostPreview) {
        ghostPreview.remove();
        ghostPreview = null;
    }
}

document.querySelectorAll('.sidebar-category-header').forEach(header => {
    header.addEventListener('click', () => {
        header.parentElement.classList.toggle('collapsed');
    });
});

const compSearchInput = document.getElementById('comp-search');
if (compSearchInput) {
    compSearchInput.addEventListener('input', () => {
        const q = compSearchInput.value.trim().toLowerCase();
        document.querySelectorAll('.sidebar-category').forEach(cat => {
            const items = cat.querySelectorAll('.comp-btn');
            let anyVisible = false;
            items.forEach(btn => {
                const name = (btn.querySelector('.comp-name')?.textContent || '').toLowerCase();
                const desc = (btn.querySelector('.comp-desc')?.textContent || '').toLowerCase();
                const type = (btn.dataset.type || '').toLowerCase();
                const match = !q || name.includes(q) || desc.includes(q) || type.includes(q);
                btn.classList.toggle('hidden', !match);
                if (match) anyVisible = true;
            });
            if (q) {
                cat.classList.toggle('collapsed', !anyVisible);
            }
        });
    });
}

wsContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('#zoom-controls')) return;

    if (placingType && e.button === 0) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        createComponent(placingType, coords.x - 40, coords.y - 30);
        createGhostPreview(placingType);
        return;
    }

    const pinEl = e.target.closest('[data-pin]');
    if (pinEl && (currentTool === 'wire' || currentTool === 'select')) {
        if (pinEl.classList.contains('component')) return;
        const ci = pinEl.dataset.comp;
        const pi = parseInt(pinEl.dataset.pin);
        handlePinClick(ci, pi, e);
        return;
    }

    if (wireStartComp && e.button === 0 && (currentTool === 'wire' || currentTool === 'select')) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        wireWaypoints.push({ x: coords.x, y: coords.y });
        updateHint();
        return;
    }

    if (currentTool === 'delete' || currentTool === 'cut-wire') {
        const wirePath = e.target.closest('.wire');
        if (wirePath) {
            e.stopPropagation();
            deleteWire(wirePath.dataset.wireId);
            return;
        }
        if (currentTool === 'cut-wire') return;
        const comp = e.target.closest('.component');
        if (comp) {
            deleteComponent(comp.id);
            return;
        }
    }

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

        const dipBit = e.target.closest('.dip-bit');
        if (dipBit) {
            const comp = components.get(dipBit.dataset.comp);
            const bitIdx = parseInt(dipBit.dataset.bit);
            if (comp && comp.type === 'DIP_SWITCH') {
                comp.state[bitIdx] = comp.state[bitIdx] ? 0 : 1;
                simulate();
                updateComponentVisuals(comp);
                showComponentInfo(comp);
            }
            return;
        }

        const pbBody = e.target.closest('.push-button-body');
        if (pbBody) {
            const comp = components.get(pbBody.dataset.comp);
            if (comp) {
                comp.state = 1;
                simulate();
                updateComponentVisuals(comp);
                const releaseHandler = () => {
                    comp.state = 0;
                    simulate();
                    updateComponentVisuals(comp);
                    document.removeEventListener('mouseup', releaseHandler);
                };
                document.addEventListener('mouseup', releaseHandler);
            }
            return;
        }
    }

    if (currentTool === 'select' && !placingType) {
        const compEl = e.target.closest('.component');
        if (compEl && e.button === 0) {
            if (e.ctrlKey) {
                if (selectedCompIds.has(compEl.id)) {
                    selectedCompIds.delete(compEl.id);
                    compEl.classList.remove('selected', 'multi-selected');
                } else {
                    selectedCompIds.add(compEl.id);
                    compEl.classList.add('multi-selected');
                }
                selectedCompId = compEl.id;
            } else {
                clearMultiSelect();
                selectComponent(compEl.id);
            }

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

        if (!compEl && e.button === 0) {
            if (e.ctrlKey) {
                isSelecting = true;
                const coords = getWorkspaceCoords(e.clientX, e.clientY);
                selectionStartX = coords.x;
                selectionStartY = coords.y;
                selectionRect = document.createElement('div');
                selectionRect.className = 'selection-rect';
                workspace.appendChild(selectionRect);
            } else {
                clearMultiSelect();
                deselectAll();
                isPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                panStartPanX = wsPanX;
                panStartPanY = wsPanY;
                wsContainer.style.cursor = 'grabbing';
            }
        }
    }

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

document.addEventListener('mousemove', (e) => {
    const coords = getWorkspaceCoords(e.clientX, e.clientY);
    statusCoords.textContent = `X: ${Math.round(coords.x)} Y: ${Math.round(coords.y)}`;

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

    if (isPanning) {
        wsPanX = panStartPanX + (e.clientX - panStartX);
        wsPanY = panStartPanY + (e.clientY - panStartY);
        applyTransform();
        return;
    }

    if (ghostPreview && placingType) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        ghostPreview.style.left = (coords.x - 40) + 'px';
        ghostPreview.style.top = (coords.y - 30) + 'px';
    }

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

    if (isSelecting && selectionRect) {
        const coords = getWorkspaceCoords(e.clientX, e.clientY);
        const x = Math.min(selectionStartX, coords.x);
        const y = Math.min(selectionStartY, coords.y);
        const w = Math.abs(coords.x - selectionStartX);
        const h = Math.abs(coords.y - selectionStartY);
        selectionRect.style.left = x + 'px';
        selectionRect.style.top = y + 'px';
        selectionRect.style.width = w + 'px';
        selectionRect.style.height = h + 'px';
    }

    if (toolFloatLabel) {
        toolFloatLabel.style.left = e.clientX + 'px';
        toolFloatLabel.style.top = e.clientY + 'px';
    }
});

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

    if (isSelecting && selectionRect) {
        const rect = selectionRect.getBoundingClientRect();
        components.forEach((comp, id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const compRect = el.getBoundingClientRect();
            const cx = compRect.left + compRect.width / 2;
            const cy = compRect.top + compRect.height / 2;
            if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
                selectedCompIds.add(id);
                el.classList.add('multi-selected');
            }
        });
        selectionRect.remove();
        selectionRect = null;
        isSelecting = false;
    }

    if (isPanning) {
        isPanning = false;
        wsContainer.style.cursor = '';
    }
});

wsContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newZoom = Math.max(0.3, Math.min(3, wsZoom + delta));
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

function handlePinClick(compId, pinNum, e) {
    e.stopPropagation();
    if (!wireStartComp) {
        wireStartComp = compId;
        wireStartPin = pinNum;
        wireWaypoints = [];

        wireDrawLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        wireDrawLine.classList.add('wire-drawing');
        wireLayer.appendChild(wireDrawLine);

        const p = getPinWorldPos(compId, pinNum);
        wireDrawLine.setAttribute('d', `M ${p.x} ${p.y} L ${p.x} ${p.y}`);

        updateHint();
    } else {
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

function selectComponent(compId) {
    document.querySelectorAll('.component.selected').forEach(el => el.classList.remove('selected'));
    selectedCompId = compId;
    const el = document.getElementById(compId);
    if (el) el.classList.add('selected');

    const comp = components.get(compId);
    if (comp) showComponentInfo(comp);
}

function deselectAll() {
    document.querySelectorAll('.component.selected').forEach(el => el.classList.remove('selected'));
    selectedCompId = null;
    showInfoPlaceholder();
}

function clearMultiSelect() {
    document.querySelectorAll('.component.multi-selected').forEach(el => el.classList.remove('multi-selected'));
    selectedCompIds.clear();
}

function rotateComponent(compId) {
    const comp = components.get(compId);
    if (!comp) return;
    comp.rotation = ((comp.rotation || 0) + 90) % 360;
    renderComponent(comp);
    updateComponentVisuals(comp);
    updateAllWires();
    if (selectedCompId === compId) showComponentInfo(comp);
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Escape') {
        cancelWireDrawing();
        placingType = null;
        removeGhostPreview();
        wsContainer.className = '';
        clearMultiSelect();
        deselectAll();
        updateHint();
    }
    if (e.key === 's' || e.key === 'S') setTool('select');
    if (e.key === 'w' || e.key === 'W') setTool('wire');
    if (e.key === 'x' || e.key === 'X') setTool('cut-wire');
    if (e.key === 'd' || e.key === 'D') setTool('delete');

    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey) {
        if (selectedCompIds.size > 0) {
            selectedCompIds.forEach(id => rotateComponent(id));
        } else if (selectedCompId) {
            rotateComponent(selectedCompId);
        }
    }

    if (e.key === 'Delete') {
        if (selectedCompIds.size > 0) {
            selectedCompIds.forEach(id => deleteComponent(id));
            clearMultiSelect();
            deselectAll();
        } else if (selectedCompId) {
            deleteComponent(selectedCompId);
            selectedCompId = null;
            showInfoPlaceholder();
        }
    }
});

let contextMenu = null;

wsContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    if (wireStartComp) {
        cancelWireDrawing();
        return;
    }

    if (placingType) {
        placingType = null;
        removeGhostPreview();
        wsContainer.className = '';
        updateHint();
        return;
    }

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

        if (comp.type === 'LED' || isSevenSegType(comp.type)) {
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
        } else if (comp.type === 'RESISTOR') {
            extraOptions = `<div class="context-menu-item" data-action="resistance">Ω قيمة المقاومة: ${formatResistance(comp.resistance || 330)}</div>`;
        } else if (comp.type === 'CAPACITOR') {
            const capValues = ['10pF', '100pF', '1nF', '10nF', '100nF', '1µF', '10µF', '47µF', '100µF', '470µF'];
            const curCap = comp.capacitance || '100nF';
            const btns = capValues.map(v => `<div class="context-menu-item ${v === curCap ? 'active-freq' : ''}" data-action="capacitance" data-cap="${v}">⚡ ${v}</div>`).join('');
            extraOptions = btns;
        }

        const curRot = comp.rotation || 0;
        const rotOptions = [0, 90, 180, 270].map(deg =>
            `<span class="rotate-opt ${curRot === deg ? 'active' : ''}" data-deg="${deg}">${deg}°</span>`
        ).join('');

        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="info">ℹ️ معلومات</div>
            <div class="context-menu-item no-hover" style="flex-direction:column; align-items:flex-start; pointer-events:none;">
                <span style="margin-bottom:6px; font-size:11px; opacity:0.8; font-weight:600;">🔄 التدوير</span>
                <div class="rotate-options" style="pointer-events:all;">${rotOptions}</div>
            </div>
            <div class="context-menu-item" data-action="flip-h">↔️ عكس أفقي</div>
            <div class="context-menu-item" data-action="flip-v">↕️ عكس عمودي</div>
            ${extraOptions}
            <div class="context-menu-item danger" data-action="delete">🗑️ حذف</div>
        `;

        contextMenu.addEventListener('click', (ev) => {
            const action = ev.target.closest('.context-menu-item')?.dataset.action;
            const swatch = ev.target.closest('.color-swatch');

            if (action === 'delete') deleteComponent(compEl.id);
            if (action === 'info') selectComponent(compEl.id);

            const rotOpt = ev.target.closest('.rotate-opt');
            if (rotOpt) {
                const deg = parseInt(rotOpt.dataset.deg);
                comp.rotation = deg;
                renderComponent(comp);
                updateComponentVisuals(comp);
                updateAllWires();
                if (selectedCompId === compEl.id) showComponentInfo(comp);
                removeContextMenu();
                return;
            }

            if (action === 'flip-h') {
                const r = comp.rotation || 0;
                comp.rotation = r === 90 ? 270 : r === 270 ? 90 : r;
                if (comp.rotation === r) comp.rotation = (r + 180) % 360;
                renderComponent(comp);
                updateComponentVisuals(comp);
                updateAllWires();
                removeContextMenu();
                return;
            }

            if (action === 'flip-v') {
                const r = comp.rotation || 0;
                comp.rotation = (r + 180) % 360;
                renderComponent(comp);
                updateComponentVisuals(comp);
                updateAllWires();
                removeContextMenu();
                return;
            }

            if (swatch) {
                const newColor = swatch.dataset.color;
                comp.color = newColor;
                renderComponent(comp);
                updateComponentVisuals(comp);
                removeContextMenu();
            }

            if (action === 'voltage') {
                const volts = ['5V', '3.3V', '12V'];
                const currIdx = volts.indexOf(comp.voltage || '5V');
                comp.voltage = volts[(currIdx + 1) % volts.length];
                renderComponent(comp);
                removeContextMenu();
            }

            if (action === 'resistance') {
                removeContextMenu();
                const r = comp.resistance || 330;
                const current_mA = (3 / r * 1000).toFixed(1);
                const input = prompt(`أدخل قيمة المقاومة بالأوم (Ω)\nالقيمة الحالية: ${formatResistance(r)}\nالتيار: ${current_mA}mA (مع LED)`, r);
                if (input !== null) {
                    const val = parseFloat(input);
                    if (!isNaN(val) && val > 0) {
                        comp.resistance = val;
                        renderComponent(comp);
                        simulate();
                        if (selectedCompId && components.get(selectedCompId)?.type === 'IC555') {
                            showComponentInfo(components.get(selectedCompId));
                        }
                    }
                }
            }

            if (action === 'capacitance') {
                const newCap = ev.target.dataset.cap;
                comp.capacitance = newCap;
                renderComponent(comp);
                if (selectedCompId && components.get(selectedCompId)?.type === 'IC555') {
                    showComponentInfo(components.get(selectedCompId));
                }
                removeContextMenu();
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
                e.stopPropagation();
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

document.getElementById('btn-clear').addEventListener('click', () => {
    if (components.size === 0) return;
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

document.getElementById('btn-example2').addEventListener('click', () => {
    clearAll();
    const ic = createComponent('IC7485', 400, 220);

    const dipA = createComponent('DIP_SWITCH', 100, 150);
    const dipB = createComponent('DIP_SWITCH', 100, 450);

    const resGT = createComponent('RESISTOR', 650, 240);
    const resEQ = createComponent('RESISTOR', 650, 320);
    const resLT = createComponent('RESISTOR', 650, 400);
    const ledGT = createComponent('LED', 750, 240);
    const ledEQ = createComponent('LED', 750, 320);
    const ledLT = createComponent('LED', 750, 400);

    const vcc = createComponent('VCC', 630, 80);
    const gnd = createComponent('GND', 340, 570);
    const vccDip = createComponent('VCC', 230, 300);
    const vccCasc = createComponent('VCC', 200, 630);

    ledGT.color = 'green';
    ledEQ.color = 'yellow';
    ledLT.color = 'red';
    renderComponent(ledGT);
    renderComponent(ledEQ);
    renderComponent(ledLT);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            createWire(vccDip.id, 1, dipA.id, 8);
            createWire(vccDip.id, 1, dipA.id, 7);
            createWire(vccDip.id, 1, dipA.id, 6);
            createWire(vccDip.id, 1, dipA.id, 5);

            createWire(dipA.id, 1, ic.id, 15);
            createWire(dipA.id, 2, ic.id, 13);
            createWire(dipA.id, 3, ic.id, 12);
            createWire(dipA.id, 4, ic.id, 10);

            createWire(vccDip.id, 1, dipB.id, 8);
            createWire(vccDip.id, 1, dipB.id, 7);
            createWire(vccDip.id, 1, dipB.id, 6);
            createWire(vccDip.id, 1, dipB.id, 5);

            createWire(dipB.id, 1, ic.id, 1);
            createWire(dipB.id, 2, ic.id, 14);
            createWire(dipB.id, 3, ic.id, 11);
            createWire(dipB.id, 4, ic.id, 9);

            createWire(vccCasc.id, 1, ic.id, 3);
            createWire(gnd.id, 1, ic.id, 2);
            createWire(gnd.id, 1, ic.id, 4);

            createWire(ic.id, 5, resGT.id, 1);
            createWire(resGT.id, 2, ledGT.id, 1);

            createWire(ic.id, 6, resEQ.id, 1);
            createWire(resEQ.id, 2, ledEQ.id, 1);

            createWire(ic.id, 7, resLT.id, 1);
            createWire(resLT.id, 2, ledLT.id, 1);

            createWire(vcc.id, 1, ic.id, 16);
            createWire(gnd.id, 1, ic.id, 8);

            updateAllWires();
            simulate();
            selectComponent(ic.id);
        });
    });
});

document.getElementById('btn-example3').addEventListener('click', () => {
    clearAll();
    const ic = createComponent('IC7447', 400, 220);
    const seg = createComponent('SEVEN_SEG_CA', 700, 180);
    seg.color = 'green';
    renderComponent(seg);

    const sw0 = createComponent('SWITCH', 150, 180);
    const sw1 = createComponent('SWITCH', 150, 250);
    const sw2 = createComponent('SWITCH', 150, 320);
    const sw3 = createComponent('SWITCH', 150, 390);

    const vcc1 = createComponent('VCC', 560, 100);
    const vcc2 = createComponent('VCC', 820, 100);
    const vccCtrl = createComponent('VCC', 230, 460);
    const gnd = createComponent('GND', 340, 500);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            createWire(sw0.id, 1, ic.id, 7);
            createWire(sw1.id, 1, ic.id, 1);
            createWire(sw2.id, 1, ic.id, 2);
            createWire(sw3.id, 1, ic.id, 6);

            createWire(vccCtrl.id, 1, ic.id, 3);
            createWire(vccCtrl.id, 1, ic.id, 4);
            createWire(vccCtrl.id, 1, ic.id, 5);

            createWire(ic.id, 13, seg.id, 7);
            createWire(ic.id, 12, seg.id, 6);
            createWire(ic.id, 11, seg.id, 4);
            createWire(ic.id, 10, seg.id, 2);
            createWire(ic.id, 9, seg.id, 1);
            createWire(ic.id, 15, seg.id, 9);
            createWire(ic.id, 14, seg.id, 10);

            createWire(vcc1.id, 1, ic.id, 16);
            createWire(gnd.id, 1, ic.id, 8);

            createWire(vcc2.id, 1, seg.id, 3);
            createWire(vcc2.id, 1, seg.id, 8);

            updateAllWires();
            simulate();
            selectComponent(ic.id);
        });
    });
});

// --- Example 4: 555 Timer Astable Mode ---
document.getElementById('btn-example4').addEventListener('click', () => {
    clearAll();

    const timer = createComponent('IC555', 400, 250);

    const r1 = createComponent('RESISTOR', 300, 150);
    r1.resistance = 1000;
    const r2 = createComponent('RESISTOR', 500, 150);
    r2.resistance = 1000;

    const cap = createComponent('CAPACITOR', 400, 400);

    const led = createComponent('LED', 600, 250);
    led.color = 'red';
    renderComponent(led);

    const outRes = createComponent('RESISTOR', 700, 250);
    outRes.resistance = 330;

    const vcc = createComponent('VCC', 400, 50);
    const gnd = createComponent('GND', 400, 550);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            createWire(vcc.id, 1, timer.id, 8);
            createWire(vcc.id, 1, timer.id, 4);
            createWire(vcc.id, 1, r1.id, 1);
            createWire(r1.id, 2, timer.id, 7);
            createWire(r1.id, 2, r2.id, 1);
            createWire(r2.id, 2, timer.id, 6);
            createWire(r2.id, 2, timer.id, 2);
            createWire(timer.id, 6, cap.id, 1);
            createWire(cap.id, 2, gnd.id, 1);
            createWire(timer.id, 1, gnd.id, 1);
            createWire(timer.id, 3, outRes.id, 1);
            createWire(outRes.id, 2, led.id, 1);

            updateAllWires();
            simulate();
            selectComponent(timer.id);
        });
    });
});

// ==========================================
// INITIALIZATION
// ==========================================
applyTransform();
showInfoPlaceholder();
updateHint();
wsPanX = 100;
wsPanY = 50;
applyTransform();

document.addEventListener('contextmenu', (e) => {
    if (placingType) {
        e.preventDefault();
        setTool('select');
        return;
    }
    if (wireStartComp) {
        e.preventDefault();
        cancelWireDrawing();
        return;
    }
});

const helpModal = document.getElementById('controls-modal');
const btnHelp = document.getElementById('btn-help');
const btnCloseHelp = document.getElementById('btn-close-help');
const closeSpan = document.querySelector('.close-modal');

function toggleHelpModal(show) {
    if (show) {
        helpModal.style.display = 'flex';
        helpModal.offsetHeight;
        helpModal.classList.add('show');
    } else {
        helpModal.classList.remove('show');
        setTimeout(() => {
            if (!helpModal.classList.contains('show')) {
                helpModal.style.display = 'none';
            }
        }, 200);
    }
}

if (btnHelp) {
    btnHelp.addEventListener('click', () => toggleHelpModal(true));
}
if (btnCloseHelp) {
    btnCloseHelp.addEventListener('click', () => toggleHelpModal(false));
}
if (closeSpan) {
    closeSpan.addEventListener('click', () => toggleHelpModal(false));
}
if (helpModal) {
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) toggleHelpModal(false);
    });
}