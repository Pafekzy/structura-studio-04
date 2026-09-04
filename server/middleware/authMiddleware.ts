import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken, isFirebaseAdminAvailable } from '../auth/firebaseAdmin';
import { userService } from '../services/userService';
import { UserProfile, PrimaryRole } from '../repositories/userRepository';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  authProvider: 'firebase' | 'sandbox';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userProfile?: UserProfile | null;
    }
  }
}

// In-memory token session cache for server sandbox development mode
export interface SandboxSession {
  uid: string;
  email: string;
  createdAt: number;
  expiresAt: number; // 24-hour expiry
}

export const sandboxSessionStore = new Map<string, SandboxSession>();

// Pre-seed canonical development sandbox sessions for the four demo roles
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
sandboxSessionStore.set('demo_sess_owner', {
  uid: 'usr_demo_owner',
  email: 'owner@structura.build',
  createdAt: Date.now(),
  expiresAt: Date.now() + ONE_YEAR_MS,
});
sandboxSessionStore.set('demo_sess_director', {
  uid: 'usr_demo_director',
  email: 'director@structura.build',
  createdAt: Date.now(),
  expiresAt: Date.now() + ONE_YEAR_MS,
});
sandboxSessionStore.set('demo_sess_contractor', {
  uid: 'usr_demo_contractor',
  email: 'contractor@structura.build',
  createdAt: Date.now(),
  expiresAt: Date.now() + ONE_YEAR_MS,
});
sandboxSessionStore.set('demo_sess_qaqc', {
  uid: 'usr_demo_qaqc',
  email: 'auditor@structura.build',
  createdAt: Date.now(),
  expiresAt: Date.now() + ONE_YEAR_MS,
});

export function getAuthMode(): 'firebase' | 'sandbox' {
  if (process.env.STRUCTURA_AUTH_MODE === 'firebase') return 'firebase';
  if (process.env.STRUCTURA_AUTH_MODE === 'sandbox') return 'sandbox';
  return isFirebaseAdminAvailable() ? 'firebase' : 'sandbox';
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header. Expected Bearer token.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Empty Bearer token provided.',
      code: 'INVALID_TOKEN',
    });
  }

  const mode = getAuthMode();

  // Part A2: If STRUCTURA_AUTH_MODE is 'firebase', reject sandbox tokens unconditionally
  if (mode === 'firebase' && (token.startsWith('sb_sess_') || token.startsWith('demo_sess_'))) {
    return res.status(401).json({
      error: 'Unauthorized: Sandbox session tokens are strictly forbidden when STRUCTURA_AUTH_MODE=firebase.',
      code: 'SANDBOX_DISABLED_IN_FIREBASE_MODE',
    });
  }

  // 1. If in Sandbox mode and token is a Developer Sandbox session token
  if (token.startsWith('sb_sess_') || token.startsWith('demo_sess_')) {
    const session = sandboxSessionStore.get(token);
    if (session) {
      // Check session expiration (Part A4)
      if (Date.now() > session.expiresAt) {
        sandboxSessionStore.delete(token);
        return res.status(401).json({
          error: 'Unauthorized: Developer sandbox session has expired. Please log in again.',
          code: 'SESSION_EXPIRED',
        });
      }

      req.user = {
        uid: session.uid,
        email: session.email,
        authProvider: 'sandbox',
      };
      try {
        req.userProfile = await userService.getProfileByAuthUserId(session.uid);
      } catch {
        req.userProfile = null;
      }
      return next();
    } else {
      return res.status(401).json({
        error: 'Unauthorized: Developer sandbox session not found or revoked.',
        code: 'INVALID_SANDBOX_SESSION',
      });
    }
  }

  // 2. If Firebase Admin is available, attempt cryptographic verification of Firebase ID token
  if (isFirebaseAdminAvailable()) {
    try {
      const decoded = await verifyFirebaseToken(token);
      if (decoded) {
        req.user = {
          uid: decoded.uid,
          email: decoded.email || '',
          authProvider: 'firebase',
        };
        req.userProfile = await userService.getProfileByAuthUserId(decoded.uid);
        return next();
      }
    } catch (e) {
      console.warn('[requireAuth] Firebase token verification error:', e);
      return res.status(401).json({
        error: 'Unauthorized: Invalid Firebase authentication token.',
        code: 'FIREBASE_TOKEN_INVALID',
      });
    }
  }

  return res.status(401).json({
    error: 'Unauthorized: Provided token could not be verified.',
    code: 'TOKEN_VERIFICATION_FAILED',
  });
}

// Role-based authorization middleware foundation
export function requireRole(allowedRoles: PrimaryRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    if (!req.userProfile) {
      return res.status(403).json({ 
        error: 'Forbidden: Structura user profile has not been initialized for this account',
        code: 'PROFILE_NOT_FOUND' 
      });
    }

    if (!allowedRoles.includes(req.userProfile.primaryRole)) {
      return res.status(403).json({
        error: `Forbidden: Required role [${allowedRoles.join(', ')}], current role is [${req.userProfile.primaryRole}]`,
        code: 'INSUFFICIENT_ROLE_PERMISSIONS',
      });
    }

    return next();
  };
}
