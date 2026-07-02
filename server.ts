import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable raw body tracking in express.json to securely verify webhook signatures
app.use(express.json({
  limit: "15mb",
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Initialize Firestore for server-side updates
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("[Firebase Server] Firestore database initialized successfully for webhook status updates.");
  } else {
    console.warn("[Firebase Server] firebase-applet-config.json not found in workspace root. Direct Firestore updates from webhook will be skipped.");
  }
} catch (error) {
  console.error("[Firebase Server] Failed to initialize Firestore on the server:", error);
}


// Initialize GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Route for Image Generation
app.post("/api/generate-image", async (req, res) => {
  const { prompt, aspectRatio = "1:1" } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to Settings > Secrets.");
    }

    console.log("Generating image with prompt:", prompt);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      // Sometimes it might return text instead of an image
      let textResponse = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.text) {
          textResponse += part.text;
        }
      }
      throw new Error(textResponse || "No image data returned from model");
    }

    res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Image generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// API Route for Product Description Generation
app.post("/api/generate-description", async (req, res) => {
  const { productName } = req.body;
  if (!productName) {
    return res.status(400).json({ error: "Product name is required" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to Settings > Secrets.");
    }

    console.log("Generating description for product:", productName);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a short, engaging, appetite-inducing description for a premium food product named "${productName}". Keep it to 2-3 sentences. Focus on flavor, ingredients, and the premium experience. Do not write generic introductory text. Just output the description directly.`,
    });

    const description = response.text?.trim() || "";
    res.json({ description });
  } catch (err: any) {
    console.error("Error generating description:", err);
    res.status(500).json({ error: err.message || "Failed to generate description" });
  }
});

// API Route for AI Meal Recommendations based on Mood & Budget
app.post("/api/ai-recommend", async (req, res) => {
  const { mood, budget, preference, items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Menu items catalog is required for recommendation" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to Settings > Secrets.");
    }

    const sysPrompt = `You are a warm, witty, extremely friendly local Yoruba chef and nutritionist from Ibadan, Nigeria who cooks for the hard-working class (corporate workers, techies, bankers). 
Your task is to recommend exactly ONE menu item (and optional size/extras) from the provided list of available dishes that perfectly matches the user's current physical state/mood, budget, and dietary preference.

User Mood/State: "${mood || 'Tired'}"
Max Budget: ${budget ? `₦${budget}` : "No limit"}
Dietary focus/preference: "${preference || 'Anything goes'}"

Here are the available dishes:
${JSON.stringify(items.map(it => ({ id: it.id, name: it.name, description: it.description, price: it.price, category: it.category, sizes: it.sizes, extras: it.extras })))}

Respond with a JSON object containing:
- "recommendedItemId": The string ID of the recommended item. Must match one of the available items exactly.
- "selectedSizeName": (Optional) Name of a size if the recommended item has multiple sizes.
- "selectedExtrasNames": (Optional array of strings) Names of extras from the item's custom extras list or standard extras that perfectly pair with this.
- "reasoning": A humorous, heartwarming explanation (2-3 sentences) in your Ibadan chef persona about why this is exactly what their soul, mind, and body need right now. Mention local references like traffic on Ring Road, Ibadan sun, or long work meetings.
- "proverb": A culinary Yoruba proverb translated to English, celebrating the joy of food and wellness.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: sysPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            recommendedItemId: { type: "STRING" },
            selectedSizeName: { type: "STRING" },
            selectedExtrasNames: { 
              type: "ARRAY", 
              items: { type: "STRING" } 
            },
            reasoning: { type: "STRING" },
            proverb: { type: "STRING" }
          },
          required: ["recommendedItemId", "reasoning", "proverb"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultObj = JSON.parse(resultText);
    res.json(resultObj);
  } catch (error: any) {
    console.error("AI recommendation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI recommendation" });
  }
});

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API Route for Nomba Checkout Order Creation
app.post("/api/nomba/create-order", async (req, res) => {
  const { amount, orderReference, customerEmail, callbackUrl, description } = req.body;

  if (!amount || !orderReference || !customerEmail) {
    return res.status(400).json({ error: "Missing required fields: amount, orderReference, customerEmail" });
  }

  try {
    const clientId = process.env.NOMBA_CLIENT_ID;
    const privateKey = process.env.NOMBA_PRIVATE_KEY;
    const nombaBaseUrl = process.env.NOMBA_BASE_URL || "https://api.nomba.com";

    if (!clientId || !privateKey) {
      throw new Error("Nomba API credentials are not configured in environment variables. Please check /.env");
    }

    const isSandbox = nombaBaseUrl.includes("sandbox");
    let accessToken = "";
    let accountId = "";

    if (isSandbox) {
      console.log("[Nomba] Sandbox mode detected. Bypassing token authentication endpoint.");
      accessToken = "sandbox_dummy_token";
    } else {
      console.log("[Nomba] Authenticating with Nomba API. Base URL:", nombaBaseUrl, "Client ID:", clientId);

      // 1. Authenticate to retrieve token and accountId
      const authResponse = await fetch(`${nombaBaseUrl}/v1/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: privateKey,
          private_key: privateKey,
          secret: privateKey
        })
      });

      const authData = await authResponse.json() as any;
      console.log("[Nomba] Auth response status:", authResponse.status);

      if (!authResponse.ok) {
        console.error("[Nomba] Authentication failed. Response:", authData);
        return res.status(authResponse.status).json({
          error: "Failed to authenticate with Nomba payment gateway",
          details: authData
        });
      }

      accessToken = authData.access_token || authData.data?.access_token || authData.token;
      accountId = authData.accountId || authData.data?.accountId || authData.account_id || authData.data?.account_id;

      if (!accessToken) {
        console.error("[Nomba] Auth response did not return access token:", authData);
        return res.status(500).json({
          error: "Nomba authentication did not return an access token",
          details: authData
        });
      }

      console.log("[Nomba] Authentication successful. Access token length:", accessToken.length, "Account ID:", accountId);
    }

    // 2. Construct order body according to Nomba schema
    const checkoutBody = {
      order: {
        amount: Number(amount),
        orderReference: orderReference,
        customerEmail: customerEmail,
        callbackUrl: callbackUrl || `${req.headers.origin || 'http://localhost:3000'}/order-success`,
        currency: "NGN",
        description: description || `Nouri Delivery Order ${orderReference}`
      }
    };

    console.log("[Nomba] Creating online checkout order:", JSON.stringify(checkoutBody));

    const checkoutHeaders: Record<string, string> = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };

    if (accountId) {
      checkoutHeaders["accountId"] = accountId;
    }

    const orderResponse = await fetch(`${nombaBaseUrl}/v1/checkout/order`, {
      method: "POST",
      headers: checkoutHeaders,
      body: JSON.stringify(checkoutBody)
    });

    const orderData = await orderResponse.json() as any;
    console.log("[Nomba] Order creation response status:", orderResponse.status);

    if (!orderResponse.ok) {
      console.error("[Nomba] Order creation failed. Response:", orderData);
      return res.status(orderResponse.status).json({
        error: "Failed to create checkout order with Nomba",
        details: orderData
      });
    }

    // Extract checkoutLink and return to client
    const checkoutLink = orderData.checkoutLink || orderData.data?.checkoutLink;

    if (!checkoutLink) {
      console.error("[Nomba] Response does not contain checkoutLink:", orderData);
      return res.status(500).json({
        error: "Nomba order creation did not return a checkoutLink",
        details: orderData
      });
    }

    console.log("[Nomba] Checkout order created successfully. Link:", checkoutLink);
    res.json({
      checkoutLink,
      orderReference,
      accountId
    });

  } catch (error: any) {
    console.error("[Nomba] Checkout creation error:", error);
    res.status(500).json({ error: error.message || "An internal error occurred during Nomba checkout creation" });
  }
});

// API Route to verify a checkout transaction status with Nomba
app.get("/api/nomba/verify-payment/:orderReference", async (req, res) => {
  const { orderReference } = req.params;

  if (!orderReference) {
    return res.status(400).json({ error: "Order reference parameter is required" });
  }

  try {
    const clientId = process.env.NOMBA_CLIENT_ID;
    const privateKey = process.env.NOMBA_PRIVATE_KEY;
    const nombaBaseUrl = process.env.NOMBA_BASE_URL || "https://api.nomba.com";

    if (!clientId || !privateKey) {
      throw new Error("Nomba API credentials are not configured in environment variables.");
    }

    console.log(`[Nomba] Verifying payment for reference: ${orderReference}. Base URL: ${nombaBaseUrl}`);

    const isSandbox = nombaBaseUrl.includes("sandbox");
    let accessToken = "";
    let accountId = "";

    if (isSandbox) {
      console.log("[Nomba] Sandbox mode detected during verification. Bypassing token authentication endpoint.");
      accessToken = "sandbox_dummy_token";
    } else {
      // 1. Authenticate to retrieve token and accountId
      const authResponse = await fetch(`${nombaBaseUrl}/v1/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: privateKey,
          private_key: privateKey,
          secret: privateKey
        })
      });

      const authData = await authResponse.json() as any;
      if (!authResponse.ok) {
        console.error("[Nomba] Auth failed during verification. Response:", authData);
        return res.status(authResponse.status).json({ error: "Failed to authenticate with Nomba during verification" });
      }

      accessToken = authData.access_token || authData.data?.access_token || authData.token;
      accountId = authData.accountId || authData.data?.accountId || authData.account_id || authData.data?.account_id;

      if (!accessToken) {
        return res.status(500).json({ error: "No access token retrieved for verification" });
      }
    }

    // 2. Request checkout transaction status from Nomba
    const verifyHeaders: Record<string, string> = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };

    if (accountId) {
      verifyHeaders["accountId"] = accountId;
    }

    // Try Option 2 (Checkout transaction by reference)
    const verifyUrl = `${nombaBaseUrl}/v1/checkout/transaction/reference/${orderReference}`;
    console.log(`[Nomba] Requesting verification from: ${verifyUrl}`);

    const verifyResponse = await fetch(verifyUrl, {
      method: "GET",
      headers: verifyHeaders
    });

    const verifyData = await verifyResponse.json() as any;
    console.log(`[Nomba] Verification status response: ${verifyResponse.status}`);

    if (!verifyResponse.ok) {
      console.warn("[Nomba] Primary verification endpoint failed, attempting fallback query...", verifyData);
      // Fallback checkout order check
      const fallbackUrl = `${nombaBaseUrl}/v1/checkout/order/reference/${orderReference}`;
      const fallbackResponse = await fetch(fallbackUrl, {
        method: "GET",
        headers: verifyHeaders
      });
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json() as any;
        return res.json({
          status: "success",
          source: "fallback",
          data: fallbackData
        });
      }

      return res.status(verifyResponse.status).json({
        error: "Failed to verify transaction status with Nomba",
        details: verifyData
      });
    }

    res.json({
      status: "success",
      source: "primary",
      data: verifyData
    });

  } catch (error: any) {
    console.error("[Nomba] Transaction verification error:", error);
    res.status(500).json({ error: error.message || "An error occurred while verifying the transaction status" });
  }
});

