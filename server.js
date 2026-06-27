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

// Temporarily disable x402 for testing AI
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

  // Check for OpenRouter API key (more reliable)
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://prompt-wizard.local",
          "X-Title": "Prompt Wizard",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "user",
              content: `Rewrite this image generation prompt with rich visual details (lighting, camera angle, art style, textures, colors, atmosphere):\n\n"${prompt}"\n\nReturn ONLY the improved prompt, no explanation:`
            }
          ],
        }),
      });

      if (orRes.ok) {
        const data = await orRes.json();
        const result = data.choices?.[0]?.message?.content?.trim();
        if (result && result.length > 10) {
          return res.json({
            status: "success",
            original: prompt,
            result: result,
            provider: "openrouter",
          });
        }
      }
    } catch (e) {
      console.log("OpenRouter failed:", e.message);
    }
  }

  // Fallback: Virtuals (echo mode, limited use)
  const virtualsKey = process.env.VIRTUALS_API_KEY;
  if (virtualsKey) {
    try {
      const veniceRes = await fetch("https://compute.virtuals.io/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${virtualsKey}`,
        },
        body: JSON.stringify({
          model: "moonshotai-kimi-k2-5",
          messages: [
            {
              role: "user",
              content: `Rewrite this with vivid details: "${prompt}"`
            }
          ],
          max_tokens: 300,
        }),
      });

      if (veniceRes.ok) {
        const data = await veniceRes.json();
        const result = data.choices?.[0]?.message?.content?.trim();
        
        // Only use if not echo
        if (result && result.length > prompt.length) {
          return res.json({
            status: "success",
            original: prompt,
            result: result,
            provider: "virtuals-ai",
          });
        }
      }
    } catch (e) {
      console.log("Virtuals failed:", e.message);
    }
  }

  // Final fallback with manual enhancement
  const enhanced = `A highly detailed, professional image of ${prompt}, cinematic lighting, photorealistic, 8k resolution, shallow depth of field, professional photography, vibrant colors, sharp focus`;
  
  res.json({
    status: "success",
    original: prompt,
    result: enhanced,
    provider: "fallback-template",
    note: "AI services limited - using template enhancement",
  });
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Network: Base Sepolia (eip155:84532)`);
  console.log(`Pay To: ${MY_WALLET}`);
});

setInterval(() => {}, 1000000);
