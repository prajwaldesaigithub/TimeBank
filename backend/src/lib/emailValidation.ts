// Email validation utility - checks if email is real/valid
export async function validateEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
  // Basic format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, reason: "Invalid email format" };
  }

  // Check for common fake/disposable email domains
  const disposableDomains = [
    "tempmail.com", "guerrillamail.com", "mailinator.com", "10minutemail.com",
    "throwaway.email", "fakeinbox.com", "trashmail.com", "mohmal.com"
  ];
  
  const domain = email.split("@")[1]?.toLowerCase();
  if (disposableDomains.some(d => domain?.includes(d))) {
    return { valid: false, reason: "Disposable email addresses are not allowed" };
  }

  // Use AbstractAPI or similar service for real-time validation
  // For now, we'll do basic checks and rely on email verification link
  // In production, integrate with a service like AbstractAPI, ZeroBounce, or EmailListVerify
  
  try {
    // Optionally check MX records (requires DNS lookup)
    // This is a basic check - for production, use a dedicated email validation service
    return { valid: true };
  } catch (error) {
    console.error("Email validation error:", error);
    // Allow signup but require email verification
    return { valid: true };
  }
}

