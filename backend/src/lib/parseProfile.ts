// Helper function to parse JSON string fields in profiles for SQLite compatibility
export function parseProfileArrays(profile: any) {
  if (!profile) return profile;
  
  return {
    ...profile,
    skills: parseJsonField(profile.skills),
    categories: parseJsonField(profile.categories),
    languages: parseJsonField(profile.languages),
  };
}

function parseJsonField(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

