# Setting Up Gmail for CleverCollab Email Feature

This guide will walk you through the process of setting up a Gmail account to send emails from the CleverCollab application.

## Step 1: Create or Use an Existing Gmail Account

You can either create a new Gmail account specifically for your application or use an existing one. 

**Note**: It's recommended to use a dedicated email for your application rather than your personal email.

## Step 2: Enable 2-Step Verification

Google requires 2-Step Verification to be enabled before you can create app passwords:

1. Sign in to your Google Account
2. Go to your [Google Account security settings](https://myaccount.google.com/security)
3. Under "Signing in to Google," select "2-Step Verification"
4. Follow the on-screen steps to turn on 2-Step Verification

## Step 3: Generate an App Password

Once 2-Step Verification is enabled:

1. Go to your [Google Account security settings](https://myaccount.google.com/security)
2. Under "Signing in to Google," select "App passwords"
3. At the bottom, select "Select app" and choose "Other (Custom name)"
4. Enter "CleverCollab" as the name
5. Click "Generate"
6. A 16-character app password will be shown. **Copy this password**
7. Click "Done"

## Step 4: Configure Your Environment Variables

Add the following to your `.env.local` file:

```
EMAIL_SERVER=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.gmail.account@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
```

Replace `your.gmail.account@gmail.com` with your actual Gmail address and `your_16_character_app_password` with the app password you generated.

## Step 5: Test the Feature

1. Start your application
2. Sign in with your user account
3. Open the chat interface
4. Send a few messages to the chatbot
5. Click the mail icon in the top right corner
6. Check your user account's email for the chat transcript

## Troubleshooting

If you encounter issues:

1. **Authentication Errors**:
   - Double-check your app password - it must be exactly as provided by Google
   - Make sure you're using the correct Gmail address
   - Try generating a new app password

2. **Email Not Being Delivered**:
   - Check your spam folder
   - Verify the recipient email address is correct
   - Check server logs for any error messages

3. **Rate Limiting**:
   - Gmail has sending limits (500 emails per day for regular accounts)
   - If you need to send more, consider upgrading to Google Workspace or using a service like SendGrid

## Security Considerations

- Keep your app password secure and never commit it to your codebase
- Regularly rotate your app password for security
- The app password gives access to your Gmail account, so use a dedicated account if possible 