
const express = require("express");
const app = express();
app.use(express.json());

console.log("Server starting...");

app.post("/api/optimize", (req, res) => {
  console.log("Got request:", JSON.stringify(req.body));
  res.json({ status: "ok", prompt: req.body.prompt });
});

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// Prevent immediate exit
setInterval(() => {}, 1000000);
