const { WebSocketServer } = require('ws');

let proximoId = 1;
const clientes = new Map();

// Histórico de pinceladas para sincronizar novos clientes
// Cada entrada é uma mensagem de pintura já broadcastada
const historico = [];
const MAX_HISTORICO = 5000; // evita crescer indefinidamente

const wss = new WebSocketServer({ port: 8080 });

console.log('Servidor WebSocket rodando em ws://localhost:8080');

wss.on('connection', (ws) => {
  const id = proximoId++;
  clientes.set(id, ws);

  console.log(`[+] Cliente #${id} conectado | Total: ${clientes.size}`);

  // Envia o ID pro cliente se identificar
  ws.send(JSON.stringify({ tipo: 'id', id }));

  // Envia o estado atual do canvas pro novo cliente
  if (historico.length > 0) {
    ws.send(JSON.stringify({ tipo: 'estado', pinceladas: historico }));
    console.log(`[estado] Enviado histórico (${historico.length} pinceladas) para cliente #${id}`);
  }

  // Avisa todos que alguém entrou (depois de sincronizar)
  broadcast({ tipo: 'sistema', mensagem: `Cliente #${id} entrou na sala` });

  ws.on('message', (dados) => {
    try {
      const msg = JSON.parse(dados);
      console.log(`[msg] Cliente #${id}:`, msg.tipo);

      const msgComAutor = { ...msg, autorId: id };

      if (msg.tipo === 'pintura') {
        // Guarda no histórico
        historico.push(msgComAutor);
        if (historico.length > MAX_HISTORICO) historico.shift();
      }

      if (msg.tipo === 'limpar') {
        // Limpa o histórico
        historico.length = 0;
      }

      broadcast(msgComAutor);

    } catch (e) {
      console.log(`[erro] Mensagem inválida do cliente #${id}`);
    }
  });

  ws.on('close', () => {
    clientes.delete(id);
    console.log(`[-] Cliente #${id} desconectado | Total: ${clientes.size}`);
    broadcast({ tipo: 'sistema', mensagem: `Cliente #${id} saiu da sala` });
  });

  ws.on('error', (err) => {
    console.log(`[erro] Cliente #${id}:`, err.message);
    clientes.delete(id);
  });
});

function broadcast(dados) {
  const json = JSON.stringify(dados);
  for (const [id, ws] of clientes) {
    if (ws.readyState === ws.OPEN) {
      ws.send(json);
    }
  }
}
