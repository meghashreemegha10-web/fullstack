# 🔐 How to Get YouTube OAuth Credentials

To download captions from **any** video (including music videos), you need OAuth credentials.

---

## Step 1: Configure OAuth Consent Screen
1. Go to **[Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent)**
2. Select **External** (if asked) and click **CREATE**
3. **App Information**:
   - App name: `YouTube Caption Fetcher`
   - User support email: (Select your email)
   - Developer contact email: (Enter your email)
4. Click **SAVE AND CONTINUE**
5. **Scopes**: Click **ADD OR REMOVE SCOPES**
   - Search for `youtube.force-ssl` or just `youtube`
   - Select `.../auth/youtube.force-ssl`
   - Click **UPDATE**
   - Click **SAVE AND CONTINUE**
6. **Test Users**:
   - Click **ADD USERS**
   - Enter **YOUR own email address**
   - Click **ADD**
   - Click **SAVE AND CONTINUE**

---

## Step 2: Create OAuth Credentials
1. Go to **[Credentials](https://console.cloud.google.com/apis/credentials)** (left menu)
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Select **Web application**
4. **Name**: `Local Dev`
5. **Authorized redirect URIs**:
   - Click **ADD URI**
   - Enter: `http://localhost:3000/oauth2callback`
6. Click **CREATE**

🎉 **You will see your Client ID and Client Secret!**

---

## Step 3: Update .env File

Copy authorized key and secret to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## Step 4: Get Refresh Token (I will help you with this!)

Once you have the ID and Secret in your `.env`, I will give you a simple script to run. It will:
1. Give you a link to login
2. You login with your Google account
3. It gives you a `REFRESH_TOKEN` to add to your `.env`

**Let me know when you have added the Client ID and Secret to your .env!**
