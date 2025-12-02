import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const issues = [];
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (!process.env.OPENAI_API_KEY) {
    issues.push('Missing OPENAI_API_KEY');
  }
  
  // Test Supabase connection
  let supabaseStatus = 'Unknown';
  try {
    const { supabase } = await import('@/app/lib/supabase');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await supabase.from('interviews').select('count').limit(1);
    if (error) {
      supabaseStatus = `Error: ${error.message}`;
      issues.push(`Supabase: ${error.message}`);
    } else {
      supabaseStatus = 'Connected ✓';
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    supabaseStatus = `Failed: ${err.message}`;
    issues.push(`Supabase connection failed: ${err.message}`);
  }
  
  // Test OpenAI
  let openaiStatus = 'Unknown';
  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    await openai.models.list();
    openaiStatus = 'Connected ✓';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    openaiStatus = `Failed: ${err.message}`;
    issues.push(`OpenAI: ${err.message}`);
  }
  
  return NextResponse.json({
    status: issues.length === 0 ? 'All systems operational' : 'Issues detected',
    checks: {
      supabase: supabaseStatus,
      openai: openaiStatus,
    },
    issues: issues.length > 0 ? issues : ['None'],
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✓' : 'Missing ✗',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✓' : 'Missing ✗',
      openaiKey: process.env.OPENAI_API_KEY ? 'Set ✓' : 'Missing ✗',
    }
  });
}