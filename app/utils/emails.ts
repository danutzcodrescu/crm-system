const regex = /([^<]+)\s*<([^>]+)>/;
const emailRegex = /<?([a-zA-Z0-9._%+-]+)(?=@)/;
export function extractNameFromHeader(header: string) {
  /* extract the sender name from the header that is name <test@test.com> */
  return header.match(regex)?.[1]?.trim() || header.match(emailRegex)?.[1] || header;
}

export function extractEmailFromHeader(header: string) {
  /* extract the sender email from the header that is name <test@test.com> */
  return header.match(regex)?.[2]?.trim() || header.match(/<([^>]+)>/)?.[1] || header;
}

export function base64ToBlob(base64: string, mimeType: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
