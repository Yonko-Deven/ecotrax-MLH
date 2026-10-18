import { db } from '../firebase';
import { 
  collection, addDoc, getDocs, query, 
  orderBy, limit, serverTimestamp, 
  onSnapshot, where, Timestamp, updateDoc, doc
} from 'firebase/firestore';
import { incrementTotalReports } from './stats';

export interface Report {
  id?: string;
  communityId: string;
  userId?: string;
  name: string;
  issueType: string;
  description: string;
  location: string;
  image?: string | null;
  images?: string[];
  status: 'in-progress' | 'resolved' | 'unresolved';
  assignedTo?: string | null;
  createdAt: Timestamp;
}

const REPORTS_COLLECTION = 'reports';

/**
 * Creates a new report in Firestore.
 */
export async function createReport(reportData: Omit<Report, 'id' | 'createdAt'>) {
  if (!db) return null;

  try {
    const images = reportData.images && reportData.images.length > 0 
      ? reportData.images 
      : (reportData.image ? [reportData.image] : []);
    const primaryImage = images.length > 0 ? images[0] : null;

    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...reportData,
      image: primaryImage,
      images: images,
      communityId: reportData.communityId || 'public',
      userId: reportData.userId || 'anonymous',
      status: reportData.status || 'unresolved',
      assignedTo: reportData.assignedTo || null,
      createdAt: serverTimestamp(),
    });

    // Increment global report count
    await incrementTotalReports();

    return docRef.id;
  } catch (error) {
    console.error('Error creating report:', error);
    return null;
  }
}

/**
 * Subscribes to reports for a specific community or globally across all communities with optional filters.
 */
export function subscribeToReports(
  communityId?: string | null, 
  callback: (reports: Report[]) => void = () => {}, 
  statusFilter?: string
) {
  if (!db) return () => {};

  let q;
  if (communityId) {
    if (statusFilter && statusFilter !== 'all') {
      // Note: requires composite index on communityId + status + createdAt
      q = query(
        collection(db, REPORTS_COLLECTION),
        where('communityId', '==', communityId),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, REPORTS_COLLECTION),
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
    }
  } else {
    // When no community is specified, subscribe to all recent reports globally
    q = query(
      collection(db, REPORTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
  }

  return onSnapshot(
    q, 
    (snapshot) => {
      let reports = snapshot.docs.map(doc => {
        const data = doc.data();
        const images: string[] = Array.isArray(data.images) && data.images.length > 0
          ? data.images
          : (data.image ? [data.image] : []);
        return {
          id: doc.id,
          ...data,
          images,
          image: images[0] || data.image || null,
        };
      }) as Report[];

      if (!communityId && statusFilter && statusFilter !== 'all') {
        reports = reports.filter(r => r.status === statusFilter);
      }

      callback(reports);
    },
    (error) => {
      console.error('Error subscribing to reports:', error);
    }
  );
}

/**
 * Fetches recent reports for a community or globally across all communities.
 */
export async function getRecentReports(communityId?: string | null, count: number = 5) {
  if (!db) return [];

  try {
    const q = communityId
      ? query(
          collection(db, REPORTS_COLLECTION),
          where('communityId', '==', communityId),
          orderBy('createdAt', 'desc'), 
          limit(count)
        )
      : query(
          collection(db, REPORTS_COLLECTION),
          orderBy('createdAt', 'desc'), 
          limit(count)
        );
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
      const data = doc.data();
      const images: string[] = Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : (data.image ? [data.image] : []);
      return {
        id: doc.id,
        ...data,
        images,
        image: images[0] || data.image || null,
      };
    }) as Report[];
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    return [];
  }
}

export async function updateReportStatus(reportId: string, newStatus: string) {
    if (!db) return;
    const ref = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(ref, { status: newStatus });
}
