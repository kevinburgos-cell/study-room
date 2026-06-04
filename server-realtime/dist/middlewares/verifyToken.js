"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = verifyFirebaseToken;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
/**
 * Verifies a Firebase ID token using the admin SDK.
 * Returns the decoded token containing uid, name, picture, email, etc.
 */
async function verifyFirebaseToken(token) {
    if (!token) {
        throw new Error('El token de autenticación es obligatorio');
    }
    try {
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        return decodedToken;
    }
    catch (error) {
        console.error('Error in verifyFirebaseToken:', error.message || error);
        throw new Error('Token inválido o expirado');
    }
}
