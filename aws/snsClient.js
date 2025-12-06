require("dotenv").config();
const { SNSClient } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({ 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }
});

module.exports = snsClient;