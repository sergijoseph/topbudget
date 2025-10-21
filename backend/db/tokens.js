import pool from './pool.js'
import { logError, sqlResponse } from '../utils.js';

//INSERT REFRESH TOKEN INTO DATABASE
export async function createRefreshToken(refreshToken) {
    let response = new sqlResponse;

    const { hashedJti, userId, familyId, expiresAt } = refreshToken;

    try {
        const [result] = await pool.query(
            `
            INSERT INTO refresh_tokens (jti_id, user_id, family_id, expires_at)
            VALUES (?, ?, ?, ?);
            `,
            [hashedJti, userId, familyId, expiresAt])

        if (result.affectedRows !== 1) {
            logError('createRefreshToken - insert refresh token failed: ' + JSON.stringify(refreshToken))
            return response;
        } else {
            response.data = { userId: result.insertId };
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//GET REFRESH TOKEN FROM THE DATABASE
export async function getRefreshToken(jti) {
    let response = new sqlResponse;

    try {
        const [rows] = await pool.query(`SELECT 
            user_id,
            family_id,
            status,
            expires_at
            FROM refresh_tokens WHERE jti_id = ?`, [jti])

        if (!rows[0]) {
            logError('getRefreshToken - refresh token not found: ' + jti)
            return response;
        } else {
            response.data = rows[0];
            response.status = true
        }

    } catch (error) {
        logError(error)
    }

    return response;
}

//REVOKE REFRESH TOKEN IN DATABASE
export async function revokeRefreshToken(familyId) {
    let response = new sqlResponse;

    try {
        await pool.query(
            `
            UPDATE refresh_tokens
            SET status = 'revoked'
            WHERE family_id = ?
            `,
            [familyId])

        response.status = true;
    } catch (error) {
        logError(error)
    }

    return response;
}

//REVOKE REFRESH TOKEN IN DATABASE
export async function rotateRefreshTokenFam(familyId) {
    let response = new sqlResponse;

    try {
        await pool.query(
            `
            UPDATE refresh_tokens
            SET status = 'rotated'
            WHERE family_id = ?
            `,
            [familyId])

        response.status = true;
    } catch (error) {
        logError(error)
    }

    return response;
}

//ROTATE REFRESH TOKEN IN DATABASE
export async function rotateRefreshToken(jti) {
    let response = new sqlResponse;

    try {
        await pool.query(
            `
            UPDATE refresh_tokens
            SET status = 'rotated'
            WHERE jti_id = ?
            `,
            [jti])

        response.status = true;
    } catch (error) {
        logError(error)
    }

    return response;
}