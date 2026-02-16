# 🎬 How to Get YouTube API Key (Simple Version)

This is THE EASIEST way to explain Option 2!

---

## Step 1: Go to Google Cloud Console
**Link:** https://console.cloud.google.com/

👉 Sign in with your Gmail account

---

## Step 2: Create a Project
1. Click "Select a project" dropdown at the top
2. Click "NEW PROJECT"
3. Type any name (like "YouTube App")
4. Click "CREATE"

📸 **What you'll see:** A loading screen, then your new project

---

## Step 3: Enable YouTube API
1. Click "≡" menu (top left)
2. Go to: **APIs & Services** → **Library**
3. In search box, type: **YouTube Data API v3**
4. Click on it
5. Click blue "ENABLE" button

📸 **What you'll see:** "API enabled" message

---

## Step 4: Get Your API Key
1. Click "CREATE CREDENTIALS" (top right)
2. Pick "YouTube Data API v3"
3. Pick "Public data"
4. Click "NEXT"

🎉 **You'll see your API key!** It looks like: `AIzaSyABC123...`

✅ **COPY THIS KEY** - you need it!

---

## Step 5: Add Key to Your Project

Open your `.env` file and add:

```
YOUTUBE_API_KEY=AIzaSyABC123...YourKeyHere
```

**Save the file!**

---

## Step 6: Install Package & Restart

Run these commands:

```bash
npm install @googleapis/youtube
```

Then restart your server (Ctrl+C and `npm run dev`)

---

## ✅ DONE!

Now go to your dashboard and try the YouTube Summarizer. It should work fast!

---

## 💰 Is it Free?

**YES!** You get 10,000 API units per day for FREE.

That's about **100-200 videos per day**. Plenty for most uses!

---

## 🆘 Need Visual Help?

If you get stuck, here's what each screen looks like:
- Google Cloud Console looks like a blue/white dashboard
- "APIs & Services" is in the left menu (hamburger icon ≡)
- The API key is a long string of letters and numbers

That's it! Much easier than it sounds! 🚀
