import { get, set, del } from 'idb-keyval';

export interface DraftData {
  text: string;
  audioBlob: Blob | null;
  fileBlob: Blob | null;
  fileName: string | null;
  fileMimeType: string | null;
}

const DRAFT_KEY = (listeningNumber: number) => `draft_${listeningNumber}`;

export async function saveDraft(listeningNumber: number, data: Partial<DraftData>) {
  try {
    const existing = await getDraft(listeningNumber);
    const updated = { ...existing, ...data };
    await set(DRAFT_KEY(listeningNumber), updated);
  } catch (err) {
    console.error("Failed to save draft", err);
  }
}

export async function getDraft(listeningNumber: number): Promise<DraftData> {
  try {
    const data = await get(DRAFT_KEY(listeningNumber));
    if (data) {
      return data as DraftData;
    }
  } catch (err) {
    console.error("Failed to get draft", err);
  }
  return {
    text: '',
    audioBlob: null,
    fileBlob: null,
    fileName: null,
    fileMimeType: null
  };
}

export async function clearDraft(listeningNumber: number) {
  try {
    await del(DRAFT_KEY(listeningNumber));
  } catch (err) {
    console.error("Failed to clear draft", err);
  }
}
