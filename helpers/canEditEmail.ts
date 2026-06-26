interface UserRef {
  role?: string | null;
  tokenId?: string | null;
}

export function canEditEmail(currentUser: UserRef, targetUser: UserRef): boolean {
  if (currentUser.role === 'ADMIN') return true;
  if (
    !currentUser.tokenId ||
    !targetUser.tokenId ||
    currentUser.tokenId === targetUser.tokenId
  ) {
    return false;
  }
  if (targetUser.role !== 'BASIC_USER') return false;
  if (currentUser.role === 'DIRECTION') return true;
  return false;
}

export function getEmailReadOnlyMessage(role: string | null | undefined): string | null {
  if (role === 'BASIC_USER') {
    return 'Seul un directeur ou un administrateur peut modifier votre adresse email.';
  }
  if (role === 'DIRECTION') {
    return 'Seul un administrateur peut modifier votre adresse email.';
  }
  return null;
}
