import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';

interface PolicyResponse extends APIGatewayAuthorizerResult{
    principalId: string;
    policyDocument?: {
        Version: string;
        Statement: Array<{
            Action: string;
            Effect: string;
            Resource: string
        }>;
    };
}

export const lambdaHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<PolicyResponse> => {
  
    const token = event.authorizationToken.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  let decoded;

  try {
    decoded = jwt.verify(token, secret) as {sub:string};

    return generatePolicy(decoded.sub, 'Allow', event.methodArn);

  } catch (error) {
    console.error("JWT Verification Failed:", error);
    return generatePolicy(decoded?.sub || '', 'Deny', event.methodArn);
  }
};

const generatePolicy = (principalId:string, effect:string, resource:string): PolicyResponse => {
  const authResponse:PolicyResponse = {principalId};
//   authResponse.principalId = principalId;
  if (effect && resource) {
    authResponse.policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    };
  }
  return authResponse;
};