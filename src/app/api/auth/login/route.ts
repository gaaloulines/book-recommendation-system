import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const token = await login(username, password);
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}