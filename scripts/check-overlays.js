#!/usr/bin/env node
/**
 * Overlay integrity check: verifies each service overlay has canonical files.
 */
const fs = require("fs");
const path = require("path");

const baseDir = path.join(
  __dirname,
  "..",
  "infra",
  "k8s",
  "overlays",
  "prod",
  "platform-core",
);
const expected = [
  "deployment.yaml",
  "service.yaml",
  "serviceaccount.yaml",
  "external-secret.yaml",
  "pdb.yaml",
  "hpa.yaml",
  "networkpolicy.yaml",
  "servicemonitor.yaml",
];

function isServiceDir(name) {
  // exclude non-service files/dirs
  const exclude = new Set([
    "ingress.yaml",
    "secretstore-vault.yaml",
    "vault-auth-serviceaccount.yaml",
  ]);
  return !exclude.has(name) && !name.endsWith(".yaml");
}

function main() {
  const entries = fs.readdirSync(baseDir);
  const serviceDirs = entries.filter(isServiceDir);
  let ok = true;

  for (const svc of serviceDirs) {
    const svcPath = path.join(baseDir, svc);
    const files = fs.readdirSync(svcPath);
    const missing = expected.filter((f) => !files.includes(f));
    if (missing.length) {
      ok = false;
      console.error(`❌ ${svc}: missing files -> ${missing.join(", ")}`);
    } else {
      console.log(`✅ ${svc}: all files present`);
    }
  }

  if (!ok) {
    console.error("\nOverlay integrity check failed.");
    process.exit(1);
  } else {
    console.log("\nOverlay integrity check passed.");
  }
}

main();
