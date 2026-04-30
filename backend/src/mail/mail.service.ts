import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';

type MailEnvelopeAddress = { name?: string | null; address?: string | null };

function toAddressString(value: unknown) {
  if (!value) {
    return null;
  }

  const addresses = Array.isArray(value) ? (value as MailEnvelopeAddress[]) : [value as MailEnvelopeAddress];
  const clean = addresses
    .map((item) => [item?.name, item?.address].filter(Boolean).join(' ').trim())
    .filter(Boolean);

  return clean.length ? clean.join(', ') : null;
}

@Injectable()
export class MailService {
  private get imapHost() {
    return process.env.MAIL_IMAP_HOST ?? 'imap.mail.ru';
  }

  private get imapPort() {
    return Number(process.env.MAIL_IMAP_PORT ?? 993);
  }

  private get smtpHost() {
    return process.env.MAIL_SMTP_HOST ?? 'smtp.mail.ru';
  }

  private get smtpPort() {
    return Number(process.env.MAIL_SMTP_PORT ?? 465);
  }

  private get smtpSecure() {
    if (process.env.MAIL_SMTP_SECURE !== undefined) {
      return ['1', 'true', 'yes', 'on'].includes(String(process.env.MAIL_SMTP_SECURE).toLowerCase());
    }

    return this.smtpPort === 465;
  }

  private get smtpConnectionTimeoutMs() {
    return Number(process.env.MAIL_SMTP_CONNECTION_TIMEOUT_MS ?? 8000);
  }

  private get smtpGreetingTimeoutMs() {
    return Number(process.env.MAIL_SMTP_GREETING_TIMEOUT_MS ?? 8000);
  }

  private get smtpSocketTimeoutMs() {
    return Number(process.env.MAIL_SMTP_SOCKET_TIMEOUT_MS ?? 10000);
  }

  private get mailUser() {
    return process.env.MAIL_USER;
  }

  private get mailPass() {
    return process.env.MAIL_PASS;
  }

  private get mailFrom() {
    return process.env.MAIL_FROM ?? this.mailUser ?? undefined;
  }

  private assertConfigured() {
    if (!this.mailUser || !this.mailPass) {
      throw new BadRequestException('MAIL_USER and MAIL_PASS must be configured on the backend.');
    }
  }

  async testConnections() {
    this.assertConfigured();

    const imapOk = await this.testImap();
    const smtpOk = await this.testSmtp();

    return { imapOk, smtpOk };
  }

  async listRecentInbox(limit = 10) {
    this.assertConfigured();

    const client = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      auth: {
        user: this.mailUser!,
        pass: this.mailPass!,
      },
      logger: false,
    });

    try {
      await client.connect();

      const lock = await client.getMailboxLock('INBOX');
      try {
        const uidsRaw = await client.search({ all: true });
        const uids = Array.isArray(uidsRaw) ? uidsRaw : [];
        const selected = uids.slice(Math.max(0, uids.length - limit));

        const messages: Array<{
          uid: number;
          subject: string | null;
          date: string | null;
          from: string | null;
          to: string | null;
          messageId: string | null;
        }> = [];

        for await (const message of client.fetch(selected, { uid: true, envelope: true })) {
          messages.push({
            uid: message.uid,
            subject: message.envelope?.subject ?? null,
            date: message.envelope?.date ? new Date(message.envelope.date).toISOString() : null,
            from: toAddressString(message.envelope?.from),
            to: toAddressString(message.envelope?.to),
            messageId: message.envelope?.messageId ?? null,
          });
        }

        return {
          mailbox: 'INBOX',
          total: uids.length,
          returned: messages.length,
          messages,
        };
      } finally {
        lock.release();
      }
    } catch (error) {
      throw new ServiceUnavailableException('IMAP connection failed.');
    } finally {
      try {
        await client.logout();
      } catch {
        // ignore
      }
    }
  }

  async sendMail(options: { to: string; subject: string; text?: string; html?: string }) {
    this.assertConfigured();

    const transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth: {
        user: this.mailUser!,
        pass: this.mailPass!,
      },
      connectionTimeout: this.smtpConnectionTimeoutMs,
      greetingTimeout: this.smtpGreetingTimeoutMs,
      socketTimeout: this.smtpSocketTimeoutMs,
      tls: {
        servername: this.smtpHost,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: this.mailFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
    } catch {
      throw new ServiceUnavailableException('SMTP send failed.');
    }
  }

  private async testImap() {
    const client = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      auth: { user: this.mailUser!, pass: this.mailPass! },
      logger: false,
    });

    try {
      await client.connect();
      return true;
    } catch {
      return false;
    } finally {
      try {
        await client.logout();
      } catch {
        // ignore
      }
    }
  }

  private async testSmtp() {
    const transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth: { user: this.mailUser!, pass: this.mailPass! },
      connectionTimeout: this.smtpConnectionTimeoutMs,
      greetingTimeout: this.smtpGreetingTimeoutMs,
      socketTimeout: this.smtpSocketTimeoutMs,
      tls: {
        servername: this.smtpHost,
      },
    });

    try {
      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
