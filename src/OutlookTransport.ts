import type { SentMessageInfo, Transport } from 'nodemailer';
import type { Options as OAuth2Options } from 'nodemailer/lib/xoauth2';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';
import type { Address } from 'nodemailer/lib/mailer';

import { post, postJSON } from './services/Requestly';

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

  private sendMail(data: Record<string, unknown>, accessToken: string): Promise<unknown> {
    return postJSON(
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

  public send(mail: MailMessage, done: DoneCallback): void {
    mail.normalize((error, data) => {
      if (error) return done(error);
      if (!data) return done(new Error('The email data is corrapted.'));

      const outlookData = {
        message: {
          subject: data.subject,
          body: {
            contentType: 'HTML',
            content: data.html,
          },
          from: {
            emailAddress: data.from,
          },
          toRecipients: [
            {
              emailAddress: {
                name: (data.to as Address[])[0].name,
                address: (data.to as Address[])[0].address,
              },
            },
          ],
          // attachments: [
          //   {
          //     '@odata.type': '#microsoft.graph.fileAttachment',
          //     contentId: data.attachments![0].cid, // test if it will break for non embedded
          //     name: data.attachments![0].filename,
          //     contentType: data.attachments![0].contentType,
          //     contentBytes: data.attachments![0].content,
          //   },
          // ],
        },
      };

      console.time();
      this.sendMail(outlookData, this.options.auth.accessToken!).then(
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
    });
  }
}

export default OutlookTransport;
