import { post, postRFC822 } from './Requestly';

it('should send post request', () => {
  const request = post<{ form: { user_id: string } }>(
    {
      protocol: 'https:',
      hostname: 'httpbin.org',
      path: '/post',
    },
    {
      user_id: 'test',
    },
  );

  return expect(request).resolves.toBeDefined();
});

it('should send post RFC822 request', () => {
  const request = postRFC822(
    {
      protocol: 'https:',
      hostname: 'httpbin.org',
      path: '/post',
    },
    'test',
  );

  return expect(request).resolves.toBeDefined();
});
