import { post, postJSON } from './Requestly';

interface HTTPBin {
  form?: {
    id: string;
  };
  json?: {
    id: string;
  };
}

it('should send post request', async () => {
  return post<HTTPBin>(
    {
      protocol: 'https:',
      hostname: 'httpbin.org',
      path: '/post',
    },
    {
      id: 'test',
    },
  ).then(
    (data) => {
      expect((data as HTTPBin).form!.id).toBeDefined();
    },
    (error) => {
      throw error;
    },
  );
});

it('should send the JSON request', async () => {
  return postJSON<HTTPBin>(
    {
      protocol: 'https:',
      hostname: 'httpbin.org',
      path: '/post',
    },
    {
      id: 'test',
    },
  ).then(
    (data) => {
      expect((data as HTTPBin).json!.id).toBeDefined();
    },
    (error) => {
      throw error;
    },
  );
});
