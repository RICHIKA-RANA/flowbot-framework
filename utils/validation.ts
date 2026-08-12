// Shared validation helpers.
export interface FileConstraint {
  typePrefix?: string;
  maxBytes?: number;
  typeError?: string;
  sizeError?: string;
}


export const validateFile = (
  file: File,
  { typePrefix, maxBytes, typeError, sizeError }: FileConstraint,
): string | null => {
  if (typePrefix && !file.type.startsWith(typePrefix)) {
    return typeError ?? 'Unsupported file type';
  }
  if (maxBytes != null && file.size > maxBytes) {
    return sizeError ?? 'File is too large';
  }
  return null;
};
