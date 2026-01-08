'use server';

import { put } from '@vercel/blob';

export async function uploadImage(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    const filename = file.name;

    if (!file) {
        throw new Error('No file provided');
    }

    const blob = await put(filename, file, {
        access: 'public',
    });

    return blob.url;
}
