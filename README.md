outlook-nodemailer-transport
============================

## Intro
The custom transport plugin that allows to send email using Nodemailer via [Outlook](https://learn.microsoft.com/en-us/graph/api/user-sendmail)

## Why?
With the help of the Outlook API it is possible to use the send scope and Nodemailer v4+. The plugin is very small, optimized and written in TypeScript

## Support the project
If you like to use this module please click the star button - it is very motivating.

## Quick Start
Install outlook-nodemailer-transport using [npm](https://www.npmjs.com/):

``` bash
$ npm install outlook-nodemailer-transport --save
```

## Documentation
[Nodemailer](https://nodemailer.com/message/#common-fields) common fields are supported and replyTo

## Examples

__send the simple email by the access token__
``` js
  'use strict';
  const nodemailer = require('nodemailer');
  const OutlookTransport = require('outlook-nodemailer-transport');

  let transporter = nodemailer.createTransport(new OutlookTransport({
    userId: 'my-address@outlook.com',
    auth: {
      accessToken: 'ya29.Glv5BvE5y-access-token'
    }
  }));

  transporter.sendMail({
    from: 'email@outlook.com',
    to: 'recipient@test.com',
    replyTo: 'reply-to@example.com',
    subject: 'Outlook Transport',
    text: 'This is text content'
  }).then((info) => {
    console.log('SUCCESS');
  }).catch((error) => {
    console.log('Something is wrong');
  });
```

__send the simple email, if it's failed to refresh the access token__
``` js
  'use strict';
  const nodemailer = require('nodemailer');
  const OutlookTransport = require('outlook-nodemailer-transport');

  let transporter = nodemailer.createTransport(new OutlookTransport({
    userId: 'my-address@outlook.com',
    auth: {
      clientId: 'clien-id.apps.googleusercontent.com',
      clientSecret: 'clint-secret',
      refreshToken: '1/EAATBaMn-refresh-token',
      accessToken: 'ya29.Glv5BvE5y-access-token'
    }
  }));

  transporter.sendMail({
    from: 'email@outlook.com',
    to: 'recipient@test.com',
    replyTo: 'reply-to@example.com',
    subject: 'Outlook Transport',
    text: 'This is text content'
  }).then((info) => {
    console.log('SUCCESS');
  }).catch((error) => {
    console.log('Something is wrong');
  });
```

__send an attachment and embed it to the content__
``` js
  'use strict';
  const nodemailer = require('nodemailer');
  const OutlookTransport = require('outlook-nodemailer-transport');

  let transporter = nodemailer.createTransport(new OutlookTransport({
    userId: 'my-address@outlook.com',
    auth: {
      accessToken: 'ya29.Glv5BvE5y-access-token'
    }
  }));

  transporter.sendMail({
    from: 'email@example.com',
    to: 'recipient@test.com',
    replyTo: 'reply-to@example.com',
    subject: 'Outlook Transport',
    html: '<!DOCTYPE html><html><body><img src="cid:attachment" alt="attachment"></body></html>',
    attachments: [{
      content: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAA...', // base64 content
      cid: 'attachment',
      contentType: 'image/jpeg',
      filename: 'attachment.jpg',
      encoding: 'base64'
    }]
  }).then((info) => {
    console.log('SUCCESS');
  }).catch((error) => {
    console.log('Something is wrong');
  });
```

## License

[MIT](./LICENSE)
