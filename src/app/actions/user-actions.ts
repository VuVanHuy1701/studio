'use server';

import fs from 'fs/promises';
import path from 'path';
import { UserAccount } from '@/app/lib/types';

/**
 * Persists the current list of managed users back to the source users.json file.
 * This function runs on the server and has access to the filesystem.
 */
export async function persistUsersToFile(accounts: UserAccount[]) {
  try {
    // Resolve the path to the users.json file relative to the project root
    const filePath = path.join(process.cwd(), 'src', 'app', 'lib', 'users.json');
    
    // Prepare the data structure
    const data = JSON.stringify({ accounts }, null, 2);
    
    // Write the file to disk
    await fs.writeFile(filePath, data, 'utf-8');
    
    console.log('Successfully persisted users to src/app/lib/users.json');
    return { success: true };
  } catch (error) {
    console.error('Error writing to users.json:', error);
    return { 
      success: false, 
      error: 'Failed to persist data to system file. Check if the environment allows filesystem writes.' 
    };
  }
}
