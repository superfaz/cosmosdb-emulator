import crypto from "node:crypto";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Emulator master key
const masterKey =
  "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

// Source: https://learn.microsoft.com/en-us/rest/api/cosmos-db/access-control-on-cosmosdb-resources?redirectedfrom=MSDN#authorization-header
function getAuthorizationTokenUsingMasterKey(
  verb: string = "",
  resourceType: string = "",
  resourceId: string = "",
  date: string = "",
  masterKey: string
): string {
  const key = Buffer.from(masterKey, "base64");

  const text =
    verb.toLowerCase() +
    "\n" +
    resourceType.toLowerCase() +
    "\n" +
    resourceId +
    "\n" +
    date.toLowerCase() +
    "\n\n";

  const signature = crypto
    .createHmac("sha256", key)
    .update(text, "utf8")
    .digest("base64");

  const MasterToken = "master";

  const TokenVersion = "1.0";

  return encodeURIComponent(
    "type=" + MasterToken + "&ver=" + TokenVersion + "&sig=" + signature
  );
}

const requestDateString = new Date().toUTCString();

(async () => {
  const response = await fetch("https://localhost:8082/dbs", {
    method: "GET",
    headers: {
      Accept: "application/json",
      authorization: getAuthorizationTokenUsingMasterKey(
        "GET",
        "dbs",
        "",
        requestDateString,
        masterKey
      ),
      "x-ms-date": requestDateString,
      "x-ms-version": "2018-12-31",
    },
  });

  console.log("status:", response.status);
  console.log("statusText:", response.statusText);
  console.log("headers:");
  for (const pair of response.headers.entries()) {
    console.log(`  ${pair[0]}: ${pair[1]}`);
  }
  console.log("body:", await response.json());
})().catch(console.error);
