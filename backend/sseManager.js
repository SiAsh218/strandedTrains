class SSEManager {
  constructor() {
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);

    console.log(`SSE Client Connected (${this.clients.size} total)`);

    this.broadcast("client-count", {
      count: this.clients.size,
    });

    res.on("close", () => {
      this.clients.delete(res);

      console.log(`SSE Client Disconnected (${this.clients.size} total)`);

      this.broadcast("client-count", {
        count: this.clients.size,
      });
    });
  }

  broadcast(eventName, payload) {
    const data = JSON.stringify(payload);

    for (const client of this.clients) {
      client.write(`event: ${eventName}\n` + `data: ${data}\n\n`);
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = new SSEManager();
