import { decodeHex, encodeHexLowerCase } from '@oslojs/encoding';
import { eq } from 'drizzle-orm';
import { gmail_v1, google } from 'googleapis';
import { decode } from 'html-entities';
import sanitizeHtml from 'sanitize-html';

import { getUserFromSession, storeRefreshToken } from '../auth.server';
import { getSecret } from '../infisical.server';
import { logger } from '../logger.server';
import { db } from '../repositories/db.server';
import { cleanEmptyTags, cleanGmailReply, removeQuotedReplies } from '../sanitize.server';
import { companies, users } from '../schema.server';

const clientId = await getSecret('GMAIL_CLIENT_ID');
const clientSecret = await getSecret('GMAIL_CLIENT_SECRET');
const tokenKey = await getSecret('TOKEN_KEY');
const redirectUrl = await getSecret('GMAIL_REDIRECT_URL');

google.options({ http2: true });

const oauth2Client = new google.auth.OAuth2(clientId.secretValue, clientSecret.secretValue, redirectUrl.secretValue);

// Function to decode base64 content
const decodeContent = (data: string) => {
  // Replace URL-safe chars and add padding
  const sanitized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(sanitized, 'base64').toString('utf-8');
};

interface Attachment {
  filename: string;
  mimeType: string;
  data: string;
}

function findAttachments(part: gmail_v1.Schema$MessagePart, attachments: Attachment[] = []): Attachment[] {
  if (part?.body?.attachmentId && (part?.filename?.length || 0) > 0) {
    attachments.push({
      filename: part.filename as string,
      mimeType: part.mimeType as string,
      data: part.body.attachmentId as string,
    });
  } else if (part?.parts) {
    part.parts.forEach((p) => {
      if ((p.filename?.length || 0) > 0 && p.body?.attachmentId) {
        attachments.push({
          filename: p.filename as string,
          mimeType: p.mimeType as string,
          data: p.body.attachmentId as string,
        });
      }
      if (p.parts) {
        findAttachments(p, attachments);
      }
    });
  }

  return attachments;
}

// Function to get body content from parts
function getBodyContent(part: gmail_v1.Schema$MessagePart): string {
  if (part?.body?.data) {
    return decodeContent(part.body.data);
  }

  if (part?.parts) {
    // Prefer HTML content over plain text
    const htmlPart = part.parts.find((p) => p.mimeType === 'text/html');
    const textPart = part.parts.find((p) => p.mimeType === 'text/plain');

    if (htmlPart?.body?.data) {
      const text = sanitizeHtml(decodeContent(htmlPart.body.data), {
        allowedAttributes: {
          '*': ['href', 'align', 'alt', 'center', 'bgcolor', 'style', 'lang', 'id'],
        },
      });
      return removeQuotedReplies(cleanGmailReply(cleanEmptyTags(text)));
    }
    if (textPart?.body?.data) {
      return decodeContent(textPart.body.data);
    }
    if (part.parts) {
      const multipart = part.parts.find(
        (p) => p.mimeType === 'multipart/alternative' || p.mimeType === 'multipart/related',
      );
      return getBodyContent(multipart as gmail_v1.Schema$MessagePart);
    }
    return '';
  }

  return '';
}

export async function getEmail(): Promise<[string | null, string | null]> {
  try {
    const resp = await google.gmail({ version: 'v1', auth: oauth2Client }).users.getProfile({
      userId: 'me',
      fields: 'emailAddress',
    });
    return [null, resp.data.emailAddress as string];
  } catch (error) {
    logger.error(`Error getting email: ${error}`);
    return ['could not fetch email data', null];
  }
}
export function generateAuthUrl(path: string) {
  logger.info('Generating auth URL for google service');
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
    state: path,
    include_granted_scopes: true,
    prompt: 'consent',
  });
}
export async function setToken(code: string, userId: number) {
  const { tokens } = await oauth2Client.getToken(code);
  logger.info('Setting token for google service');
  oauth2Client.setCredentials(tokens);
  if (tokens.refresh_token) {
    logger.info('Storing refresh token for google service');
    await setRefreshToken(tokens.refresh_token, userId);
  }
}

export function isTokenSet() {
  return !!oauth2Client.credentials?.refresh_token;
}

export async function getAttachment(attachmentId: string, messageId: string): Promise<[string | null, string | null]> {
  try {
    const response = await google.gmail({ version: 'v1', auth: oauth2Client }).users.messages.attachments.get({
      id: attachmentId,
      messageId,
      userId: 'me',
    });
    return [null, response.data.data as string];
  } catch (error) {
    logger.error(`Error getting attachment: ${error}`);
    return ['could not fetch email data', null];
  }
}

export function clearRefreshToken() {
  oauth2Client.setCredentials({ refresh_token: undefined });
}

