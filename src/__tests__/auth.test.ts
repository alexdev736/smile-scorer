import { registerUser, loginUser } from '@/lib/auth';

describe('Auth Service', () => {
  it('should register a new user', async () => {
    const user = await registerUser('test@example.com', 'Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
    expect(user.id).toBeDefined();
  });
});
