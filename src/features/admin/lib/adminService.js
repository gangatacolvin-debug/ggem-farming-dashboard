import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { collection, getDocs, getDoc, setDoc, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '@/lib/firebase';

const SECONDARY_APP_NAME = 'AdminUserCreation';

function generateTempPassword() {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < 16; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

async function withSecondaryAuth(run) {
  const existing = getApps().find((app) => app.name === SECONDARY_APP_NAME);
  if (existing) {
    await deleteApp(existing);
  }

  const secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    return await run(secondaryAuth);
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp);
  }
}

export function getCreateUserErrorMessage(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
    case 'app/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this Firebase project.';
    default:
      return err?.message || 'Could not create user. Please try again.';
  }
}

export async function getUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

export async function getHubs() {
  const docSnap = await getDoc(doc(db, 'masterData', 'hubs'));
  return docSnap.exists() ? docSnap.data().items : [];
}

export async function updateHub(hubId, data, actorUid) {
  // get current hubs first
  const hubs = await getHubs();
  
  // update the specific hub in the array
  const updated = hubs.map(hub => hub.id === hubId ? { ...hub, ...data } : hub);
  
  // write back the whole array
  await setDoc(doc(db, 'masterData', 'hubs'), { items: updated });

  // audit log
  await addDoc(collection(db, 'auditLogs'), {
    actorUid,
    action: 'update_hub',
    entityType: 'hub',
    entityId: hubId,
    after: data,
    createdAt: serverTimestamp(),
  });
}

/**
 * Creates Firebase Auth account + Firestore users/{uid} profile.
 * Uses a secondary Auth instance so the admin session stays signed in.
 */
export async function createUser(
  { email, name, role, department, status = 'active', password, sendSetupEmail = true },
  actorUid
) {
  const normalizedEmail = email.trim().toLowerCase();
  const resolvedPassword = sendSetupEmail ? generateTempPassword() : password;

  if (!resolvedPassword || String(resolvedPassword).length < 6) {
    const error = new Error('Password must be at least 6 characters.');
    error.code = 'app/weak-password';
    throw error;
  }

  const { uid } = await withSecondaryAuth(async (secondaryAuth) => {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      normalizedEmail,
      resolvedPassword
    );
    return { uid: credential.user.uid };
  });

  const profile = {
    email: normalizedEmail,
    name: name.trim(),
    role,
    department,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid), profile);

  if (sendSetupEmail) {
    await sendPasswordResetEmail(auth, normalizedEmail);
  }

  await addDoc(collection(db, 'auditLogs'), {
    actorUid,
    action: 'create_user',
    entityType: 'user',
    entityId: uid,
    after: {
      email: normalizedEmail,
      name: profile.name,
      role,
      department,
      status,
      setupEmailSent: sendSetupEmail,
    },
    createdAt: serverTimestamp(),
  });

  return { uid, setupEmailSent: sendSetupEmail };
}

export async function updateUser(uid, data, actorUid) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });

  await addDoc(collection(db, 'auditLogs'), {
    actorUid,
    action: 'update_user',
    entityType: 'user',
    entityId: uid,
    after: data,
    createdAt: serverTimestamp(),
  });
}

export async function getAuditLogs() {
  const [logsSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'auditLogs')),
    getDocs(collection(db, 'users'))
  ]);

  const usersMap = {};
  usersSnap.docs.forEach(doc => {
    usersMap[doc.id] = doc.data().name;
  });

  return logsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    actorName: usersMap[doc.data().actorUid] || doc.data().actorUid,
    entityName: usersMap[doc.data().entityId] || doc.data().entityId
  }));
}