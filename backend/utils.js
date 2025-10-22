import jwt from 'jsonwebtoken'
import ms from 'ms'
import nodemailer from 'nodemailer'

const {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  NODE_ENV,
  EMAIL_SENDER,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USERNAME,
  SMTP_PASSWORD
} = process.env
const IS_PROD = NODE_ENV === 'production';

export class sqlResponse {
  constructor(status = false, data = {}, error = '') {
    this.status = status,
      this.data = data,
      this.error = error
  }
}

export function logError(error) {
  console.log("Log Error: ", error)
}

export function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email);
}

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

export function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: IS_PROD,               // true in production (HTTPS)
    sameSite: IS_PROD ? "none" : "lax",            // helps CSRF prevention
    path: '/',         // cookie only sent to refresh endpoint
    maxAge: ms(REFRESH_TOKEN_TTL),
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    path: '/',
  });
}

export function verifyAccessToken(req, res, next) {
  const auth = req.headers.authorization || '';

  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Unauthorized - No Token' });

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized - Failed to verify' });
  }
}

// Create a transporter for SMTP
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

export async function sendEmail(emailDetails) {

  const emailInfo = {
    from: EMAIL_SENDER,
    ...emailDetails
  }

  try {
    const email = await transporter.sendMail(emailInfo)

    return true

  } catch (error) {
    logError(error)
    return false

  }

}