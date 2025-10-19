import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase.js';

/**
 * Seed Firestore database with initial matter data
 *
 * This is a one-time utility to populate the database with sample matters.
 * After running once, this file can be removed or kept for re-seeding during development.
 *
 * Usage:
 * import { seedMatters } from '@/utils/seedMatters';
 * await seedMatters(teamId, userId);
 */

// Mock matter data from the original Matters.vue component
const MOCK_MATTERS = [
  {
    id: 1,
    status: 'active',
    archived: false,
    assignedTo: ['user-1', 'user-2'],
    matterNumber: '2024-001',
    clients: ['John Smith'],
    description: 'Real Estate Purchase - 123 Main Street',
    adverseParties: ['ABC Realty Inc.'],
    lastAccessed: '2024-03-15',
  },
  {
    id: 2,
    status: 'active',
    archived: false,
    assignedTo: ['user-1'],
    matterNumber: '2024-002',
    clients: ['Jane Doe', 'Robert Doe'],
    description: 'Estate Planning and Will Preparation',
    adverseParties: [],
    lastAccessed: '2024-03-14',
  },
  {
    id: 3,
    status: 'on-hold',
    archived: false,
    assignedTo: ['user-3'],
    matterNumber: '2024-003',
    clients: ['Acme Corporation'],
    description: 'Contract Review and Negotiation',
    adverseParties: ['XYZ Enterprises Ltd.'],
    lastAccessed: '2024-03-13',
  },
  {
    id: 4,
    status: 'active',
    archived: false,
    assignedTo: ['user-1'],
    matterNumber: '2024-004',
    clients: ['Sarah Johnson'],
    description: 'Divorce Settlement',
    adverseParties: ['Michael Johnson'],
    lastAccessed: '2024-03-12',
  },
  {
    id: 5,
    status: 'closed',
    archived: true,
    assignedTo: ['user-2'],
    matterNumber: '2024-005',
    clients: ['Tech Startup Inc.'],
    description: 'Business Incorporation',
    adverseParties: [],
    lastAccessed: '2024-03-10',
  },
  {
    id: 6,
    status: 'active',
    archived: false,
    assignedTo: ['user-1', 'user-3'],
    matterNumber: '2024-006',
    clients: ['Emily Brown'],
    description: 'Personal Injury Claim',
    adverseParties: ['Insurance Co. of America'],
    lastAccessed: '2024-03-09',
  },
  {
    id: 7,
    status: 'on-hold',
    archived: false,
    assignedTo: ['user-2'],
    matterNumber: '2024-007',
    clients: ['Green Energy Solutions'],
    description: 'Commercial Lease Agreement',
    adverseParties: ['Downtown Properties LLC'],
    lastAccessed: '2024-03-08',
  },
  {
    id: 8,
    status: 'active',
    archived: false,
    assignedTo: ['user-3'],
    matterNumber: '2024-008',
    clients: ['David Wilson'],
    description: 'Trademark Registration',
    adverseParties: [],
    lastAccessed: '2024-03-07',
  },
  {
    id: 9,
    status: 'active',
    archived: false,
    assignedTo: ['user-1'],
    matterNumber: '2024-009',
    clients: ['Martha Stevens'],
    description: 'Employment Contract Dispute',
    adverseParties: ['Global Tech Industries'],
    lastAccessed: '2024-03-06',
  },
  {
    id: 10,
    status: 'on-hold',
    archived: false,
    assignedTo: ['user-2', 'user-3'],
    matterNumber: '2024-010',
    clients: ['Richard Anderson'],
    description: 'Patent Application - Medical Device',
    adverseParties: [],
    lastAccessed: '2024-03-05',
  },
  {
    id: 11,
    status: 'active',
    archived: false,
    assignedTo: ['user-1', 'user-2'],
    matterNumber: '2024-011',
    clients: ['Blue Ocean Investments'],
    description: 'Merger and Acquisition Due Diligence',
    adverseParties: ['Coastal Ventures LLC'],
    lastAccessed: '2024-03-04',
  },
  {
    id: 12,
    status: 'closed',
    archived: true,
    assignedTo: ['user-3'],
    matterNumber: '2024-012',
    clients: ['Lisa Martinez'],
    description: 'Residential Lease Agreement',
    adverseParties: ['Urban Properties Group'],
    lastAccessed: '2024-03-03',
  },
  {
    id: 13,
    status: 'active',
    archived: false,
    assignedTo: ['user-1'],
    matterNumber: '2024-013',
    clients: ['Thompson Family Trust'],
    description: 'Trust Administration and Asset Transfer',
    adverseParties: [],
    lastAccessed: '2024-03-02',
  },
  {
    id: 14,
    status: 'on-hold',
    archived: false,
    assignedTo: ['user-2'],
    matterNumber: '2024-014',
    clients: ["Kevin O'Brien"],
    description: 'Construction Contract Negotiation',
    adverseParties: ['BuildRight Contractors Inc.'],
    lastAccessed: '2024-03-01',
  },
  {
    id: 15,
    status: 'active',
    archived: false,
    assignedTo: ['user-3'],
    matterNumber: '2024-015',
    clients: ['Sunrise Healthcare Ltd.'],
    description: 'Corporate Compliance Review',
    adverseParties: [],
    lastAccessed: '2024-02-28',
  },
  {
    id: 16,
    status: 'active',
    archived: false,
    assignedTo: ['user-1', 'user-2'],
    matterNumber: '2024-016',
    clients: ['Patricia Wong'],
    description: 'Immigration Visa Application',
    adverseParties: ['Department of Immigration'],
    lastAccessed: '2024-02-27',
  },
  {
    id: 17,
    status: 'closed',
    archived: true,
    assignedTo: ['user-2', 'user-3'],
    matterNumber: '2024-017',
    clients: ['Riverside Development Corp.'],
    description: 'Zoning Variance Application',
    adverseParties: ['City Planning Commission'],
    lastAccessed: '2024-02-26',
  },
  {
    id: 18,
    status: 'active',
    archived: false,
    assignedTo: ['user-1'],
    matterNumber: '2024-018',
    clients: ['James Miller', 'Susan Miller'],
    description: 'Child Custody Agreement',
    adverseParties: [],
    lastAccessed: '2024-02-25',
  },
  {
    id: 19,
    status: 'on-hold',
    archived: false,
    assignedTo: ['user-3'],
    matterNumber: '2024-019',
    clients: ['NextGen Software Inc.'],
    description: 'Software Licensing Agreement',
    adverseParties: ['Enterprise Solutions Group'],
    lastAccessed: '2024-02-24',
  },
  {
    id: 20,
    status: 'active',
    archived: false,
    assignedTo: ['user-1', 'user-3'],
    matterNumber: '2024-020',
    clients: ['Angela Rodriguez'],
    description: 'Medical Malpractice Claim',
    adverseParties: ['Metropolitan Hospital', 'Dr. Harrison'],
    lastAccessed: '2024-02-23',
  },
  {
    id: 21,
    status: 'active',
    archived: false,
    assignedTo: ['user-2'],
    matterNumber: '2024-021',
    clients: ['Highland Manufacturing'],
    description: 'Environmental Compliance Filing',
    adverseParties: ['EPA Regional Office'],
    lastAccessed: '2024-02-22',
  },
  {
    id: 22,
    status: 'closed',
    archived: true,
    assignedTo: ['user-1', 'user-2'],
    matterNumber: '2024-022',
    clients: ['Daniel Park'],
    description: 'Bankruptcy Chapter 7 Filing',
    adverseParties: [],
    lastAccessed: '2024-02-21',
  },
  {
    id: 23,
    status: 'active',
    archived: false,
    assignedTo: ['user-1'],
    matterNumber: '2024-023',
    clients: ['Golden Years Retirement Fund'],
    description: 'Securities Compliance Review',
    adverseParties: [],
    lastAccessed: '2024-02-20',
  },
];

