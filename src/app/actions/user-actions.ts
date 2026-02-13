'use server';

import fs from 'fs/promises';
import path from 'path';
import { UserAccount } from '@/app/lib/types';

const filePath = path.join(process.cwd(), 'src', 'app', 'lib', 'users.json');

/**
 * Reads the list of users from the users.json file.
 */
export async function getUsersFromFile(): Promise<UserAccount[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.accounts || [];
  } catch (error) {
    console.error('Error reading users.json:', error);
    return [];
  }
}

/**
 * Persists the current list of managed users back to the source users.json file.
 */
export async function persistUsersToFile(accounts: UserAccount[]) {
  try {
    const data = JSON.stringify({ accounts }, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error writing to users.json:', error);
    return { 
      success: false, 
      error: 'Failed to persist data to system file.' 
    };
  }
}
