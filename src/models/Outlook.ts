import type { SendMailOptions } from 'nodemailer';
import type { Address } from 'nodemailer/lib/mailer';

interface EmailAddress {
  emailAddress: Address;
}

interface Attachment {
  '@odata.type': '#microsoft.graph.fileAttachment';
  contentType: string;
  name: string;
  contentBytes: string;
  contentId: string;
}

const getAddress = (address: Address): EmailAddress => {
  return {
    emailAddress: address,
  };
};

const getAddressCollection = (addresses: Address[] = []): EmailAddress[] => {
  return addresses.map(getAddress);
};

const appendAttachments = (data: SendMailOptions): Attachment[] => {
  if (!Array.isArray(data.attachments)) return [];

  return data.attachments.map<Attachment>((attachment) => {
    return {
      '@odata.type': '#microsoft.graph.fileAttachment',
      contentId: attachment.cid!,
      name: attachment.filename as string,
      contentType: attachment.contentType!,
      contentBytes: attachment.content as string,
    };
  });
};

export const buildData = (data: SendMailOptions) => {
  return {
    message: {
      subject: data.subject,
      body: {
        contentType: 'HTML',
        content: data.html,
      },
      from: getAddress(data.from as Address),
      toRecipients: getAddressCollection(data.to as Address[]),
      ccRecipients: getAddressCollection((data.cc || []) as Address[]),
      bccRecipients: getAddressCollection((data.bcc || []) as Address[]),
      replyTo: getAddressCollection((data.replyTo || []) as Address[]),
      attachments: appendAttachments(data),
    },
  };
};
