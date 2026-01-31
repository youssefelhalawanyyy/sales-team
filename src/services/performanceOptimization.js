/**
 * Performance Optimization Service
 * Handles optimized queries and caching to improve app performance
 */

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';

// Simple in-memory cache
const cache = {
  data: {},
  timestamps: {},
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

/**
 * Get or fetch users with caching
 */
export async function fetchUsersOptimized() {
  const cacheKey = 'users_all';
  
  if (isCacheValid(cacheKey)) {
    return cache.data[cacheKey];
  }

  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    cacheData(cacheKey, users);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get deals for current user with optimization
 */
export async function fetchUserDealsOptimized(userId, userRole) {
  try {
    let dealsQuery;
    
    // Optimize query based on role
    if (userRole === 'admin' || userRole === 'sales_manager') {
      dealsQuery = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(1000) // Limit to prevent loading everything
      );
    } else {
      dealsQuery = query(
        collection(db, 'sales'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
    }

    const snapshot = await getDocs(dealsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
}

/**
 * Batch fetch multiple collections in parallel
 */
export async function batchFetchCollections(collections) {
  try {
    const queries = collections.map(col => getDocs(collection(db, col)));
    const snapshots = await Promise.all(queries);
    
    const result = {};
    collections.forEach((name, index) => {
      result[name] = snapshots[index].docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return result;
  } catch (error) {
    console.error('Error batch fetching collections:', error);
    return {};
  }
}

/**
 * Get filtered stats with optimized queries
 */
export async function fetchDashboardStatsOptimized(userId, userRole) {
  try {
    // Fetch all needed data in parallel
    const [users, sales, finances] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'sales')),
      userRole === 'admin' ? getDocs(collection(db, 'finances')) : Promise.resolve(null)
    ]);

    const stats = {
      activeUsers: users.docs.length,
      totalDeals: sales.docs.length,
      totalIncome: 0,
      myDeals: 0,
      myClosedDeals: 0,
      myActiveDeal: 0,
      totalClosedDeals: 0,
      totalPendingDeals: 0
    };

    // Process sales
    sales.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.createdBy === userId) {
        stats.myDeals++;
        if (data.status === 'closed') {
          stats.myClosedDeals++;
        }
        if (data.status === 'pending_approval' || data.status === 'in_progress') {
          stats.myActiveDeal++;
        }
      }

      if (data.status === 'closed') {
        stats.totalClosedDeals++;
      }
      if (data.status === 'pending_approval' || data.status === 'in_progress') {
        stats.totalPendingDeals++;
      }
    });

    // Process finances if admin
    if (userRole === 'admin' && finances) {
      finances.docs.forEach(doc => {
        stats.totalIncome += doc.data().amount || 0;
      });
    }

    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

/**
 * Cache helpers
 */
function isCacheValid(key) {
  if (!cache.data[key] || !cache.timestamps[key]) {
    return false;
  }
  
  const age = Date.now() - cache.timestamps[key];
  return age < cache.CACHE_DURATION;
}

function cacheData(key, data) {
  cache.data[key] = data;
  cache.timestamps[key] = Date.now();
}

/**
 * Clear specific cache
 */
export function clearCache(key) {
  delete cache.data[key];
  delete cache.timestamps[key];
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cache.data = {};
  cache.timestamps = {};
}

/**
 * Prefetch data for better perceived performance
 */
export async function prefetchDashboardData(userId, userRole) {
  try {
    // Prefetch in background
    setTimeout(async () => {
      await fetchUsersOptimized();
      await fetchUserDealsOptimized(userId, userRole);
      await fetchDashboardStatsOptimized(userId, userRole);
    }, 0);
  } catch (error) {
    console.error('Error prefetching data:', error);
  }
}

/**
 * Optimize bulk write operations
 */
export async function bulkUpdateDocuments(updates) {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ collection: col, docId, data }) => {
      batch.set(doc(db, col, docId), data, { merge: true });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error in bulk update:', error);
    return false;
  }
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats() {
  return {
    keys: Object.keys(cache.data),
    sizes: Object.keys(cache.data).map(key => ({
      key,
      size: JSON.stringify(cache.data[key]).length,
      age: Date.now() - cache.timestamps[key]
    }))
  };
}
