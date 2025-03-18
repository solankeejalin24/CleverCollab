# CleverCollab Email Feature

The CleverCollab application includes an email feature that allows users to send their chat transcripts to their registered email address. This feature helps users keep a record of important conversations with the AI assistant without requiring permanent storage in the database.

## How It Works

1. A "Send Email" button (envelope icon) appears in the top right of the chat interface
2. When clicked, the system generates an email containing the full chat transcript
3. The email is sent from `narkean@mail.uc.edu` to the user's registered email address
4. Users receive a formatted email with all messages from the current chat session

## Setup Instructions

To enable the email functionality, you need to configure the email settings in your environment variables:

1. Add the following variables to your `.env.local` file:

```
EMAIL_SERVER=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=narkean@mail.uc.edu
EMAIL_PASSWORD=your_outlook_password
```

2. For `EMAIL_PASSWORD`:
   - Use your regular Outlook/Microsoft account password
   - You might need to enable "Less secure apps" in your Microsoft account settings
   - If you have two-factor authentication enabled, you'll need to generate an "app password" from your Microsoft account security settings

### For University Office 365 Accounts

If you're using a university-managed Office 365 account:
1. Check with your university IT department about SMTP access restrictions
2. You may need special permission to use SMTP with your university account
3. In some cases, the university may have a dedicated SMTP relay service you should use instead

## Security Considerations

- The email feature only works for authenticated users
- Users can only send emails to their own registered email address
- No chat data is stored on the server; it's transmitted directly from the client to the email service
- App passwords are more secure than your main account password for programmatic access

## Troubleshooting

If emails are not being sent:

1. Check that all environment variables are set correctly
2. Ensure the email account has SMTP access enabled
3. Verify that the app password is correct
4. Check server logs for any authentication or transport errors
5. Make sure the user has a valid email address in their Clerk profile

## Need Help?

If you encounter any issues with the email feature, please contact the development team or check the server logs for detailed error messages.

### Development Mode

When running in development mode (`NODE_ENV=development`), the application includes a fallback that will log email content to the console instead of attempting to send actual emails if there are any configuration issues. This allows you to test the email feature without needing to set up a real email server.

To see the email content:
1. Check your terminal/console logs
2. Look for messages labeled `EMAIL WOULD BE SENT:` 
3. The full email content including recipients, subject, and body will be displayed

This fallback only applies in development mode. In production, actual email configuration is required.

## Alternative Email Solutions

If you encounter persistent issues with your institutional email account:

1. **Use a third-party email service**:
   - SendGrid - https://sendgrid.com/ (offers a free tier)
   - Mailgun - https://www.mailgun.com/ (offers a free tier)
   - Amazon SES - https://aws.amazon.com/ses/ (very low cost)

2. **Use a personal Gmail account with app passwords**:
   - Create a new Gmail account specifically for the application
   - Enable 2FA and generate an app password
   - Update configuration to use Gmail SMTP:
     ```
     EMAIL_SERVER=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your.email@gmail.com
     EMAIL_PASSWORD=your_app_password
     ``` 