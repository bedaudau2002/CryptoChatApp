const forge = require("node-forge");
const fs = require("fs");

// // Generate RSA key pair
// const rsaKeyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

// // Convert the public key to PEM format
// const publicKeyPem = forge.pki.publicKeyToPem(rsaKeyPair.publicKey);

// // Convert the private key to PEM format
// const privateKeyPem = forge.pki.privateKeyToPem(rsaKeyPair.privateKey);

// Read private and public key files
const publicKeyPem = fs.readFileSync(
  "/home/bedaudau/react-firebase-chat/Key/public.pem",
  "utf8"
);
const privateKeyPem = fs.readFileSync(
  "/home/bedaudau/react-firebase-chat/Key/private.pem",
  "utf8"
);
// Encrypt a message using RSA and AES
function encryptMessage(message, publicKey) {
  const aesKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(16);

  const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(message));
  cipher.finish();

  const encryptedMessage = cipher.output.getBytes();

  const rsa = forge.pki.publicKeyFromPem(publicKey);
  const encryptedAesKey = rsa.encrypt(aesKey, "RSA-OAEP", {
    md: forge.md.sha1.create(),
  });

  return {
    encryptedMessage,
    encryptedAesKey,
    iv,
  };
}

// Decrypt a message using RSA and AES
function decryptMessage(encryptedMessage, encryptedAesKey, iv, privateKey) {
  const rsa = forge.pki.privateKeyFromPem(privateKey);
  const aesKey = rsa.decrypt(encryptedAesKey, "RSA-OAEP", {
    md: forge.md.sha1.create(),
  });

  const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
  decipher.start({ iv });
  decipher.update(forge.util.createBuffer(encryptedMessage));
  decipher.finish();

  return decipher.output.toString();
}

// Calculate the SHA-1 hash of a message
function calculateHash(message) {
  const md = forge.md.sha1.create();
  md.update(message);
  return md.digest().toHex();
}

// Example usage
// const message = "Hello, World!";
// const hash = calculateHash(message);
// const encryptedData = encryptMessage(hash, publicKeyPem);
// const decryptedMessage = decryptMessage(
//   encryptedData.encryptedMessage,
//   encryptedData.encryptedAesKey,
//   encryptedData.iv,
//   privateKeyPem
// );

// console.log("Original message:", message);
// console.log("SHA-1 hash:", hash);
// console.log("Decrypted message:", decryptedMessage);