// API Route for Nomba Checkout Webhook Events
app.post("/api/nomba/webhook", async (req: any, res) => {
  console.log("[Nomba Webhook] Received webhook notification headers:", JSON.stringify(req.headers));
  console.log("[Nomba Webhook] Received webhook notification payload:", JSON.stringify(req.body));

  try {
    const payload = req.body;
    
    // 1. Extract order reference from multiple potential fields
    const orderReference = payload?.orderReference || 
                           payload?.data?.orderReference || 
                           payload?.data?.merchantTxRef || 
                           payload?.data?.paymentReference ||
                           payload?.paymentReference ||
                           payload?.reference;

    if (!orderReference) {
      console.warn("[Nomba Webhook] No order reference or transaction reference found in webhook payload.");
      return res.status(200).json({ status: "ignored", reason: "no reference found" });
    }

    console.log(`[Nomba Webhook] Processing notification for order reference: ${orderReference}`);

    // 2. Signature verification
    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;
    if (webhookSecret) {
      console.log("[Nomba Webhook] Webhook secret is configured. Verifying incoming signature...");
      const incomingSignature = req.headers["nomba-signature"] || req.headers["x-nomba-signature"];
      
      if (!incomingSignature) {
        console.error("[Nomba Webhook] Signature verification failed: 'nomba-signature' header is missing.");
        return res.status(401).json({ error: "Signature header missing" });
      }

      const rawBody = req.rawBody || JSON.stringify(payload);
      
      // Calculate HMAC using SHA-512 (Standard Nomba webhook hashing algorithm)
      const hmac512 = crypto.createHmac("sha512", webhookSecret).update(rawBody).digest("hex");
      // Calculate HMAC using SHA-256 (Fallback alternative)
      const hmac256 = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

      const sigLower = incomingSignature.toLowerCase();
      const isSignatureValid = (sigLower === hmac512.toLowerCase()) || (sigLower === hmac256.toLowerCase());

      if (!isSignatureValid) {
        console.error(`[Nomba Webhook] Signature verification failed. Computed SHA512: ${hmac512}, Computed SHA256: ${hmac256}, Received: ${incomingSignature}`);
        return res.status(401).json({ error: "Invalid signature verification" });
      }

      console.log("[Nomba Webhook] Signature verified successfully.");
    } else {
      console.log("[Nomba Webhook] Webhook secret is not configured. Skipping signature verification (recommended to set NOMBA_WEBHOOK_SECRET).");
    }

    // 3. Query Nomba API out-of-band to double-check and secure the transaction status
    let isVerifiedSuccessful = false;
    const clientId = process.env.NOMBA_CLIENT_ID;
    const privateKey = process.env.NOMBA_PRIVATE_KEY;
    const nombaBaseUrl = process.env.NOMBA_BASE_URL || "https://api.nomba.com";

    if (!clientId || !privateKey) {
      console.error("[Nomba Webhook] Nomba API credentials are not configured. Cannot perform out-of-band transaction validation.");
    } else {
      try {
        const isSandbox = nombaBaseUrl.includes("sandbox");
        let accessToken = "";
        let accountId = "";
        let authOk = false;

        if (isSandbox) {
          console.log("[Nomba Webhook] Sandbox mode detected. Bypassing token authentication endpoint.");
          accessToken = "sandbox_dummy_token";
          authOk = true;
        } else {
          // Authenticate
          const authResponse = await fetch(`${nombaBaseUrl}/v1/auth/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              grant_type: "client_credentials",
              client_id: clientId,
              client_secret: privateKey,
              private_key: privateKey,
              secret: privateKey
            })
          });

          const authData = await authResponse.json() as any;
          if (authResponse.ok) {
            accessToken = authData.access_token || authData.data?.access_token || authData.token;
            accountId = authData.accountId || authData.data?.accountId || authData.account_id || authData.data?.account_id;
            authOk = !!accessToken;
          }
        }

        if (authOk) {
          const verifyHeaders: Record<string, string> = {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          };

          if (accountId) {
            verifyHeaders["accountId"] = accountId;
          }

          // Fetch details from primary API
          const verifyUrl = `${nombaBaseUrl}/v1/checkout/transaction/reference/${orderReference}`;
          const verifyResponse = await fetch(verifyUrl, {
            method: "GET",
            headers: verifyHeaders
          });

          const verifyData = await verifyResponse.json() as any;
          
          if (verifyResponse.ok) {
            console.log(`[Nomba Webhook] Transaction verified via primary API for ${orderReference}:`, JSON.stringify(verifyData));
            const status = verifyData?.status || verifyData?.data?.status || verifyData?.code;
            if (status === "SUCCESS" || status === "SUCCESSFUL" || verifyData?.code === "00") {
              isVerifiedSuccessful = true;
            }
          } else {
            // Fallback checkout order check
            const fallbackUrl = `${nombaBaseUrl}/v1/checkout/order/reference/${orderReference}`;
            const fallbackResponse = await fetch(fallbackUrl, {
              method: "GET",
              headers: verifyHeaders
            });

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json() as any;
              console.log(`[Nomba Webhook] Transaction verified via fallback API for ${orderReference}:`, JSON.stringify(fallbackData));
              isVerifiedSuccessful = true;
            } else {
              console.warn(`[Nomba Webhook] Out-of-band validation failed for ${orderReference} with Nomba servers.`);
            }
          }
        }
      } catch (authError) {
        console.error("[Nomba Webhook] Out-of-band API call failed:", authError);
      }
    }

    // 4. Update the order status in Firestore database directly!
    // We update it if signature verification passed AND we either confirmed via out-of-band API or processed without credentials
    const shouldUpdateStatus = isVerifiedSuccessful || !clientId || !privateKey;

    if (shouldUpdateStatus) {
      if (db) {
        try {
          const orderRef = doc(db, 'orders', orderReference);
          const orderSnap = await getDoc(orderRef);
          
          if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            if (orderData.status !== 'Cancelled' && orderData.status !== 'Delivered') {
              await updateDoc(orderRef, { 
                status: 'Received',
                paidAt: new Date().toISOString(),
                paymentVerifiedBy: webhookSecret ? 'webhook_with_signature' : 'webhook_without_signature'
              });
              console.log(`[Nomba Webhook] Firestore order ${orderReference} status successfully updated to 'Received'.`);
            } else {
              console.log(`[Nomba Webhook] Firestore order ${orderReference} already has terminal status '${orderData.status}'. Skipping update.`);
            }
          } else {
            console.warn(`[Nomba Webhook] Order ${orderReference} does not exist in Firestore yet.`);
          }
        } catch (dbError) {
          console.error(`[Nomba Webhook] Failed to update order ${orderReference} in Firestore:`, dbError);
        }
      } else {
        console.warn("[Nomba Webhook] Firestore is not initialized. Skipping DB status update.");
      }
    } else {
      console.warn(`[Nomba Webhook] Order ${orderReference} was not successfully verified on Nomba servers. Skipping Firestore status update.`);
    }

    // Nomba webhook expectations: Always return 200 OK so Nomba does not keep retrying
    res.status(200).json({ status: "success", orderReference });

  } catch (error: any) {
    console.error("[Nomba Webhook] Error processing webhook:", error);
    res.status(200).json({ status: "error", message: error.message || "Internal error" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
