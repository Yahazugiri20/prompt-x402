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

// Temporarily disable x402 for testing Venice
// Uncomment below to enable x402 payments
/*
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
*/

app.post("/api/optimize", async (req, res) => {
  const prompt = req.body.prompt || "gambar kucing";

  // Virtuals AI Integration
  const veniceApiKey = process.env.VIRTUALS_API_KEY;
  if (!veniceApiKey) {
    return res.json({
      status: "success",
      result: `[Optimized by Wizard] ${prompt}`,
      note: "AI optimization disabled - no VIRTUALS_API_KEY",
    });
  }

  console.log("Using API key:", veniceApiKey.substring(0, 10) + "...");

  // Try multiple models
  const models = ["moonshotai/kimi-k2-5", "moonshotai-kimi-k2-5", "hermes-3-llama-3.1-70b"];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const veniceRes = await fetch("https://compute.virtuals.io/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${veniceApiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are a world-class prompt engineer for AI image generation. Transform simple prompts into highly detailed, professional-quality prompts.

RULES:
1. Add rich visual details: lighting, camera angle, art style, textures, colors, atmosphere
2. Mention artistic techniques or rendering engines
3. Keep under 100 words but make it vivid
4. Return ONLY the optimized prompt

Example:
Input: "gambar kucing lucu"
Output: "A fluffy domestic shorthair kitten with soft golden fur, sitting on a velvet cushion, warm afternoon sunlight streaming through a window, shallow depth of field, photorealistic, 85mm lens, cozy cottage interior, bokeh background, professional pet photography, 8k resolution"`,
            },
            {
              role: "user",
              content: `Optimize this prompt: "${prompt}"`
            }
          ],
          max_tokens: 500,
        }),
      });

      if (veniceRes.ok) {
        const veniceData = await veniceRes.json();
        const optimizedPrompt = veniceData.choices?.[0]?.message?.content?.trim() || prompt;
        console.log("Success with model:", model);
        return res.json({
          status: "success",
          original: prompt,
          result: optimizedPrompt,
          provider: "virtuals-ai",
          model: model,
        });
      } else {
        const errorBody = await veniceRes.text();
        console.log(`Model ${model} failed: ${veniceRes.status} - ${errorBody}`);
        lastError = errorBody;
      }
    } catch (error) {
      console.log(`Model ${model} error:`, error.message);
      lastError = error.message;
    }
  }

  // All models failed
  console.error("All models failed. Last error:", lastError);
  res.json({
    status: "success",
    result: `[Optimized by Wizard] ${prompt}`,
    error: `Virtuals API failed: ${lastError}`,
    note: "API models unavailable, using fallback",
  });
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Network: Base Sepolia (eip155:84532)`);
  console.log(`Pay To: ${MY_WALLET}`);
});

// Keep process alive
setInterval(() => {}, 1000000);
