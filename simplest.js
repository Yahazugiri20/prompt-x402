
const express = require("express");
const app = express();
app.use(express.json());

app.post("/api/optimize", (req, res) => {
  console.log("REQUEST BODY:", JSON.stringify(req.body));
  res.json({ status: "ok", prompt: req.body.prompt, bodyReceived: true });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
