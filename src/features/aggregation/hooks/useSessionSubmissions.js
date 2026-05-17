import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function useSessionSubmissions(sessionId) {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!sessionId) {
            setSubmissions([]);
            setLoading(false);
            return undefined;
        }

        setLoading(true);
        let snap1 = [];
        let snap2 = [];

        const merge = () => {
            const all = [
                ...snap1.map((d) => ({ id: d.id, ...d.data() })),
                ...snap2.map((d) => ({ id: d.id, ...d.data() })),
            ];
            setSubmissions(Array.from(new Map(all.map((s) => [s.id, s])).values()));
            setLoading(false);
        };

        const q1 = query(collection(db, 'submissions'), where('session-id-ref', '==', sessionId));
        const q2 = query(collection(db, 'submissions'), where('session-id', '==', sessionId));

        const unsub1 = onSnapshot(
            q1,
            (snap) => {
                snap1 = snap.docs;
                merge();
            },
            () => setLoading(false)
        );
        const unsub2 = onSnapshot(
            q2,
            (snap) => {
                snap2 = snap.docs;
                merge();
            },
            () => setLoading(false)
        );

        return () => {
            unsub1();
            unsub2();
        };
    }, [sessionId]);

    return { submissions, loading };
}
