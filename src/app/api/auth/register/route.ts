import { NextResponse } from 'next/server';
import { register } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const token = await register(username, password);
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}