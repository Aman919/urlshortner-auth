import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
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
    
if (event.httpMethod==="POST"){
     try{
        if(!event.body){
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({message: "Missing request body"})
            }
        }

        const body:Record<string,string> = JSON.parse(event.body);
        const {originalUrl} = body

        if(!originalUrl){
            return{
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({message: "Invalid url"})
            }
        }

        const shortId = uuid().replace(/-/g,'').slice(0, 8);
        const shortUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}/short/${shortId}`;

        await ddbDocClient.send(
            new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                shortId,
                originalUrl
            },
        })
    );

        return{
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({shortUrl})
        }
    
    
    }catch(error){
        return{
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({message: "Internal Server Error from post"})
        }
    }
}
return{
    statusCode:405,
    body: JSON.stringify({error: "method not allowed"})
}   
}
