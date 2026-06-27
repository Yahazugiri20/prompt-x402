const express = require("express");
const { paymentMiddleware, x402ResourceServer } = require("@x402/express");
const { HTTPFacilitatorClient } = require("@x402/core/server");
const { ExactEvmScheme } = require("@x402/evm/exact/server");
const {
  BUILDER_CODE,
  declareBuilderCodeExtension,
} = require("@x402/extensions/builder-code");

const app = express();
app.use(express.json());

const MY_WALLET = process.env.PAY_TO || "0xa620A8F4632d89B6E7Cf287Eedbab1e24C30BA37";
const PORT = process.env.PORT || 3000;

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme());

app.use(
  paymentMiddleware(
    {
      "POST /api/optimize": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.005",
            network: "eip155:84532",
            payTo: MY_WALLET,
          },
        ],
        description: "Premium Prompt Optimizer Service",
        mimeType: "application/json",
        extensions: {
          [BUILDER_CODE]:
            declareBuilderCodeExtension("prompt_wizard_agent"),
        },
      },
    },
    server
  )
);

app.post("/api/optimize", (req, res) => {
  const prompt = req.body.prompt || "gambar kucing";

  res.json({
    status: "Success",
    result: `[Optimized by Wizard] ${prompt}`,
  });
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Network: Base Sepolia (eip155:84532)`);
  console.log(`Pay To: ${MY_WALLET}`);
});
