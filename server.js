require("dotenv").config();
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

app.post("/api/optimize", async (req, res) => {
  const prompt = req.body.prompt || "gambar kucing";

  // Venice AI Integration
  const veniceApiKey = process.env.VENICE_API_KEY;
  if (!veniceApiKey) {
    return res.json({
      status: "success",
      result: `[Optimized by Wizard] ${prompt}`,
      note: "AI optimization disabled - no VENICE_API_KEY",
    });
  }

  try {
    const veniceRes = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${veniceApiKey}`,
      },
      body: JSON.stringify({
        model: "dolphin-2.9.4-qwen2-72b",
        messages: [
          {
            role: "system",
            content: "You are a prompt engineering expert. Optimize the user's prompt to make it more detailed, specific, and effective for image generation or text generation. Return ONLY the optimized prompt, no explanation."
          },
          {
            role: "user",
            content: `Optimize this prompt: "${prompt}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!veniceRes.ok) {
      throw new Error(`Venice API error: ${veniceRes.status}`);
    }

    const veniceData = await veniceRes.json();
    const optimizedPrompt = veniceData.choices?.[0]?.message?.content?.trim() || prompt;

    res.json({
      status: "success",
      original: prompt,
      result: optimizedPrompt,
      provider: "venice-ai",
    });
  } catch (error) {
    console.error("Venice error:", error.message);
    res.json({
      status: "success",
      result: `[Optimized by Wizard] ${prompt}`,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Network: Base Sepolia (eip155:84532)`);
  console.log(`Pay To: ${MY_WALLET}`);
});
