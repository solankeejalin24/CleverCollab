import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { auth, currentUser } from "@clerk/nextjs/server";

// Create a transporter for sending emails
let transporter: nodemailer.Transporter;

// Try to create a transporter based on environment configuration
try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'arya.narke@gmail.com', // Replace with your Gmail account
      pass: process.env.EMAIL_PASSWORD,
    }
  });
} catch (error) {
  console.error('Failed to create email transporter:', error);
  // We'll handle the error in the POST handler
}

// Add a helper to send an email using a mock for testing if needed
async function sendEmail(options: nodemailer.SendMailOptions): Promise<boolean> {
  try {
    if (!transporter && process.env.NODE_ENV === 'development') {
      // For development, log the email and pretend it was sent
      console.log('EMAIL WOULD BE SENT:', options);
      return true;
    } else if (!transporter) {
      throw new Error('Email transporter not configured');
    }
    
    await transporter.sendMail(options);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the current user's information
    const user = await currentUser();
    if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get user's email address
    const userEmail = user.emailAddresses[0].emailAddress;
    const userName = user.firstName || user.lastName || user.username || 'User';

    // Parse the request body
    const { messages, subject = 'CleverCollab Chat Transcript' } = await req.json();

    // Format the chat transcript for email
    const htmlContent = formatChatTranscript(messages, userName);
    const textContent = formatPlainTextTranscript(messages);

    // Send the email
    const mailOptions = {
      from: `"CleverCollab" <${process.env.EMAIL_USER || 'your.email@gmail.com'}>`,
      to: userEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const emailSent = await sendEmail(mailOptions);
    
    if (!emailSent) {
      // If email sending fails but we're in development, we can still return success
      // since we logged the email content in the sendEmail helper
      if (process.env.NODE_ENV === 'development') {
        console.log('Email would be sent in production. Returning success for development.');
        return NextResponse.json({ 
          success: true,
          message: 'Email content logged (not actually sent in development)'
        });
      }
      
      throw new Error('Failed to send email');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Format the chat transcript as HTML for email
function formatChatTranscript(messages: any[], userName: string) {
  const currentDate = new Date().toLocaleString();
  
  // Helper function to convert markdown to HTML
  const markdownToHtml = (text: string) => {
    // Fix multiple consecutive line breaks and reduce to max double line break
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Replace headers
    text = text.replace(/### (.*?)\n/g, '<h3 style="margin-top: 20px; margin-bottom: 10px; font-size: 18px; font-weight: bold; color: #333;">$1</h3>\n');
    text = text.replace(/## (.*?)\n/g, '<h2 style="margin-top: 25px; margin-bottom: 10px; font-size: 20px; font-weight: bold; color: #333;">$1</h2>\n');
    text = text.replace(/# (.*?)\n/g, '<h1 style="margin-top: 30px; margin-bottom: 15px; font-size: 24px; font-weight: bold; color: #333;">$1</h1>\n');
    
    // Handle consecutive empty lines better
    text = text.replace(/\n\n+/g, '\n\n');
    
    // Replace bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #333;">$1</strong>');
    
    // Replace italic
    text = text.replace(/\*(.*?)\*/g, '<em style="color: #333;">$1</em>');
    
    // Process lists - first identify list blocks
    const listBlocks: { start: number, end: number, type: 'ul' | 'ol' }[] = [];
    let inList = false;
    let listStartIndex = -1;
    let listType: 'ul' | 'ol' = 'ul';
    
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isUnorderedListItem = /^- (.*)$/.test(line);
      const isOrderedListItem = /^\d+\. (.*)$/.test(line);
      
      if (isUnorderedListItem || isOrderedListItem) {
        if (!inList) {
          // Start of a new list
          inList = true;
          listStartIndex = i;
          listType = isUnorderedListItem ? 'ul' : 'ol';
        }
      } else if (inList && line.trim() === '') {
        // End of the list with an empty line
        listBlocks.push({ start: listStartIndex, end: i - 1, type: listType });
        inList = false;
      }
    }
    
    // If a list continues to the end without an empty line
    if (inList) {
      listBlocks.push({ start: listStartIndex, end: lines.length - 1, type: listType });
    }
    
    // Process lists from bottom to top to avoid index shifting
    for (let i = listBlocks.length - 1; i >= 0; i--) {
      const { start, end, type } = listBlocks[i];
      
      // Convert list items
      for (let j = start; j <= end; j++) {
        if (type === 'ul') {
          lines[j] = lines[j].replace(/^- (.*)$/, '<li style="margin-bottom: 8px; color: #333;">$1</li>');
        } else {
          lines[j] = lines[j].replace(/^\d+\. (.*)$/, '<li style="margin-bottom: 8px; color: #333;">$1</li>');
        }
      }
      
      // Add list tags
      const listStyle = type === 'ul' 
        ? 'style="margin: 15px 0; padding-left: 20px; color: #333;"' 
        : 'style="margin: 15px 0; padding-left: 25px; color: #333;"';
        
      lines.splice(end + 1, 0, `</${type}>`);
      lines.splice(start, 0, `<${type} ${listStyle}>`);
    }
    
    text = lines.join('\n');
    
    // Convert task descriptions with colons to styled paragraphs
    text = text.replace(/^([A-Za-z ]+):\s*(.*?)$/gm, '<p style="margin: 5px 0;"><strong style="color: #333;">$1:</strong> <span style="color: #333;">$2</span></p>');
    
    // Replace code blocks
    text = text.replace(/```(.*?)\n([\s\S]*?)```/g, 
      '<pre style="background-color: #f5f5f5; padding: 12px; border-radius: 5px; overflow-x: auto; margin: 15px 0; color: #333;"><code>$2</code></pre>');
    
    // Replace inline code
    text = text.replace(/`([^`]+)`/g, 
      '<code style="background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: monospace; color: #333;">$1</code>');
    
    // Replace horizontal rules
    text = text.replace(/---/g, '<hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;">');
    
    // Replace links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #0366d6; text-decoration: none;">$1</a>');
    
    // Wrap paragraphs that aren't already in HTML tags
    const wrappedLines = [];
    const htmlTagPattern = /<\/?[a-z][\s\S]*?>/i;
    
    for (const line of text.split('\n')) {
      if (line.trim() === '') {
        wrappedLines.push('');
      } else if (htmlTagPattern.test(line)) {
        wrappedLines.push(line);
      } else {
        wrappedLines.push(`<p style="margin: 10px 0; color: #333;">${line}</p>`);
      }
    }
    
    text = wrappedLines.join('\n');
    
    // Fix empty paragraphs
    text = text.replace(/<p style="[^"]*"><\/p>/g, '<br>');
    
    // Fix double spacing
    text = text.replace(/(<br>\s*){3,}/g, '<br><br>');
    
    return text;
  };
  
  const messagesList = messages.map(message => {
    if (message.role === 'user') {
      return `
        <div style="margin-bottom: 20px;">
          <div style="font-weight: bold; margin-bottom: 5px; color: #333;">${userName}:</div>
          <div style="background-color: #f0f0f0; border-radius: 10px; padding: 15px; color: #333;">${message.content}</div>
        </div>
      `;
    } else {
      return `
        <div style="margin-bottom: 20px;">
          <div style="font-weight: bold; margin-bottom: 5px; color: #333;">AI Assistant:</div>
          <div style="background-color: #e6f7ff; border-radius: 10px; padding: 15px; color: #333;">
            ${markdownToHtml(message.content)}
          </div>
        </div>
      `;
    }
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .container { 
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px; 
          background-color: #fff;
        }
        .header { 
          margin-bottom: 30px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        .header h2 {
          color: #333;
          margin-top: 0;
        }
        .footer { 
          margin-top: 30px; 
          font-size: 12px; 
          color: #666; 
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        strong { font-weight: bold; color: #333; }
        h1, h2, h3, h4 { font-weight: bold; color: #333; margin-top: 15px; margin-bottom: 10px; }
        ul, ol { margin: 10px 0 10px 20px; padding-left: 15px; }
        li { margin-bottom: 5px; color: #333; }
        p { margin: 10px 0; color: #333; }
        code, pre { color: #333; }
        a { color: #0366d6; }
      </style>
    </head>
    <body style="color: #333;">
      <div class="container">
        <div class="header">
          <h2>CleverCollab Chat Transcript</h2>
          <p>Generated on: ${currentDate}</p>
        </div>
        
        <div class="chat-messages">
          ${messagesList}
        </div>
        
        <div class="footer">
          <p>This is an automated email from CleverCollab. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Format the chat transcript as plain text for email
function formatPlainTextTranscript(messages: any[]) {
  const currentDate = new Date().toLocaleString();
  
  const header = `CleverCollab Chat Transcript\nGenerated on: ${currentDate}\n\n`;
  
  const messagesList = messages.map(message => {
    const sender = message.role === 'user' ? 'You' : 'AI Assistant';
    // Add separator line between messages
    return `${sender}:\n${message.content}\n\n${'─'.repeat(50)}\n\n`;
  }).join('');
  
  const footer = 'This is an automated email from CleverCollab. Please do not reply to this email.';
  
  return header + messagesList + footer;
} 