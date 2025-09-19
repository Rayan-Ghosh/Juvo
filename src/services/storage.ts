// src/services/storage.ts
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateUserProfile } from './auth';

/**
 * Uploads a file to Firebase Storage and updates the user's profile picture.
 * @param userId The ID of the user.
 * @param file The file to upload.
 * @returns The download URL of the uploaded file.
 */
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file selected for upload.');
    }

    // Create a storage reference
    const storageRef = ref(storage, `profile-pictures/${userId}/${file.name}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update the user's profile with the new photo URL
    await updateUserProfile({ photoURL: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture.');
  }
};
