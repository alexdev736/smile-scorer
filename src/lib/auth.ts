// Mock database for users
type User = {
  id: string;
  email: string;
  name: string;
};

const users: User[] = [];

// Simulate async network/DB calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function registerUser(email: string, name: string): Promise<User> {
  await delay(500);
  
  if (users.find(u => u.email === email)) {
    throw new Error('User with this email already exists');
  }

  const newUser: User = {
    id: Math.random().toString(36).substring(2, 9),
    email,
    name
  };
  
  users.push(newUser);
  return newUser;
}

export async function loginUser(email: string): Promise<User> {
  await delay(500);
  
  const user = users.find(u => u.email === email);
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}
