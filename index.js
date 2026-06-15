const CORES    = ['#1a1814','#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#f0ede8'];
const TAMANHOS = [4, 8, 16];

let corAtual   = CORES[0];
let tamAtual   = TAMANHOS[1];
let meuId      = null;
let desenhando = false;
let ultimoX    = null;
let ultimoY    = null;

const canvas = window.document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function redimensionar() {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.putImageData(img, 0, 0);
}

window.addEventListener('resize', redimensionar);
redimensionar();

function desenharPonto(x, y, cor, tamanho, xAnt, yAnt) {
    ctx.beginPath();
    ctx.strokeStyle = cor;
    ctx.lineWidth   = tamanho;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.moveTo(xAnt ?? x, yAnt ?? y);
    ctx.lineTo(x, y);
    ctx.stroke();
}

function enviarPintura(x, y, xAnt, yAnt) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
        tipo: 'pintura',
        x, y, xAnterior: xAnt, yAnterior: yAnt,
        cor: corAtual, tamanho: tamAtual,
        }));
    }
}

canvas.addEventListener('pointerdown', (e) => {
    desenhando = true;
    ultimoX = e.offsetX;
    ultimoY = e.offsetY;
});

canvas.addEventListener('pointermove', (e) => {
    if (!desenhando) return;
    const x = e.offsetX, y = e.offsetY;
    desenharPonto(x, y, corAtual, tamAtual, ultimoX, ultimoY);
    enviarPintura(x, y, ultimoX, ultimoY);
    ultimoX = x; ultimoY = y;
    });

canvas.addEventListener('pointerup',    () => { desenhando = false; ultimoX = ultimoY = null; });
canvas.addEventListener('pointerleave', () => { desenhando = false; ultimoX = ultimoY = null; });

function limparTela() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ tipo: 'limpar' }));
    }
}

function log(txt) {
    const el = document.createElement('div');
    el.className = 'log-item';
    el.textContent = txt;
    document.getElementById('log').appendChild(el);
    setTimeout(() => el.classList.add('fade'), 3000);
    setTimeout(() => el.remove(), 4000);
}

// Pega o hostname automaticamente para funcionar tanto em localhost quanto na rede
const host = window.location.hostname;
const ws = new WebSocket(`ws://${host}:8080`);

ws.onopen = () => {
    document.getElementById('dot').classList.add('on');
    document.getElementById('status-txt').textContent = 'conectado';
    log('WebSocket aberto');
    console.log('[ws] conexão aberta');
};

ws.onclose = () => {
    document.getElementById('dot').classList.remove('on');
    document.getElementById('status-txt').textContent = 'desconectado';
    log('WebSocket fechado');
    console.log('[ws] conexão fechada');
};

ws.onerror = (e) => console.log('[ws] erro:', e);

ws.onmessage = (evento) => {
    const msg = JSON.parse(evento.data);
    console.log('[ws] mensagem recebida:', msg);

    if (msg.tipo === 'id') {
        meuId = msg.id;
        document.getElementById('status-txt').textContent = `conectado como #${meuId}`;
    }

    if (msg.tipo === 'estado') {
        msg.pinceladas.forEach(p => {
        desenharPonto(p.x, p.y, p.cor, p.tamanho, p.xAnterior, p.yAnterior);
        });
    }

    if (msg.tipo === 'pintura' && msg.autorId !== meuId) {
        desenharPonto(msg.x, msg.y, msg.cor, msg.tamanho, msg.xAnterior, msg.yAnterior);
    }

    if (msg.tipo === 'limpar') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (msg.tipo === 'sistema') {
        log(msg.mensagem);
    }
};

// ── Paleta UI ──
const paletaEl = document.getElementById('paleta');
CORES.forEach(cor => {
    const el = document.createElement('div');
    el.className = 'cor' + (cor === corAtual ? ' ativa' : '');
    el.style.background = cor;
    if (cor === '#f0ede8') el.style.boxShadow = 'inset 0 0 0 1px #ccc';
    el.onclick = () => {
        document.querySelectorAll('.cor').forEach(c => c.classList.remove('ativa'));
        el.classList.add('ativa');
        corAtual = cor;
    };
    paletaEl.appendChild(el);
});

// ── Tamanhos UI ──
const tamEl = document.getElementById('tamanhos');
TAMANHOS.forEach(t => {
    const el = document.createElement('div');
    el.className = 'tam' + (t === tamAtual ? ' ativo' : '');
    el.style.width  = t + 'px';
    el.style.height = t + 'px';
    el.onclick = () => {
        document.querySelectorAll('.tam').forEach(e => e.classList.remove('ativo'));
        el.classList.add('ativo');
        tamAtual = t;
    };
    tamEl.appendChild(el);
});