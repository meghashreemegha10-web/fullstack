
# ⚠️ Fixing "403 Access Denied" Error

This error happens because your app is in **Testing mode**, and you haven't added your own email as a tester.

## Quick Fix (1 minute)

1. Go to **[OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)** 
   (Direct link: https://console.cloud.google.com/apis/credentials/consent)

2. Scroll down to the **"Test users"** section.

3. Click **+ ADD USERS**

4. Type **your own email address** (the one you are trying to log in with).

5. Click **SAVE**

---

### Now try again!

1. Click the authorization link again: [Authorize App](https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.force-ssl%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly&prompt=consent&response_type=code&client_id=38376071242-t06q2i4d4mot3p32tt00qkij03j9k5ko.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth2callback)

2. It should work now!
