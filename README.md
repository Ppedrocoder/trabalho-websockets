# Canvas Colaborativo WebSocket

Aplicação de desenho colaborativo em tempo real via WebSocket.  
Qualquer pessoa conectada vê e contribui com o mesmo canvas simultaneamente.

## Estrutura

```
trabalho-websockets/
├── server.js     # Servidor WebSocket (Node.js + ws)
├── index.html    # Frontend (HTML + JS puro)
├── styles.css    # Estilos (CSS puro)
└── package.json
```

## Como rodar

**Terminal 1 — Servidor**
```bash
npm install
node server.js
```

**Terminal 2 — Frontend**  
Abra o `index.html` no navegador (ou use Live Server no VS Code).  
Abra em duas abas para ver a comunicação em tempo real.

## Decisões técnicas

### Identificação dos clientes
Cada cliente recebe um ID numérico incremental (`proximoId++`) atribuído no momento da conexão. O ID é enviado de volta ao cliente via mensagem `{ tipo: 'id', id }` para que ele possa se identificar.

### Armazenamento das conexões ativas
As conexões são armazenadas em um `Map<id, ws>`. O Map foi escolhido sobre um Array por permitir remoção eficiente por ID em `O(1)`, sem necessidade de varrer a lista.

### Tratamento de clientes desconectados
No evento `close` de cada conexão, o cliente é removido do Map imediatamente. O evento `error` também faz a remoção para cobrir desconexões abruptas. Um broadcast notifica os demais clientes.

### Formato de mensagem
JSON foi escolhido por ser legível, fácil de parsear em qualquer linguagem, e flexível para transportar diferentes tipos de evento (`pintura`, `limpar`, `sistema`, `id`) em uma estrutura uniforme via campo `tipo`.

## Por que WebSocket e não HTTP/polling?

Cada pincelada gera dezenas de eventos por segundo. Com polling HTTP, cada evento exigiria uma requisição completa (handshake + headers), resultando em latência alta e sobrecarga desnecessária. O WebSocket mantém um canal bidirecional aberto: o servidor empurra atualizações imediatamente, sem o cliente precisar perguntar.

## Ciclo de vida da conexão (console do servidor)

```
[+] Cliente #1 conectado | Total: 1
[msg] Cliente #1: { tipo: 'pintura', x: 120, y: 80, ... }
[-] Cliente #1 desconectado | Total: 0
```
