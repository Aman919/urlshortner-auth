import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || '';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    };

    if (event.httpMethod === 'GET') {
        try {
            const shortId = event.pathParameters?.shortId;

            if (!shortId) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Missing short URL ID' }),
                };
            }

            const result = await ddbDocClient.send(
                new GetCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        shortId
                    },
                }),
            );

            if (!result.Item?.originalUrl) {
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Short URL not found' }),
                };
            }
            console.log('result', result);

            return {
                statusCode: 302,
                headers: {
                    Location: result.Item.originalUrl,
                    ...corsHeaders,
                },
                body: '',
            };
        } catch (error) {
            console.error('Error:', error);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Internal server error from get' }),
            };
        }
    }
    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'method not allowed' }),
    };
};
