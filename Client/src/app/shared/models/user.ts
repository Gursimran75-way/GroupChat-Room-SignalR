export interface User {
    id: string; // Guid in C# becomes string in JSON
    name: string;
    email: string;
    isActive: boolean;
    role: string;
    refreshToken?: string;
  }