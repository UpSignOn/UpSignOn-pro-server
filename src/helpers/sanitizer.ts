function getNumber(untrustedInput: any, defaultValue: number): number {
  let trustedNumber = Number.parseInt(untrustedInput);
  if (Number.isNaN(trustedNumber)) return defaultValue;
  return trustedNumber;
}
function getNumberOrNull(untrustedInput: any): null | number {
  let trustedNumber = Number.parseInt(untrustedInput);
  if (Number.isNaN(trustedNumber)) return null;
  return trustedNumber;
}

function getString(untrustedInput: any): null | string {
  if (!untrustedInput) return null;
  if (typeof untrustedInput !== 'string') return null;
  return untrustedInput;
}

function getLowerCaseString(untrustedInput: any): null | string {
  if (!untrustedInput) return null;
  if (typeof untrustedInput !== 'string') return null;
  return untrustedInput.toLowerCase();
}

function getBoolean(untrustedInput: any) {
  return !!untrustedInput;
}

function cleanForHTMLInjections(untrustedInput: string) {
  return untrustedInput?.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getArrayOfNumbers(untrustedInput: any): null | number[] {
  if (!Array.isArray(untrustedInput)) return null;
  if (untrustedInput.some((el) => typeof el !== 'number')) return null;
  return untrustedInput;
}

function getArrayOfBackups(
  untrustedInput: any,
): null | { encryptedPassword: string; deviceId: string }[] {
  if (!untrustedInput || !Array.isArray(untrustedInput)) return null;
  if (
    untrustedInput.some(
      (b) => typeof b.encryptedPassword !== 'string' || typeof b.deviceId !== 'string',
    )
  )
    return null;
  const trustedBackups = [];
  for (let i = 0; i < untrustedInput.length; i++) {
    trustedBackups.push({
      encryptedPassword: untrustedInput[i].encryptedPassword,
      deviceId: untrustedInput[i].deviceId,
    });
  }
  return trustedBackups;
}

function getArrayOfSharedAccountUsersToRemove(
  untrustedInput: any,
): null | { sharedAccountIds: number[]; contactId: number }[] {
  if (!untrustedInput || !Array.isArray(untrustedInput)) return null;
  if (
    untrustedInput.some(
      (u) => typeof u.contactId !== 'number' || !Array.isArray(u.sharedAccountIds),
    )
  )
    return null;
  const sharedAccountUsersToRemove = [];
  for (let i = 0; i < untrustedInput.length; i++) {
    const trustedAccIds = [];
    for (let j = 0; j < untrustedInput[i].sharedAccountIds.length; i++) {
      trustedAccIds.push(Number.parseInt(untrustedInput[i].sharedAccountIds[j]));
    }
    sharedAccountUsersToRemove.push({
      contactId: untrustedInput[i].contactId,
      sharedAccountIds: trustedAccIds,
    });
  }
  return sharedAccountUsersToRemove;
}

function getStatObject(untrustedInput: any): null | {
  nbAccounts: number;
  nbCodes: number;
  nbAccountsWithStrongPassword: number;
  nbAccountsWithMediumPassword: number;
  nbAccountsWithWeakPassword: number;
  nbAccountsWithoutPassword: number;
  nbAccountsWithDuplicatePasswords: number;
  nbAccountsRed: number;
  nbAccountsOrange: number;
  nbAccountsGreen: number;
} {
  if (!untrustedInput) return null;
  return {
    nbAccounts: Number.parseInt(untrustedInput.nbAccounts),
    nbCodes: Number.parseInt(untrustedInput.nbCodes),
    nbAccountsWithStrongPassword: Number.parseInt(untrustedInput.nbAccountsWithStrongPassword),
    nbAccountsWithMediumPassword: Number.parseInt(untrustedInput.nbAccountsWithMediumPassword),
    nbAccountsWithWeakPassword: Number.parseInt(untrustedInput.nbAccountsWithWeakPassword),
    nbAccountsWithoutPassword: Number.parseInt(untrustedInput.nbAccountsWithoutPassword),
    nbAccountsWithDuplicatePasswords: Number.parseInt(
      untrustedInput.nbAccountsWithDuplicatePasswords,
    ),
    nbAccountsRed: Number.parseInt(untrustedInput.nbAccountsRed),
    nbAccountsOrange: Number.parseInt(untrustedInput.nbAccountsOrange),
    nbAccountsGreen: Number.parseInt(untrustedInput.nbAccountsGreen),
  };
}

function getSharings(untrustedInput: unknown):
  | null
  | {
    type: string;
    url: null | string;
    name: null | string;
    login: null | string;
    dbId: null | number;
    idInUserEnv: null | number;
    contacts: {
      email: string;
      isManager: boolean;
      encryptedAesKey: string;
    }[];
    aesEncryptedData: null | string;
  }[] {
  if (!untrustedInput || !Array.isArray(untrustedInput)) return null;
  try {
    const trustedSharings = [];
    for (let i = 0; i < untrustedInput.length; i++) {
      const untrustedSharing = untrustedInput[i];
      if (typeof untrustedSharing.type !== 'string') throw new Error('Bad type for sharing type');
      if (untrustedSharing.url != null && typeof untrustedSharing.url !== 'string')
        throw new Error('Bad type for sharing url');
      if (untrustedSharing.name != null && typeof untrustedSharing.name !== 'string')
        throw new Error('Bad type for sharing name');
      if (untrustedSharing.login != null && typeof untrustedSharing.login !== 'string')
        throw new Error('Bad type for sharing login');
      if (untrustedSharing.dbId != null && typeof untrustedSharing.dbId !== 'number')
        throw new Error('Bad type for sharing dbId');
      if (untrustedSharing.idInUserEnv != null && typeof untrustedSharing.idInUserEnv !== 'string')
        throw new Error('Bad type for sharing idInUserEnv');
      if (
        (untrustedSharing.dbId == null && untrustedSharing.aesEncryptedData == null) ||
        (untrustedSharing.aesEncryptedData != null &&
          typeof untrustedSharing.aesEncryptedData !== 'string')
      )
        throw new Error('Bad type for sharing aesEncryptedData');
      if (untrustedSharing.contacts == null || !Array.isArray(untrustedSharing.contacts))
        throw new Error('Bad type for sharing contacts');
      const trustedContacts = [];
      for (let j = 0; j < untrustedSharing.contacts.length; j++) {
        const contact = untrustedSharing.contacts[j];
        if (typeof contact.email !== 'string')
          throw new Error('Bad type for sharing contact email');
        if (contact.encryptedAesKey == null || typeof contact.encryptedAesKey !== 'string')
          throw new Error('Bad type for sharing contact encryptedAesKey');
        if (contact.isManager != null && typeof contact.isManager !== 'boolean')
          throw new Error('Bad type for sharing contact isManager');
        trustedContacts.push({
          email: contact.email,
          isManager: contact.isManager,
          encryptedAesKey: contact.encryptedAesKey,
        });
      }
      trustedSharings.push({
        type: untrustedSharing.type,
        url: untrustedSharing.url,
        name: untrustedSharing.name,
        login: untrustedSharing.login,
        dbId: untrustedSharing.dbId,
        idInUserEnv: untrustedSharing.idInUserEnv,
        aesEncryptedData: untrustedSharing.aesEncryptedData,
        contacts: trustedContacts,
      });
    }
    return trustedSharings;
  } catch (e) {
    console.error(e);
    return null;
  }
}
function getSharedItem(untrustedInput: any): null | {
  id: number;
  url: null | string;
  name: null | string;
  login: null | string;
  aesEncryptedData: string;
} {
  if (!untrustedInput) return null;
  if (
    typeof untrustedInput.id !== 'number' ||
    typeof untrustedInput.aesEncryptedData !== 'string' ||
    (untrustedInput.url != null && typeof untrustedInput.url !== 'string') ||
    (untrustedInput.name != null && typeof untrustedInput.name !== 'string') ||
    (untrustedInput.login != null && typeof untrustedInput.login !== 'string')
  )
    return null;
  return {
    id: untrustedInput.id,
    url: untrustedInput.url,
    name: untrustedInput.name,
    login: untrustedInput.login,
    aesEncryptedData: untrustedInput.aesEncryptedData,
  };
}

function getAesKeyUpdates(untrustedInput: any):
  | null
  | {
    id: number;
    encryptedAesKey: string;
  }[] {
  if (!untrustedInput || !Array.isArray(untrustedInput)) return null;
  const trustedAesKeyUpdates = [];
  for (let i = 0; i < untrustedInput.length; i++) {
    if (
      typeof untrustedInput[i].id !== 'number' ||
      typeof untrustedInput[i].encryptedAesKey !== 'string'
    )
      return null;
    trustedAesKeyUpdates.push({
      id: untrustedInput[i].id,
      encryptedAesKey: untrustedInput[i].encryptedAesKey,
    });
  }
  return trustedAesKeyUpdates;
}

function getVaultStats(untrustedInput: any):
  | null
  | {
    nbAccounts: number,
    nbCodes: number,
    nbAccountsStrong: number,
    nbAccountsMedium: number,
    nbAccountsWeak: number,
    nbAccountsWithDuplicatedPassword: number,
    nbAccountsWithNoPassword: number,
    nbAccountsRed: number,
    nbAccountsOrange: number,
    nbAccountsGreen: number
  } {
  const res = {
    nbAccounts: inputSanitizer.getNumberOrNull(untrustedInput.nbAccounts),
    nbCodes: inputSanitizer.getNumberOrNull(untrustedInput.nbCodes),
    nbAccountsStrong: inputSanitizer.getNumberOrNull(untrustedInput.nbAccountsStrong),
    nbAccountsMedium: inputSanitizer.getNumberOrNull(untrustedInput.nbAccountsMedium),
    nbAccountsWeak: inputSanitizer.getNumberOrNull(untrustedInput.nbAccountsWeak),
    nbAccountsWithDuplicatedPassword: inputSanitizer.getNumberOrNull(untrustedInput.nbAccountsWithDuplicatedPassword),
    nbAccountsWithNoPassword: inputSanitizer.getNumberOrNull(untrustedInput.nbAccountsWithNoPassword),
    nbAccountsRed: inputSanitizer.getNumberOrNull(untrustedInput.nbAccountsRed),
    nbAccountsOrange: inputSanitizer.getNumberOrNull(untrustedInput.nbAccountsOrange),
    nbAccountsGreen: inputSanitizer.getNumberOrNull(untrustedInput.nbAccountsGreen)
  }

  if (res.nbAccounts == null
    || res.nbCodes == null
    || res.nbAccountsStrong == null
    || res.nbAccountsMedium == null
    || res.nbAccountsWeak == null
    || res.nbAccountsWithDuplicatedPassword == null
    || res.nbAccountsWithNoPassword == null
    || res.nbAccountsRed == null
    || res.nbAccountsOrange == null
    || res.nbAccountsGreen == null
  ) {
    return null;
  }

  // @ts-ignore
  return res;
}

export const inputSanitizer = {
  getNumber,
  getNumberOrNull,
  getString,
  getLowerCaseString,
  getBoolean,
  cleanForHTMLInjections,
  getArrayOfNumbers,
  getArrayOfBackups,
  getArrayOfSharedAccountUsersToRemove,
  getStatObject,
  getSharings,
  getSharedItem,
  getAesKeyUpdates,
  getVaultStats
};
