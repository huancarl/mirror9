import { withIronSession } from 'next-iron-session';

export function withSession(handler) {
  const secret = process.env.SECRET_COOKIE_PASSWORD;

  if (!secret) {
    throw new Error('SECRET_COOKIE_PASSWORD must be set');
  }

  return withIronSession(handler, {
    password: secret,
    cookieName: 'next-iron-session/examples/next.js',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  });
}