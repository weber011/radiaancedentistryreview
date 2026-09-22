import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, action, newPassword } = body;

    if (action === 'change_password') {
      const currentPassword = body.currentPassword;
      if (!currentPassword || !db.verifyAdminPassword(currentPassword)) {
        return NextResponse.json({ error: 'Current password incorrect' }, { status: 401 });
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }
      db.updateAdminPassword(newPassword);
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // Standard login action
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const isValid = db.verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, authenticated: true });
    // Set secure cookie
    response.cookies.set('radiaance_admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Check auth status
  const sessionCookie = request.cookies.get('radiaance_admin_session')?.value;
  const adminHeader = request.headers.get('x-admin-password');

  if (sessionCookie === 'authenticated' || (adminHeader && db.verifyAdminPassword(adminHeader))) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('radiaance_admin_session');
  return response;
}
