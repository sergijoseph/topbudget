import jwt from 'jsonwebtoken'
import ms from 'ms'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  NODE_ENV,
  AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY,
  AWS_SES_REGION,
  EMAIL_SENDER
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

export async function sendEmail({ toEmail, subject, htmlBody, textBody }) {
  const SES_CONFIG = {
    credentials: {
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    },
    region: AWS_SES_REGION
  }

  const sesClient = new SESClient(SES_CONFIG)

  const emailParams = {
    Destination: {
      ToAddresses: [toEmail]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: htmlBody
        },
        Text: {
          Charset: "UTF-8",
          Data: textBody
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject
      }
    },
    ReplyToAddresses: [],
    Source: EMAIL_SENDER
  };

  try {
    const sendEmailCommand = new SendEmailCommand(emailParams)
    await sesClient.send(sendEmailCommand)

    return true

  } catch (error) {
    return false
  }

}