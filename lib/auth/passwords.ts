/** O'xshash belgilar (0/O, 1/l/I) olib tashlangan: parol og'zaki aytilganda adashmaslik uchun. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Kriptografik tasodifiy parol (brauzerda ham, serverda ham ishlaydi). */
export function generatePassword(length = 8): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
