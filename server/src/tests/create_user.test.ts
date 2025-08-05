
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'customer'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with default role', async () => {
    const inputWithoutRole = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      role: 'customer' as const // Zod default is applied
    };

    const result = await createUser(inputWithoutRole);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.role).toEqual('customer');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123');
  });

  it('should create an admin user', async () => {
    const adminInput: CreateUserInput = {
      ...testInput,
      role: 'admin'
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('admin');
    expect(result.email).toEqual(testInput.email);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].role).toEqual('customer');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash password correctly', async () => {
    const result = await createUser(testInput);

    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(20);

    // Verify password can be verified with Bun's password verify
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    // Wrong password should not verify
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create second user with same email
    const duplicateInput: CreateUserInput = {
      ...testInput,
      first_name: 'Jane',
      last_name: 'Smith'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/email already exists/i);
  });

  it('should create users with different emails successfully', async () => {
    const user1 = await createUser(testInput);

    const user2Input: CreateUserInput = {
      ...testInput,
      email: 'user2@example.com'
    };
    const user2 = await createUser(user2Input);

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.email).toEqual('test@example.com');
    expect(user2.email).toEqual('user2@example.com');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });
});
