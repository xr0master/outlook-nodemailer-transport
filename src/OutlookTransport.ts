import type { SentMessageInfo, Transport } from 'nodemailer';
import type { Options as OAuth2Options } from 'nodemailer/lib/xoauth2';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';

import { post, postJSON } from './services/Requestly';
import { buildData } from './models/Outlook';

type DoneCallback = (err: Error | null, info?: SentMessageInfo) => void;

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

interface OutlookError {
  error_description: string;
  error: {
    code: string;
    message: string;
    innerError: Object;
  };
}

function getErrorCode(error: OutlookError['error']): string {
  return typeof error === 'object' && error !== null ? error.code : '';
}

function createError(error: string): Error {
  if (!error) return new Error('Please check your account');

  return new Error(error);
}

interface OAuth2 {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
}

export class OutlookTransport implements Transport {
  public name: string = 'OutlookTransport';
  public version: string = 'N/A';

  constructor(private options: Options) {}

  private getAccessToken(): Promise<Pick<OAuth2, 'access_token' | 'refresh_token'>> {
    return post<OAuth2>(
      {
        protocol: 'https:',
        hostname: 'login.microsoftonline.com',
        path: '/common/oauth2/v2.0/token',
      },
      refreshTokenParams(this.options.auth),
    ).then((data) => {
      if (typeof data === 'string') {
        return Promise.reject(data);
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
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

      const outlookData = buildData(data);

      this.sendMail(outlookData, this.options.auth.accessToken!).then(
        (message) => {
          done(null, {
            envelope: mail.message.getEnvelope(),
            messageId: mail.message.messageId(),
            accessToken: this.options.auth.accessToken!,
            message: message,
          });
        },
        (err) => {
          if (
            getErrorCode(err.error) === 'InvalidAuthenticationToken' &&
            this.options.auth.refreshToken
          ) {
            this.getAccessToken()
              .then((tokens: Pick<OAuth2, 'access_token' | 'refresh_token'>) => {
                this.sendMail(outlookData, tokens.access_token).then(
                  (message) => {
                    done(null, {
                      envelope: mail.message.getEnvelope(),
                      messageId: mail.message.messageId(),
                      accessToken: tokens.access_token!,
                      message: message,
                    });
                  },
                  (err) => done(createError(err)),
                );
              })
              .catch((err) => done(createError(err)));
          } else {
            done(createError(err));
          }
        },
      );
    });
  }
}

export default OutlookTransport;
