const baseUrls = [
  "https://sandbox.nomba.com",
  "https://api.nomba.com"
];

const paths = [
  "",
  "/",
  "/auth",
  "/token",
  "/auth/token",
  "/v1/auth",
  "/v1/token",
  "/v1/auth/token",
  "/v1/auth/token/",
  "/v2/auth/token",
  "/api/v1/auth/token",
  "/api/auth/token",
  "/v1/checkout/order",
  "/v1/checkout/order/"
];

async function scan() {
  console.log("=== STARTING ENDPOINT PATH SCAN ===");
  for (const baseUrl of baseUrls) {
    console.log(`\nScanning Host: ${baseUrl}`);
    for (const path of paths) {
      const url = `${baseUrl}${path}`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grant_type: "client_credentials" })
        });
        const text = await response.text();
        const shortText = text.length > 150 ? text.slice(0, 150) + "..." : text;
        console.log(`[POST] ${path} -> Status: ${response.status} | Body: ${shortText}`);
      } catch (err: any) {
        console.log(`[POST] ${path} -> Error: ${err.message}`);
      }

      try {
        const response = await fetch(url, { method: "GET" });
        const text = await response.text();
        const shortText = text.length > 150 ? text.slice(0, 150) + "..." : text;
        console.log(`[GET] ${path} -> Status: ${response.status} | Body: ${shortText}`);
      } catch (err: any) {
        console.log(`[GET] ${path} -> Error: ${err.message}`);
      }
    }
  }
}

scan();
