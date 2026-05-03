export function predictExpiryDate(
  category: string,
  storageType: string,
  addedAtStr?: string | null
): string {
  const addedAt = addedAtStr ? new Date(addedAtStr) : new Date();
  let daysToAdd = 7; // default

  switch (category) {
    case 'dairy':
      daysToAdd = storageType === 'fridge' ? 7 : 3;
      break;
    case 'meat_poultry':
      daysToAdd = storageType === 'freezer' ? 90 : 3;
      break;
    case 'fruits':
      daysToAdd = storageType === 'pantry' ? 5 : 7;
      break;
    case 'vegetables':
      daysToAdd = storageType === 'freezer' ? 90 : 7;
      break;
    case 'snacks':
      daysToAdd = 30;
      break;
    case 'beverages':
      daysToAdd = 14;
      break;
    case 'grains':
      daysToAdd = 60;
      break;
    case 'other':
    default:
      daysToAdd = 7;
      break;
  }

  const expiryDate = new Date(addedAt);
  expiryDate.setDate(expiryDate.getDate() + daysToAdd);
  
  return expiryDate.toISOString().split('T')[0];
}
