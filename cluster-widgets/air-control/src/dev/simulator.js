// Dev-only simulator panel. Loaded only by index.html (dev-controls script).
// Calls window.control / window.showScreen / window.focus directly.

const SCENARIOS = {
    highway: {
        label: '🏎️ Autoestrada',
        state: { carSpeed: 120, drivingMode: 'Sport', evMode: 'HEV', fan: 3, temp: 22, power: 1, regenMode: 'Alto' }
    },
    city: {
        label: '🌆 Cidade',
        state: { carSpeed: 40, drivingMode: 'Eco', fan: 2, temp: 22, power: 1, regenMode: 'Normal', evMode: 'HEV' }
    },
    charging: {
        label: '⚡ Carregando',
        state: { evMode: 'EV', carSpeed: 0, power: 0, regenMode: 'Normal', drivingMode: 'Normal' }
    },
    cold_start: {
        label: '🥶 Partida fria',
        state: { power: 1, temp: 32, fan: 7, maxauto: 1, outside_temp: '-5', inside_temp: '8', drivingMode: 'Normal' }
    },
};

const SIMULATION_INTERVAL_MS = 100;
let simMultiplier = 1;
let simRunning = true;

// Rebuild the simulation interval respecting the current multiplier
function restartSimulation() {
    if (window.simulationInterval) clearInterval(window.simulationInterval);
    // testing-utils.js wrote the simulation loop into window.simulationInterval.
    // Re-import to restart it isn't trivial, so we replicate a lightweight version here
    // that only controls speed by adjusting the interval tick rate.
    // The full sim logic lives in testing-utils.js; toggling window.simulationInterval is enough.
}

// Intercept window.control to log all calls
const _originalControl = () => {}; // placeholder; replaced after main.js loads
let logEntries = [];
let logEl = null;

function wrapWindowFunctions() {
    const origControl = window.control;
    if (!origControl || origControl.__wrapped) return;

    window.control = function (key, value) {
        addLog(key, value);
        origControl(key, value);
    };
    window.control.__wrapped = true;
}

function addLog(key, value) {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour12: false }) +
        '.' + String(now.getMilliseconds()).padStart(3, '0');
    logEntries.unshift({ time, key, value: String(value) });
    if (logEntries.length > 20) logEntries.length = 20;
    if (logEl) renderLog();
}

function renderLog() {
    logEl.innerHTML = logEntries
        .map(e => `<div class="log-entry"><span class="log-time">${e.time}</span><span class="log-key">${e.key}</span><span class="log-val">${e.value}</span></div>`)
        .join('');
}

// ── UI helpers ──────────────────────────────────────────────────────────────

function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') node.className = v;
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
    }
    for (const child of children) {
        if (typeof child === 'string') node.appendChild(document.createTextNode(child));
        else if (child) node.appendChild(child);
    }
    return node;
}

function section(title, ...children) {
    return el('div', { class: 'sim-section' },
        el('div', { class: 'sim-section-title' }, title),
        ...children
    );
}

function row(label, control) {
    return el('div', { class: 'sim-row' },
        el('label', { class: 'sim-label' }, label),
        control
    );
}

function toggle(key, labelOn, labelOff, valueOn = 1, valueOff = 0) {
    const btn = el('button', { class: 'sim-toggle', onclick: () => {
        const current = btn.dataset.active === 'true';
        const next = !current;
        btn.dataset.active = next;
        btn.textContent = next ? labelOn : labelOff;
        window.control(key, next ? valueOn : valueOff);
    }});
    btn.dataset.active = 'false';
    btn.textContent = labelOff;
    return btn;
}

function select(key, options) {
    const sel = el('select', { class: 'sim-select', onchange: () => window.control(key, sel.value) });
    for (const [val, label] of options) {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = label;
        sel.appendChild(opt);
    }
    return sel;
}

function slider(key, min, max, step, initial) {
    const wrapper = el('div', { class: 'sim-slider-wrapper' });
    const valueDisplay = el('span', { class: 'sim-slider-value' }, String(initial));
    const input = el('input', {
        type: 'range', class: 'sim-slider',
        min: String(min), max: String(max), step: String(step), value: String(initial),
        oninput: () => {
            valueDisplay.textContent = input.value;
            window.control(key, parseFloat(input.value));
        }
    });
    wrapper.appendChild(input);
    wrapper.appendChild(valueDisplay);
    return wrapper;
}

