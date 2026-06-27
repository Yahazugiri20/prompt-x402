
require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

console.log("Starting test server...");

app.post("/api/optimize", async (req, res) => {
  console.log("Got request:", req.body);
  res.json({ status: "ok", prompt: req.body.prompt });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// Keep alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close();
});
