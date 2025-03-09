import { NextResponse } from 'next/server';
import axios from 'axios';
import { serverEnv } from '@/lib/env';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueKey = searchParams.get('issueKey');
    
    if (!issueKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: issueKey' },
        { status: 400 }
      );
    }
    
    console.log('Testing Jira API for issue:', issueKey);
    
    // Get the base URL
    const baseUrl = serverEnv.JIRA_BASE_URL || '';
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: 'Jira base URL is not configured' },
        { status: 500 }
      );
    }
    
    // Get the base URL without the search endpoint
    const apiBase = baseUrl.includes('/search') 
      ? baseUrl.substring(0, baseUrl.lastIndexOf('/search'))
      : baseUrl;
    
    // Get transitions
    const transitionsUrl = `${apiBase}/issue/${issueKey}/transitions`;
    console.log('Getting transitions from:', transitionsUrl);
    
    const transitionsResponse = await axios.get(
      transitionsUrl,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        auth: {
          username: serverEnv.JIRA_USER || '',
          password: serverEnv.JIRA_API_TOKEN || '',
        },
      }
    );
    
    const transitions = transitionsResponse.data.transitions || [];
    
    // Try to execute the first transition
    if (transitions.length > 0) {
      const firstTransition = transitions[0];
      console.log(`Trying to execute transition: ${firstTransition.name} (${firstTransition.id})`);
      
      try {
        const updateResponse = await axios.post(
          transitionsUrl,
          {
            transition: {
              id: firstTransition.id
            }
          },
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            auth: {
              username: serverEnv.JIRA_USER || '',
              password: serverEnv.JIRA_API_TOKEN || '',
            },
          }
        );
        
        console.log('Transition executed successfully');
        
        return NextResponse.json({
          success: true,
          issue: issueKey,
          transitions: transitions.map(t => ({
            id: t.id,
            name: t.name,
            to: t.to ? t.to.name : 'Unknown'
          })),
          executedTransition: {
            id: firstTransition.id,
            name: firstTransition.name
          },
          updateResponse: {
            status: updateResponse.status,
            statusText: updateResponse.statusText
          }
        });
      } catch (updateError: any) {
        console.error('Error executing transition:', updateError);
        
        return NextResponse.json({
          success: false,
          issue: issueKey,
          transitions: transitions.map(t => ({
            id: t.id,
            name: t.name,
            to: t.to ? t.to.name : 'Unknown'
          })),
          error: updateError.message,
          response: updateError.response ? {
            status: updateError.response.status,
            statusText: updateError.response.statusText,
            data: updateError.response.data
          } : 'No response'
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        issue: issueKey,
        error: 'No transitions available for this issue'
      });
    }
  } catch (error: any) {
    console.error('Error in Jira test API:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response'
    }, { status: 500 });
  }
} 