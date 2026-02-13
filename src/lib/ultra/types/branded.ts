export type DocumentId = string & { readonly _brand: 'DocumentId' };
export type UserId = string & { readonly _brand: 'UserId' };
export type Money = number & { readonly _brand: 'Money' };
export type Email = string & { readonly _brand: 'Email' };

export function createDocumentId(id: string): DocumentId {
  return id as DocumentId;
}

export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createMoney(amount: number): Money {
  if (amount < 0 || amount > 1000000) {
    throw new Error(`Invalid money amount: ${amount}`);
  }
  return amount as Money;
}

export function createEmail(email: string): Email {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid email: ${email}`);
  }
  return email as Email;
}
