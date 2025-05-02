import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
const client = new S3Client({ region: "us-east-1" });

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // calls the getSignedUrlToUpload to generate the presigned url to upload object
    const result = await getSignedUrlToUpload(event);
    return result
}

async function getSignedUrlToUpload(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const fileName = event?.queryStringParameters?.fileName;
        const fileType = event?.queryStringParameters?.fileType;
        // if fileName is not given in query parameters it will throw error
        if (!fileName) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Missing fileName'
                })
            };
        }
        // if fileType is not given in query parameters it will throw error
        if (!fileType) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Missing fileType'
                })
            };
        }
        // this store the parameters to get signed url to perform put object 
        const params = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: fileName,
            ContentType: fileType
        });
        // console.log(params)
        // this will create presignedUrl
        const signedUrl = await getSignedUrl(client, params, { expiresIn: 3600 });
        return {
            statusCode: 200,
            body: JSON.stringify({
                uploadUrl: signedUrl
            })
        };
    // for error handling 
    } catch (err) {
        // console.error('Error generating signed URL:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
