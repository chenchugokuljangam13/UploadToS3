import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lambdaHandler } from '../../file-upload/app';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({})
  })),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://presigned-url.com')
}));

// Base event template
const event: APIGatewayProxyEvent = {
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'GET',
  isBase64Encoded: false,
  path: '',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: '',
    apiId: '',
    authorizer: undefined,
    protocol: '',
    httpMethod: 'GET',
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: '',
      user: null,
      userAgent: null,
      userArn: null
    },
    path: '',
    stage: '',
    requestId: '',
    requestTimeEpoch: 0,
    resourceId: '',
    resourcePath: ''
  },
  resource: ''
};

describe('lambdaHandler', () => {
  beforeEach(() => {
    process.env.BUCKET_NAME = 'test-bucket';
  });

  test('return 400 if fileName is missing', async () => {
    event.queryStringParameters = { fileType: 'video/mp4' };
    const result = await lambdaHandler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Missing fileName');
  });

  test('return 400 if fileType is missing', async () => {
    event.queryStringParameters = { fileName: 'test.mp4' };
    const result = await lambdaHandler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Missing fileType');
  });

  test('return 200 and a presigned URL', async () => {
    event.queryStringParameters = {
      fileName: 'test.mp4',
      fileType: 'video/mp4'
    };
    const result = await lambdaHandler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).uploadUrl).toBe('https://presigned-url.com');
  });

  test('return 500 if an error occurs while generating signed URL', async () => {
    (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('Simulated failure'));
    event.queryStringParameters = {
      fileName: 'test.mp4',
      fileType: 'video/mp4'
    };

    const result = await lambdaHandler(event);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('some error happened');
  });
});
