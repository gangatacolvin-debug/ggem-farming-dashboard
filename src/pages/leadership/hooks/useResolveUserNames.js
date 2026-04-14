import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function labelFromUserData(data) {
  if (!data) return null;
  const parts = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  return (
    data.name ||
    data.displayName ||
    parts ||
    data.email ||
    null
  );
}

/**
 * Maps Firebase Auth UIDs to display labels from `users/{uid}` (batched parallel reads).
 */
export function useResolveUserNames(uidList) {
  const [namesByUid, setNamesByUid] = useState({});

  const sortedKey = useMemo(() => {
    const u = [...new Set((uidList || []).filter((id) => typeof id === 'string' && id.length > 0))];
    u.sort();
    return u.join('|');
  }, [uidList]);

  useEffect(() => {
    const uids = sortedKey ? sortedKey.split('|').filter(Boolean) : [];
    if (uids.length === 0) {
      setNamesByUid({});
      return;
    }

    let cancelled = false;

    (async () => {
      const next = {};
      const chunkSize = 20;
      for (let i = 0; i < uids.length; i += chunkSize) {
        const chunk = uids.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, 'users', uid));
              if (snap.exists()) {
                const label = labelFromUserData(snap.data());
                next[uid] = label || uid;
              } else {
                next[uid] = uid;
              }
            } catch {
              next[uid] = uid;
            }
          })
        );
      }
      if (!cancelled) setNamesByUid(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [sortedKey]);

  return namesByUid;
}