export async function getRedirectUrlIfThereIsNoToken(request: Request): Promise<string | undefined> {
  try {
    const user = await getUserFromSession(request);
    if (!user) return undefined;
    const data = await db.select({ refreshToken: users.gmailRefreshToken }).from(users).where(eq(users.id, user.id));
    if (!data.length || !data?.[0]?.refreshToken) return generateAuthUrl(new URL(request.url).pathname);
    const token = await decodeWithKey(data[0].refreshToken as string, tokenKey.secretValue);

    oauth2Client.setCredentials({ refresh_token: token });
  } catch (error) {
    logger.error(`Error checking if user has token: ${error}`);
    return undefined;
  }
}

export async function getThreadsByEmailAddress(email: string) {
  const response = await google
    .gmail({ version: 'v1', auth: oauth2Client })
    .users.threads.list({ q: `${email} AND -from:calendar-notification@google.com`, userId: 'me', maxResults: 50 });
  return response.data;
}

export async function getMessagesByThreadId(threadId: string): Promise<EmailMessage[]> {
  const response = await google.gmail({ version: 'v1', auth: oauth2Client }).users.threads.get({
    id: threadId,
    userId: 'me',
    format: 'full', // Get full message details
  });

  if (!response.data.messages?.length) {
    return [];
  }

  // Process each message in the thread
  const messagesPromises = response.data.messages.toReversed().map(async (message) => {
    // Get headers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = message.payload?.headers?.reduce((acc: any, header) => {
      acc[header.name?.toLowerCase() ?? ''] = header.value;
      return acc;
    }, {});

    // Get message content
    const content = getBodyContent(message.payload ?? {});

    // Find attachments in the message
    const attachmentsParts = findAttachments(message.payload ?? {});

    return {
      id: message.id as string,
      threadId: message.threadId as string,
      headers: {
        from: headers.from as string,
        to: headers.to as string,
        subject: decode(headers.subject as string),
        date: parseInt(message.internalDate as string),
        cc: headers.cc as string,
      },
      snippet: decode(message.snippet as string),
      content: decode(content),
      attachments: attachmentsParts.length ? attachmentsParts : undefined,
    };
  });

  // Wait for all messages to be processed
  return Promise.all(messagesPromises);
}

async function encodeWithKey(inputString: string, key: string) {
  // Convert strings to Uint8Array for Oslo functions
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(inputString);
  const keyData = textEncoder.encode(key);

  // Create a combined buffer for encoding
  const combined = new Uint8Array(data.length + keyData.length);
  combined.set(data);
  combined.set(keyData, data.length);

  // Alternatively, encode using hex
  const hexEncoded = encodeHexLowerCase(combined);

  return hexEncoded;
}

async function decodeWithKey(encodedString: string, key: string) {
  // Decode the string based on encoding format
  const decoded = decodeHex(encodedString);

  // Convert key to Uint8Array
  const textEncoder = new TextEncoder();
  const keyData = textEncoder.encode(key);

  // Remove the key part from the decoded data
  const originalData = decoded.slice(0, decoded.length - keyData.length);

  // Convert back to string
  const textDecoder = new TextDecoder();
  return textDecoder.decode(originalData);
}

async function setRefreshToken(token: string, userId: number) {
  const encoded = await encodeWithKey(token, tokenKey.secretValue);
  await storeRefreshToken(userId, encoded);
}

export async function getEmailsPerMunicipality(id: string): Promise<[string | null, Thread[] | null]> {
  let generalEmail: string;

  try {
    const data = await db.select({ email: companies.email }).from(companies).where(eq(companies.id, id));
    const match = data[0].email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (match) {
      generalEmail = match[0];
    } else {
      logger.error(`Could extract domain for the email: ${data[0].email}`);
      return ['could not fetch email data', null];
    }
  } catch (e) {
    logger.error(`Error in getEmailsPerMunicipality: ${e}`);
    return ['could not fetch email data', null];
  }

  try {
    const threads = await getThreadsByEmailAddress(generalEmail);
    const dt = await Promise.all((threads.threads || []).map((thread) => getMessagesByThreadId(thread.id as string)));
    setImmediate(() => {
      clearRefreshToken();
    });

    return [
      null,
      dt.map((thread) => ({
        id: thread[0].threadId,
        headers: thread[0].headers,
        snippet: thread[0].snippet,
        emails: thread,
      })),
    ];
  } catch (error) {
    logger.error(error);
    return ['could not fetch email data', null];
  }
}

export interface EmailMessage {
  id: string;
  threadId: string;
  headers: {
    from: string;
    to: string;
    subject: string;
    date: number;
    cc: string;
  };
  content: string;
  snippet: string;
  attachments?: Attachment[];
}

export interface Thread {
  id: string;
  emails: EmailMessage[];
  snippet: string;
  headers: {
    from: string;
    to: string;
    subject: string;
    date: number;
  };
}
