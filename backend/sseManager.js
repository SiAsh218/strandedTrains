class SSEManager {
  constructor() {
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);

    res.on("close", () => {
      this.clients.delete(res);
    });
  }

  broadcast(eventName, payload) {
    const data = JSON.stringify(payload);

    for (const client of this.clients) {
      client.write(`event: ${eventName}\n` + `data: ${data}\n\n`);
    }
  }
}

module.exports = new SSEManager();
