// Import the necessary libraries
import CryptoJS from "crypto-js";

// const publicKeyPem = fs.readFileSync(
//   "/home/bedaudau/react-firebase-chat/Key/public.pem",
//   "utf8"
// );
// const privateKeyPem = fs.readFileSync(
//   "/home/bedaudau/react-firebase-chat/Key/private.pem",
//   "utf8"
// );
// function generateKey() {
//   const rsa = new CryptoJS.RSAKey();
//   rsa.generate(1024, "10001");
//   const publicKey = rsa.getPublicString();
//   const privateKey = rsa.getPrivateString();
//   return { publicKey, privateKey };
// }

function encryptMessage(message, publicKey) {
  const aesKey = CryptoJS.lib.WordArray.random(32);
  const iv = CryptoJS.lib.WordArray.random(16);

  const encryptedMessage = CryptoJS.AES.encrypt(message, aesKey, {
    iv: iv,
  }).ciphertext.toString(CryptoJS.enc.Base64);

  const rsa = new CryptoJS.RSAKey();
  rsa.readPublicKeyFromPEMString(publicKey);
  const encryptedAesKey = rsa.encrypt(aesKey.toString(), "RSA-OAEP");

  return {
    encryptedMessage,
    encryptedAesKey,
    iv: iv.toString(),
  };
}

function decryptMessage(encryptedMessage, encryptedAesKey, iv, privateKey) {
  const rsa = new CryptoJS.RSAKey();
  rsa.readPrivateKeyFromPEMString(privateKey);
  const aesKey = rsa.decrypt(encryptedAesKey, "RSA-OAEP");

  const decryptedMessage = CryptoJS.AES.decrypt(
    {
      ciphertext: CryptoJS.enc.Base64.parse(encryptedMessage),
    },
    aesKey,
    {
      iv: CryptoJS.enc.Hex.parse(iv),
    }
  ).toString(CryptoJS.enc.Utf8);

  return decryptedMessage;
}

function calculateHash(message) {
  const hash = CryptoJS.SHA1(message);
  return hash.toString(CryptoJS.enc.Hex);
}
export { generateKey, encryptMessage, decryptMessage, calculateHash };
