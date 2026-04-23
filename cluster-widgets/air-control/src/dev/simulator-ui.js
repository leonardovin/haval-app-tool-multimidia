// Simulator UI controls para o painel completo do H6 GT

import { setState, getState } from '../state.js';

const themes = ['Normal', 'Esportivo', 'Reduzido', 'Clean'];
const logEntries = [];

function log(msg) {
    const ts = new Date().toLocaleTimeString('pt-BR', { hour12: false })
        + '.' + String(new Date().getMilliseconds()).padStart(3, '0');
    logEntries.unshift({ ts, msg });
    if (logEntries.length > 50) logEntries.length = 50;
    renderLog();
}

function renderLog() {
    const logContainer = document.getElementById('log-container');
    if (!logContainer) return;
    logContainer.innerHTML = logEntries
        .map(e => `<div class="log-entry"><span class="log-time">${e.ts}</span><span class="log-msg">${e.msg}</span></div>`)
        .join('');
    logContainer.scrollTop = 0;
}

function el(tag, attrs = {}, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') n.className = v;
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v);
    }
    children.forEach(c => n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
}

function buildThemePanel() {
    const container = document.getElementById('theme-controls');
    if (!container) return;

    // Screen selector (Menu, AC, Regen, Graphs)
    const screens = [
        { id: 'main_menu', label: '📱 Menu Principal' },
        { id: 'aircon', label: '❄️ Ar Condicionado' },
        { id: 'regen', label: '⚡ Regeneração' },
        { id: 'graph', label: '📊 Gráficos' }
    ];

    const screenBtns = screens.map(({ id, label }) => {
        const btn = el('button', {
            class: 'theme-btn' + (getState('screen') === id ? ' active' : ''),
            onclick: () => {
                setState('screen', id);
                container.querySelectorAll('.screen-selector .theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                log('📺 Painel: ' + label);
            }
        }, label);
        return btn;
    });
    const screenRow = el('div', { class: 'control-row' },
        el('span', { class: 'control-label' }, 'Painel'),
        el('div', { class: 'theme-selector screen-selector' }, ...screenBtns)
    );
    container.appendChild(screenRow);

    // Display mode
    const displaySel = el('select', { class: 'control-input', onchange: (e) => {
        setState('display', e.target.value);
        log('🎨 Display alterado para: ' + e.target.value);
    }});
    themes.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (t === getState('display')) opt.selected = true;
        displaySel.appendChild(opt);
    });
    const displayRow = el('div', { class: 'control-row' },
        el('span', { class: 'control-label' }, 'Display'),
        displaySel
    );
    container.appendChild(displayRow);

    // Brightness
    const brightnessValue = el('span', { class: 'slider-value' }, String(getState('brightness')));
    const brightnessInput = el('input', {
        type: 'range', min: '1', max: '100', value: getState('brightness'),
        oninput: (e) => {
            setState('brightness', parseInt(e.target.value));
            brightnessValue.textContent = e.target.value;
            log('💡 Brilho: ' + e.target.value);
        }
    });
    const brightnessRow = el('div', { class: 'control-row' },
        el('span', { class: 'control-label' }, 'Brilho'),
        el('div', { class: 'slider-wrapper' }, brightnessInput, brightnessValue)
    );
    container.appendChild(brightnessRow);

    // Tema buttons
    const themeBtns = themes.map(t => {
        const btn = el('button', { class: 'theme-btn' + (t === getState('display') ? ' active' : ''),
            onclick: () => {
                setState('display', t);
                container.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                displaySel.value = t;
                log('🎨 Tema: ' + t);
            }
        }, t);
        return btn;
    });
    const themeRow = el('div', { class: 'control-row' },
        el('span', { class: 'control-label' }, 'Tema'),
        el('div', { class: 'theme-selector' }, ...themeBtns)
    );
    container.appendChild(themeRow);
}

