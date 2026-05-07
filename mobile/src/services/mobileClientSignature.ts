import { Platform } from 'react-native';

export const CLIENT_TYPE = 'mobile';
export const APP_PLATFORM = Platform.OS;

const SIGNATURE_WINDOW_MS = 30000;
const HMAC_BLOCK_SIZE = 64;
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rightRotate = (value: number, amount: number): number => (value >>> amount) | (value << (32 - amount));

const utf8Bytes = (value: string): number[] => {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >>> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      const next = value.charCodeAt((index += 1));
      const combined = 0x10000 + (((codePoint & 0x3ff) << 10) | (next & 0x3ff));
      bytes.push(
        0xf0 | (combined >>> 18),
        0x80 | ((combined >>> 12) & 0x3f),
        0x80 | ((combined >>> 6) & 0x3f),
        0x80 | (combined & 0x3f),
      );
    } else {
      bytes.push(0xe0 | (codePoint >>> 12), 0x80 | ((codePoint >>> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    }
  }

  return bytes;
};

const sha256 = (input: number[]): number[] => {
  const bytes = [...input];
  const bitLength = bytes.length * 8;
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  bytes.push(0x80);
  while (bytes.length % HMAC_BLOCK_SIZE !== 56) {
    bytes.push(0);
  }

  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  bytes.push(
    (highBits >>> 24) & 0xff,
    (highBits >>> 16) & 0xff,
    (highBits >>> 8) & 0xff,
    highBits & 0xff,
    (lowBits >>> 24) & 0xff,
    (lowBits >>> 16) & 0xff,
    (lowBits >>> 8) & 0xff,
    lowBits & 0xff,
  );

  for (let offset = 0; offset < bytes.length; offset += HMAC_BLOCK_SIZE) {
    const w = new Array<number>(64);

    for (let index = 0; index < 16; index += 1) {
      const position = offset + index * 4;
      w[index] =
        ((bytes[position] << 24) | (bytes[position + 1] << 16) | (bytes[position + 2] << 8) | bytes[position + 3]) >>>
        0;
    }

    for (let index = 16; index < 64; index += 1) {
      const s0 = rightRotate(w[index - 15], 7) ^ rightRotate(w[index - 15], 18) ^ (w[index - 15] >>> 3);
      const s1 = rightRotate(w[index - 2], 17) ^ rightRotate(w[index - 2], 19) ^ (w[index - 2] >>> 10);
      w[index] = (w[index - 16] + s0 + w[index - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K[index] + w[index]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return hash.flatMap((value) => [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
};

const hmacSha256Hex = (secret: string, message: string): string => {
  let key = utf8Bytes(secret);

  if (key.length > HMAC_BLOCK_SIZE) {
    key = sha256(key);
  }

  const paddedKey = [...key, ...new Array<number>(HMAC_BLOCK_SIZE - key.length).fill(0)];
  const outerKeyPad = paddedKey.map((byte) => byte ^ 0x5c);
  const innerKeyPad = paddedKey.map((byte) => byte ^ 0x36);
  const digest = sha256([...outerKeyPad, ...sha256([...innerKeyPad, ...utf8Bytes(message)])]);

  return digest.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const buildMobileClientSignature = (clientVersion: string): string | undefined => {
  const secret = process.env.EXPO_PUBLIC_MOBILE_CLIENT_SECRET?.trim();

  if (!secret) {
    return undefined;
  }

  const timestampWindow = Math.floor(Date.now() / SIGNATURE_WINDOW_MS);
  const signaturePayload = `${CLIENT_TYPE}:${clientVersion}:${APP_PLATFORM}:${timestampWindow}`;

  return hmacSha256Hex(secret, signaturePayload);
};
