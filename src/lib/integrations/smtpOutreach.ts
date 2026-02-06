/**
 * REAL SMTP Email Outreach
 * Uses user's own SMTP server for sending outreach emails
 * Tracks opens, clicks, and responses with email headers
 * NO MOCKING - REAL EMAIL DELIVERY AND TRACKING
 */

import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailTracking {
  messageId: string;
  recipientEmail: string;
  subject: string;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  clickedLink?: string;
  responses: EmailResponse[];
  status: 'sent' | 'bounced' | 'opened' | 'clicked' | 'replied';
}

export interface EmailResponse {
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
}

/**
 * Initialize SMTP transporter with user's credentials
 */
export function initializeSMTP(config: SMTPConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
}

/**
 * Send real outreach email via SMTP with tracking pixel
 */
export async function sendOutreachEmailViaS MTP(
  transporter: nodemailer.Transporter,
  to: string,
  subject: string,
  body: string,
  trackingConfig?: {
    webhookUrl?: string;
    trackOpens?: boolean;
    trackClicks?: boolean;
  }
): Promise<EmailTracking> {
  const messageId = uuidv4();
  const trackingPixelUrl = trackingConfig?.trackOpens
    ? `${trackingConfig.webhookUrl}/pixel/${messageId}`
    : '';

  // Add tracking pixel to email body if enabled
  let emailBody = body;
  if (trackingConfig?.trackOpens && trackingPixelUrl) {
    emailBody += `\n\n<img src="${trackingPixelUrl}" width="1" height="1" alt="" />`;
  }

  // Add click tracking to links
  if (trackingConfig?.trackClicks && trackingConfig.webhookUrl) {
    const linkRegex = /(https?:\/\/[^\s\)]+)/g;
    emailBody = emailBody.replace(linkRegex, (url) => {
      const encodedUrl = Buffer.from(url).toString('base64');
      return `${trackingConfig.webhookUrl}/click/${messageId}/${encodedUrl}`;
    });
  }

  try {
    const result = await transporter.sendMail({
      from: transporter.options.auth?.user || '',
      to,
      subject,
      html: emailBody,
      headers: {
        'X-Message-ID': messageId,
        'X-Tracking-ID': messageId,
        'List-Unsubscribe': `<${trackingConfig?.webhookUrl}/unsubscribe/${messageId}>`,
      },
    });

    console.log(`[REAL SMTP] Email sent to ${to} with message ID: ${messageId}`);

    return {
      messageId,
      recipientEmail: to,
      subject,
      sentAt: new Date(),
      responses: [],
      status: 'sent',
    };
  } catch (error) {
    console.error(`[REAL SMTP] Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Batch send outreach emails via SMTP
 */
export async function batchSendOutreachEmails(
  transporter: nodemailer.Transporter,
  recipients: Array<{ email: string; name: string; personalizedBody: string }>,
  subject: string,
  trackingConfig?: {
    webhookUrl?: string;
    trackOpens?: boolean;
    trackClicks?: boolean;
  }
): Promise<EmailTracking[]> {
  const results: EmailTracking[] = [];

  for (const recipient of recipients) {
    try {
      const tracking = await sendOutreachEmailViaS MTP(
        transporter,
        recipient.email,
        subject,
        recipient.personalizedBody,
        trackingConfig
      );
      results.push(tracking);

      // Delay between sends to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to send to ${recipient.email}:`, error);
      results.push({
        messageId: uuidv4(),
        recipientEmail: recipient.email,
        subject,
        sentAt: new Date(),
        responses: [],
        status: 'bounced',
      });
    }
  }

  console.log(
    `[REAL SMTP] Sent ${results.filter((r) => r.status === 'sent').length}/${recipients.length} emails`
  );

  return results;
}

/**
 * Listen for email replies using IMAP connection
 */
export async function monitorIncomingReplies(
  imapConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
  },
  messageIds: string[]
): Promise<EmailResponse[]> {
  const Imap = require('imap');
  const { simpleParser } = require('mailparser');

  const imap = new Imap({
    user: imapConfig.user,
    password: imapConfig.password,
    host: imapConfig.host,
    port: imapConfig.port,
    tls: imapConfig.tls,
  });

  const responses: EmailResponse[] = [];

  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (error: any) => {
      if (error) reject(error);

      // Search for emails with our tracking IDs in references/headers
      imap.search(
        ['RECENT'],
        (error: any, results: any) => {
          if (error) reject(error);
          if (results.length === 0) {
            imap.closeBox(() => imap.end());
            resolve([]);
            return;
          }

          const f = imap.fetch(results, { bodies: '' });

          f.on('message', (msg: any) => {
            simpleParser(msg, async (error: any, parsed: any) => {
              if (error) {
                console.error('Parse error:', error);
                return;
              }

              // Check if this is a reply to our outreach
              const inReplyTo = parsed.headers.get('in-reply-to');
              const references = parsed.headers.get('references');

              if (inReplyTo && messageIds.includes(inReplyTo)) {
                responses.push({
                  from: parsed.from.text,
                  subject: parsed.subject || 'No Subject',
                  body: parsed.text || '',
                  receivedAt: new Date(),
                  sentiment: analyzeSentiment(parsed.text || ''),
                });
              }
            });
          });

          f.on('error', reject);
          f.on('end', () => {
            imap.closeBox(() => imap.end());
            resolve(responses);
          });
        }
      );
    });

    imap.openBox('INBOX', false, () => {});
  });
}

/**
 * Simple sentiment analysis for email responses
 */
function analyzeSentiment(
  text: string
): 'positive' | 'negative' | 'neutral' {
  const positiveWords = [
    'interested',
    'great',
    'love',
    'excellent',
    'perfect',
    'yes',
    'agree',
    'thanks',
    'appreciate',
  ];
  const negativeWords = [
    'no',
    'not interested',
    'decline',
    'reject',
    'bad',
    'poor',
    'unfortunately',
  ];

  const textLower = text.toLowerCase();
  const positiveCount = positiveWords.filter((w) =>
    textLower.includes(w)
  ).length;
  const negativeCount = negativeWords.filter((w) =>
    textLower.includes(w)
  ).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Track email opens via pixel
 */
export function handleTrackingPixel(
  messageId: string,
  trackingStore: Map<string, EmailTracking>
): void {
  const tracking = trackingStore.get(messageId);
  if (tracking && !tracking.openedAt) {
    tracking.openedAt = new Date();
    tracking.status = 'opened';
    trackingStore.set(messageId, tracking);
    console.log(`[TRACKING] Email opened: ${messageId}`);
  }
}

/**
 * Track link clicks
 */
export function handleClickTracking(
  messageId: string,
  encodedUrl: string,
  trackingStore: Map<string, EmailTracking>
): string {
  const tracking = trackingStore.get(messageId);
  if (tracking && !tracking.clickedAt) {
    tracking.clickedAt = new Date();
    tracking.clickedLink = Buffer.from(encodedUrl, 'base64').toString();
    tracking.status = 'clicked';
    trackingStore.set(messageId, tracking);
    console.log(
      `[TRACKING] Link clicked: ${messageId} -> ${tracking.clickedLink}`
    );
  }

  // Return actual URL
  return Buffer.from(encodedUrl, 'base64').toString();
}
