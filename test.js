
const express = require("express");
const app = express();
app.use(express.json());

app.post("/api/optimize", (req, res) => {
  console.log("REQUEST RECEIVED:", JSON.stringify(req.body));
  res.json({ status: "ok", prompt: req.body.prompt });
});

app.listen(3000, () => {
  console.log("Server on port 3000");
});
