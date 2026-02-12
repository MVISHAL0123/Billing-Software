import Bill from '../models/Bill.js';

export const deleteAllBills = async () => {
  try {
    const deletedCount = await Bill.deleteAllBills();
    console.log(`Deleted ${deletedCount} bills from database`);
    return { deletedCount };
  } catch (error) {
    console.error('Error deleting bills:', error);
    throw error;
  }
};