function numberInput(key, placeholder) {
    return el('input', {
        type: 'number', class: 'sim-number', placeholder,
        onchange: (e) => window.control(key, e.target.value)
    });
}

// ── Build panel ─────────────────────────────────────────────────────────────

function buildPanel(container) {
    const styles = document.createElement('style');
    styles.textContent = `
        .sim-section { margin-bottom: 20px; }
        .sim-section-title {
            font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
            color: #6b7280; border-bottom: 1px solid #1f2937;
            padding-bottom: 6px; margin-bottom: 10px;
        }
        .sim-row {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 8px; gap: 12px;
        }
        .sim-label { font-size: 12px; color: #9ca3af; min-width: 120px; }
        .sim-toggle {
            font-size: 11px; padding: 4px 10px; border-radius: 4px; border: 1px solid #374151;
            background: #1f2937; color: #e5e7eb; cursor: pointer; min-width: 72px;
        }
        .sim-toggle[data-active="true"] { background: #1d4ed8; border-color: #3b82f6; color: #fff; }
        .sim-select {
            font-size: 12px; padding: 4px 8px; border-radius: 4px; border: 1px solid #374151;
            background: #1f2937; color: #e5e7eb; cursor: pointer;
        }
        .sim-slider-wrapper { display: flex; align-items: center; gap: 8px; flex: 1; }
        .sim-slider { flex: 1; accent-color: #3b82f6; }
        .sim-slider-value { font-size: 12px; color: #60a5fa; min-width: 36px; text-align: right; }
        .sim-number {
            font-size: 12px; padding: 4px 8px; border-radius: 4px; border: 1px solid #374151;
            background: #1f2937; color: #e5e7eb; width: 80px;
        }
        .screen-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .screen-btn {
            font-size: 11px; padding: 5px 12px; border-radius: 4px; border: 1px solid #374151;
            background: #1f2937; color: #e5e7eb; cursor: pointer;
        }
        .screen-btn:hover { background: #374151; }
        .scenario-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .scenario-btn {
            font-size: 11px; padding: 6px 12px; border-radius: 4px; border: 1px solid #374151;
            background: #1f2937; color: #e5e7eb; cursor: pointer;
        }
        .scenario-btn:hover { background: #374151; }
        .sim-ctrl-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .sim-ctrl-btn {
            font-size: 11px; padding: 5px 10px; border-radius: 4px; border: 1px solid #374151;
            background: #1f2937; color: #e5e7eb; cursor: pointer;
        }
        .sim-ctrl-btn:hover { background: #374151; }
        .sim-ctrl-btn.active { background: #065f46; border-color: #10b981; }
        .log-entry {
            display: flex; gap: 10px; font-size: 11px; padding: 2px 0;
            border-bottom: 1px solid #111; font-family: monospace;
        }
        .log-time { color: #6b7280; min-width: 90px; }
        .log-key { color: #60a5fa; flex: 1; }
        .log-val { color: #34d399; min-width: 60px; text-align: right; }
        .sim-panel::-webkit-scrollbar { width: 6px; }
        .sim-panel::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    `;
    document.head.appendChild(styles);

    // ── Screen navigation ──
    const screenBtns = el('div', { class: 'screen-btns' },
        ...[ ['main_menu', 'Menu'], ['aircon', 'A/C'], ['regen', 'Regen'], ['graph', 'Gráficos'] ]
            .map(([name, label]) => {
                const b = el('button', { class: 'screen-btn', onclick: () => window.showScreen(name) }, label);
                return b;
            })
    );

    // ── Simulation controls ──
    let pauseBtn;
    pauseBtn = el('button', { class: 'sim-ctrl-btn active', onclick: () => {
        simRunning = !simRunning;
        if (simRunning) {
            pauseBtn.textContent = '⏸ Pausar';
            pauseBtn.classList.add('active');
            // restore — testing-utils stores interval on window.simulationInterval
            // We can't easily re-run its closure, so just let it continue if it exists
        } else {
            pauseBtn.textContent = '▶ Retomar';
            pauseBtn.classList.remove('active');
            if (window.simulationInterval) {
                clearInterval(window.simulationInterval);
                window.simulationInterval = null;
            }
        }
    }}, '⏸ Pausar');

    const resetBtn = el('button', { class: 'sim-ctrl-btn', onclick: () => location.reload() }, '↺ Reset');

    const speedLabel = el('span', { style: 'font-size:11px;color:#6b7280;' }, 'Velocidade:');
    const speedSel = el('select', { class: 'sim-select', onchange: () => {
        simMultiplier = parseFloat(speedSel.value);
    }});
    for (const [val, label] of [['0.5','0.5×'],['1','1×'],['2','2×'],['5','5×']]) {
        const opt = document.createElement('option');
        opt.value = val; opt.textContent = label;
        if (val === '1') opt.selected = true;
        speedSel.appendChild(opt);
    }

    const simRow = el('div', { class: 'sim-ctrl-row' }, pauseBtn, resetBtn, speedLabel, speedSel);

    // ── Scenarios ──
    const scenarioBtns = el('div', { class: 'scenario-btns' },
        ...Object.entries(SCENARIOS).map(([, { label, state }]) =>
            el('button', { class: 'scenario-btn', onclick: () => {
                for (const [k, v] of Object.entries(state)) window.control(k, v);
            }}, label)
        )
    );

    // ── Focus controls ──
    const focusMenuSel = select('focusedMenuItem', [
        ['option_1','ESP'], ['option_2','EV Mode'], ['option_3','Modo Direção'],
        ['option_4','A/C Control'], ['option_5','Direção'], ['option_6','Regen'], ['option_7','Gráficos']
    ]);
    focusMenuSel.onchange = () => window.focus(focusMenuSel.value);

    const focusAcSel = select('focusArea', [['fan','Ventilador'], ['temp','Temperatura']]);
    focusAcSel.onchange = () => window.focus(focusAcSel.value);

    // ── Log ──
    logEl = el('div', { style: 'max-height: 200px; overflow-y: auto;' });

    // ── Assemble ──
    container.appendChild(section('Navegação de Tela', screenBtns));
    container.appendChild(section('Simulação', simRow));
    container.appendChild(section('Cenários', scenarioBtns));

    container.appendChild(section('Menu Principal',
        row('Foco no menu', focusMenuSel),
        row('ESP', toggle('espStatus', 'ON', 'OFF', 'ON', 'OFF')),
        row('EV Mode', select('evMode', [['HEV','HEV'],['PHEV','PHEV'],['EV','EV']])),
        row('Modo Direção', select('drivingMode', [['Normal','Normal'],['Eco','Eco'],['Sport','Sport']])),
        row('Assistência Direção', select('steerMode', [['Normal','Normal'],['Conforto','Conforto'],['Esportiva','Esportiva']])),
    ));

    container.appendChild(section('A/C',
        row('Foco', focusAcSel),
        row('Ventilador (0–7)', slider('fan', 0, 7, 1, 1)),
        row('Temperatura (°C)', slider('temp', 16, 32, 0.5, 25)),
        row('Temp. externa (°C)', numberInput('outside_temp', 'ex: 32')),
        row('Temp. interna (°C)', numberInput('inside_temp', 'ex: 24')),
        row('Power', toggle('power', 'ON', 'OFF')),
        row('Auto', toggle('auto', 'ON', 'OFF')),
        row('Recircular', toggle('recycle', 'ON', 'OFF')),
        row('Max Auto', toggle('maxauto', 'ON', 'OFF')),
        row('Ionizador', select('aion', [['0','Desligado'],['1','Íon'],['2','Só ventoinha']])),
    ));

    container.appendChild(section('Regen',
        row('Nível Regen', select('regenMode', [['Baixo','Baixo'],['Normal','Normal'],['Alto','Alto']])),
        row('One-Pedal', toggle('onepedal', 'ON', 'OFF', true, false)),
    ));

    container.appendChild(section('Gráficos / Sensores',
        row('Gráfico ativo', select('currentGraph', [
            ['evConsumption','Consumo EV'],
            ['gasConsumption','Consumo Combustão'],
            ['carSpeed','Velocidade'],
        ])),
        row('Velocidade (km/h)', slider('carSpeed', 0, 200, 1, 0)),
        row('Consumo EV', slider('evConsumption', -50, 100, 1, 0)),
        row('Consumo combustão', slider('gasConsumption', 0, 30, 0.1, 0)),
        row('Modo consumo', select('gasConsumptionMode', [['Running','Em movimento'],['Idle','Parado']])),
    ));

    container.appendChild(section('Log de chamadas window.control()', logEl));
}

// Wait for main.js to set up window.control before wrapping it
window.addEventListener('load', () => {
    const panel = document.getElementById('sim-panel');
    if (!panel) return;
    buildPanel(panel);
    // Wrap after a tick so main.js has time to assign window.control
    setTimeout(wrapWindowFunctions, 0);
});