/**
 * Convert a date string to Firestore Timestamp
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Timestamp} Firestore Timestamp
 */
function dateStringToTimestamp(dateString) {
  try {
    const date = new Date(dateString);
    return Timestamp.fromDate(date);
  } catch (error) {
    console.error('Error converting date:', error);
    return Timestamp.now();
  }
}

/**
 * Transform mock matter data to Firestore schema
 * @param {Object} mockMatter - Mock matter object
 * @param {string} userId - Current user ID (to replace mock user IDs)
 * @returns {Object} Transformed matter for Firestore
 */
function transformMatter(mockMatter, userId) {
  // Replace hardcoded user IDs with actual user ID
  const assignedTo = mockMatter.assignedTo.map((id) => (id === 'user-1' ? userId : userId));

  // Pick the first assigned user as responsible lawyer (or userId as default)
  const responsibleLawyer = assignedTo[0] || userId;

  return {
    matterNumber: mockMatter.matterNumber,
    description: mockMatter.description,
    clients: mockMatter.clients,
    adverseParties: mockMatter.adverseParties,
    status: mockMatter.status,
    archived: mockMatter.archived,
    assignedTo: [userId], // Assign all to current user for solo team
    responsibleLawyer: userId, // Set current user as responsible lawyer
    lastAccessed: dateStringToTimestamp(mockMatter.lastAccessed),
    createdAt: Timestamp.now(),
    createdBy: userId,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
}

/**
 * Seed the database with sample matters
 *
 * @param {string} teamId - Team ID to seed matters into
 * @param {string} userId - User ID creating the matters
 * @returns {Promise<Object>} Result with success count and any errors
 */
export async function seedMatters(teamId, userId) {
  if (!teamId || !userId) {
    throw new Error('Team ID and User ID are required for seeding');
  }

  console.log(`Starting matter seeding for team: ${teamId}...`);

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Firestore has a limit of 500 operations per batch
    // For 23 matters, we can use a single batch
    const batch = writeBatch(db);
    const mattersRef = collection(db, 'teams', teamId, 'matters');

    MOCK_MATTERS.forEach((mockMatter) => {
      try {
        // Use auto-generated ID instead of generating from matter number
        const matterRef = doc(mattersRef);
        const matterData = transformMatter(mockMatter, userId);

        batch.set(matterRef, matterData);
        results.success++;
      } catch (error) {
        console.error(`Error preparing matter ${mockMatter.matterNumber}:`, error);
        results.failed++;
        results.errors.push({
          matterNumber: mockMatter.matterNumber,
          error: error.message,
        });
      }
    });

    // Commit the batch
    await batch.commit();

    console.log(`Successfully seeded ${results.success} matters!`);
    if (results.failed > 0) {
      console.warn(`Failed to seed ${results.failed} matters:`, results.errors);
    }

    return results;
  } catch (error) {
    console.error('Error seeding matters:', error);
    throw error;
  }
}

/**
 * Clear all matters from a team (useful for re-seeding)
 * WARNING: This will delete all matters! Use with caution.
 *
 * @param {string} teamId - Team ID to clear matters from
 * @returns {Promise<number>} Number of matters deleted
 */
export async function clearMatters(teamId) {
  if (!teamId) {
    throw new Error('Team ID is required');
  }

  console.warn(`WARNING: Clearing all matters for team: ${teamId}`);

  try {
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');

    const mattersRef = collection(db, 'teams', teamId, 'matters');
    const snapshot = await getDocs(mattersRef);

    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();

    console.log(`Cleared ${count} matters from team ${teamId}`);
    return count;
  } catch (error) {
    console.error('Error clearing matters:', error);
    throw error;
  }
}

// Export mock data for reference
export { MOCK_MATTERS };
