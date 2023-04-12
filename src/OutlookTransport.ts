import type { SentMessageInfo, Transport } from 'nodemailer';
import type { Options as OAuth2Options } from 'nodemailer/lib/xoauth2';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';

import { post, postRFC822 } from './services/Requestly';

type MailMessageWithBcc = MailMessage & {
  message: {
    keepBcc: boolean;
  };
};

type DoneCallback = (err: Error | null, info?: SentMessageInfo) => void;

interface OAuth2 {
  access_token: string;
  token_type: string;
  id_token: string;
  scope: string;
  expires_in: number;
}

export interface Options {
  auth: OAuth2Options;
  userId?: string;
}

function messageToBase64Raw(message: Buffer): string {
  return message.toString('base64');
}

function refreshTokenParams(auth: OAuth2Options): Record<string, string> {
  return {
    client_id: auth.clientId!,
    client_secret: auth.clientSecret!,
    refresh_token: auth.refreshToken!,
    grant_type: 'refresh_token',
  };
}

function createError(error: string): Error {
  if (!error) return new Error('Please check your account');

  return new Error(error);
}

export class OutlookTransport implements Transport {
  public name: string = 'OutlookTransport';
  public version: string = 'N/A';

  constructor(private options: Options) {}

  private getAccessToken(): Promise<string> {
    return post<OAuth2>(
      {
        protocol: 'https:',
        hostname: 'graph.microsoft.com',
        path: '/oauth2/v4/token',
      },
      refreshTokenParams(this.options.auth),
    ).then((data) => {
      if (typeof data === 'string') {
        return Promise.reject(data);
      }

      return data.access_token;
    });
  }

  private sendMail(data: string, accessToken: string): Promise<unknown> {
    return postRFC822(
      {
        protocol: 'https:',
        hostname: 'graph.microsoft.com',
        path: `/v1.0/${this.options.userId || 'me'}/sendMail`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data,
    );
  }

  public send(mail: MailMessageWithBcc, done: DoneCallback): void {
    mail.message.keepBcc = true;
    mail.message.build().then(
      (data) => {
        const mimeData = messageToBase64Raw(data);

        console.time();
        this.sendMail(mimeData, this.options.auth.accessToken!).then(
          (message) => {
            console.timeEnd();
            done(null, {
              envelope: mail.message.getEnvelope(),
              messageId: mail.message.messageId(),
              accessToken: this.options.auth.accessToken!,
              message: message,
            });
          },
          (error) => {
            // if (error === 401 && this.options.auth.refreshToken) {
            //   this.getAccessToken()
            //     .then((accessToken: string) => {
            //       this.sendMail(data, accessToken, mail, done).catch((error) =>
            //         done(createError(error)),
            //       );
            //     })
            //     .catch((error) => done(createError(error)));
            // } else {
            console.timeEnd();
            console.error(error);
            done(createError(error));
            //}
          },
        );
      },
      (error) => {
        done(error);
      },
    );
  }
}

export default OutlookTransport;