function buildVehiclePanel() {
    const container = document.getElementById('vehicle-controls');
    if (!container) return;

    const controls = [
        { label: 'Velocidade (km/h)', key: 'carSpeed', min: 0, max: 200, step: 1 },
        { label: 'RPM Motor', key: 'engineRPM', min: 0, max: 8000, step: 100 },
        { label: 'Temp. Interna (°C)', key: 'tempInside', min: -10, max: 60, step: 1 },
        { label: 'Consumo EV', key: 'instantEVConsumption', min: -50, max: 100, step: 1 },
        { label: 'Consumo (km/l)', key: 'gasConsumption', min: 0, max: 30, step: 0.1 },
        { label: 'Bateria (%)', key: 'batteryPercent', min: 0, max: 100, step: 1 },
        { label: 'Combustível (%)', key: 'fuelPercent', min: 0, max: 100, step: 1 },
    ];

    controls.forEach(({ label, key, min, max, step }) => {
        const value = getState(key) || 0;
        const valueSpan = el('span', { class: 'slider-value' }, String(Number(value).toFixed(step < 1 ? 1 : 0)));
        const input = el('input', {
            type: 'range', min, max, step, value,
            oninput: (e) => {
                const v = parseFloat(e.target.value);
                setState(key, v);
                valueSpan.textContent = v.toFixed(step < 1 ? 1 : 0);
                log(`📊 ${label}: ${v}`);
            }
        });
        const row = el('div', { class: 'control-row' },
            el('span', { class: 'control-label' }, label),
            el('div', { class: 'slider-wrapper' }, input, valueSpan)
        );
        container.appendChild(row);
    });

    // Steering mode selector
    const steerModes = ['Normal', 'Esportiva', 'Conforto'];
    const steerBtns = steerModes.map(m => {
        const btn = el('button', { class: 'theme-btn' + (getState('steerMode') === m ? ' active' : ''),
            onclick: () => {
                setState('steerMode', m);
                container.querySelectorAll('.steer-selector .theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                log('🎯 Modo de Direção: ' + m);
            }
        }, m);
        return btn;
    });
    const steerRow = el('div', { class: 'control-row' },
        el('span', { class: 'control-label' }, 'Direção'),
        el('div', { class: 'theme-selector steer-selector' }, ...steerBtns)
    );
    container.appendChild(steerRow);

    // Steering wheel buttons
    container.appendChild(el('h3', { style: 'margin-top: 16px; margin-bottom: 8px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #1f2937; padding-bottom: 8px;' }, '🎮 Botões do Volante'));

    // Volume controls
    const volumeRow = el('div', { class: 'control-row' },
        el('button', { class: 'control-input', style: 'flex: 1; cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('🔊 Vol -'); window.dispatchEvent(new CustomEvent('wheel-vol-down')); } }, '🔊 Vol -'),
        el('button', { class: 'control-input', style: 'flex: 1; margin-left: 4px; cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('🔊 Vol +'); window.dispatchEvent(new CustomEvent('wheel-vol-up')); } }, '🔊 Vol +')
    );
    container.appendChild(volumeRow);

    // Navigation controls
    const navRow = el('div', { class: 'control-row' },
        el('button', { class: 'control-input', style: 'cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('☝️ Cima'); window.dispatchEvent(new CustomEvent('wheel-up')); } }, '☝️'),
        el('button', { class: 'control-input', style: 'margin: 0 4px; cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('👈 Esquerda'); window.dispatchEvent(new CustomEvent('wheel-left')); } }, '👈'),
        el('button', { class: 'control-input', style: 'cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('✓ OK'); window.dispatchEvent(new CustomEvent('wheel-ok')); } }, '✓'),
        el('button', { class: 'control-input', style: 'margin: 0 4px; cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('👉 Direita'); window.dispatchEvent(new CustomEvent('wheel-right')); } }, '👉'),
        el('button', { class: 'control-input', style: 'cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('👇 Baixo'); window.dispatchEvent(new CustomEvent('wheel-down')); } }, '👇')
    );
    container.appendChild(navRow);

    // Menu buttons
    const menuRow = el('div', { class: 'control-row' },
        el('button', { class: 'control-input', style: 'flex: 1; cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('☰ Menu'); window.dispatchEvent(new CustomEvent('wheel-menu')); } }, '☰ Menu'),
        el('button', { class: 'control-input', style: 'flex: 1; margin-left: 4px; cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff;',
            onclick: () => { log('⏮ Voltar'); window.dispatchEvent(new CustomEvent('wheel-back')); } }, '⏮ Voltar')
    );
    container.appendChild(menuRow);

    // Gear selector
    const gearBtns = ['P', 'R', 'N', 'D'].map(g => {
        const btn = el('button', { class: 'theme-btn' + (getState('gearState') === g ? ' active' : ''),
            onclick: () => {
                setState('gearState', g);
                container.querySelectorAll('.gear-selector .theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                log('⚙️ Marcha: ' + g);
            }
        }, g);
        return btn;
    });
    const gearRow = el('div', { class: 'control-row' },
        el('span', { class: 'control-label' }, 'Marcha'),
        el('div', { class: 'theme-selector gear-selector' }, ...gearBtns)
    );
    container.appendChild(gearRow);

    // EV Mode
    const evModes = ['Normal', 'Eco', 'Sport'];
    const evBtns = evModes.map(m => {
        const mode = m.toLowerCase();
        const current = String(getState('evModeLabel')).toLowerCase();
        const btn = el('button', { class: 'theme-btn' + (current.includes(mode) ? ' active' : ''),
            onclick: () => {
                setState('evModeLabel', m.toUpperCase());
                container.querySelectorAll('.ev-selector .theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                log('⚡ EV Mode: ' + m);
            }
        }, m);
        return btn;
    });
    const evRow = el('div', { class: 'control-row' },
        el('span', { class: 'control-label' }, 'Modo EV'),
        el('div', { class: 'theme-selector ev-selector' }, ...evBtns)
    );
    container.appendChild(evRow);

    // Auto-sim button
    const simBtn = el('button', { class: 'control-input', style: 'cursor: pointer; background: #1d4ed8; border-color: #3b82f6; color: #fff; font-weight: 600;',
        onclick: () => {
            simBtn.disabled = true;
            simBtn.textContent = 'Simulando...';
            runAutoSim();
            setTimeout(() => {
                simBtn.disabled = false;
                simBtn.textContent = 'Simular Aceleração (0-200)';
            }, 12000);
        }
    }, 'Simular Aceleração (0-200)');
    const simRow = el('div', { class: 'control-row' }, simBtn);
    container.appendChild(simRow);
}

function runAutoSim() {
    let speed = 0;
    const interval = setInterval(() => {
        speed += 2;
        setState('carSpeed', speed);
        setState('engineRPM', speed * 40);

        if (speed >= 200) {
            clearInterval(interval);
            log('✅ Simulação concluída');
        }
    }, 50);
    log('▶ Simulação de aceleração iniciada');
}

window.addEventListener('load', () => {
    setTimeout(() => {
        buildThemePanel();
        buildVehiclePanel();
        log('🚀 Simulador do painel de instrumentos iniciado');
    }, 100);
});
