
import { google } from 'googleapis';
import { createInterface } from 'readline';
import dotenv from 'dotenv';
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
);

const scopes = [
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.readonly'
];

const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Crucial for getting a refresh token
    scope: scopes,
    prompt: 'consent' // Forces consent screen to ensure refresh token is returned
});

console.log('Authorize this app by visiting this url:');
console.log(url);

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('\nEnter the code from that page here: ', async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\nSuccessfully retrieved tokens!');
        console.log('\nAdd this to your .env file:');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);

        if (!tokens.refresh_token) {
            console.warn('\n⚠️ No refresh token returned! Did you use "prompt: consent"? (Yes, I did properly set it in the code)');
        }
    } catch (e) {
        console.error('Error retrieving access token', e);
    }
    rl.close();
});
