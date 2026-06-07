import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut
} from 'firebase/auth';

export async function registerUser(email: string, password: string, name: string) {
  // Use real Firebase SDK to create the user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Set the user's display name in Firebase profile
  if (user) {
    await updateProfile(user, { displayName: name });
  }
  
  return user;
}

export async function loginUser(email: string, password: string) {
  // Use real Firebase SDK to sign in
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutUser() {
  await firebaseSignOut(auth);
}
