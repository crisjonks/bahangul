import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, orderBy, limit, getDocs, writeBatch } from 'firebase/firestore';
import f from './firebase-config.js';
const e = import.meta.env;
const cfg = { apiKey: e.VITE_FIREBASE_API_KEY || f.apiKey, authDomain: e.VITE_FIREBASE_AUTH_DOMAIN || f.authDomain, projectId: e.VITE_FIREBASE_PROJECT_ID || f.projectId, appId: e.VITE_FIREBASE_APP_ID || f.appId };
export const enabled = !!(cfg.apiKey && cfg.projectId);
let auth, db;
if (enabled) { const app = initializeApp(cfg); auth = getAuth(app); db = getFirestore(app); }
export const watch = cb => enabled ? onAuthStateChanged(auth, cb) : cb(null);
export const signUp = (m, p) => createUserWithEmailAndPassword(auth, m, p);
export const signIn = (m, p) => signInWithEmailAndPassword(auth, m, p);
export const google = () => signInWithPopup(auth, new GoogleAuthProvider());
export const out = () => signOut(auth);
export const reset = m => sendPasswordResetEmail(auth, m);
export const pull = async uid => { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? s.data() : null; };
// Private progress goes to users/{uid}; the public profile (also used for the leaderboard) goes to profiles/{uid}.
export const push = async (uid, S, pr, pub) => {
  await setDoc(doc(db, 'users', uid), { ...S, uid, updated: Date.now() });
  if (pub) await setDoc(doc(db, 'profiles', uid), pr); else await deleteDoc(doc(db, 'profiles', uid));
};
export const top = async () => (await getDocs(query(collection(db, 'profiles'), orderBy('xp', 'desc'), limit(50)))).docs.map(d => ({ id: d.id, ...d.data() }));
// Claim a username: the rules reject it if the name already exists.
export const claim = async (uid, old, nu) => { const b = writeBatch(db); if (old) b.delete(doc(db, 'usernames', old)); b.set(doc(db, 'usernames', nu), { uid }); await b.commit(); };
export const getProfile = async h => {
  let uid = h.slice(1);
  if (!h.startsWith('~')) { const u = await getDoc(doc(db, 'usernames', h)); if (!u.exists()) return null; uid = u.data().uid; }
  const s = await getDoc(doc(db, 'profiles', uid)); return s.exists() ? { id: uid, ...s.data() } : null;
};
