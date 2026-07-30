import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type { Report, ReportReason, ReportStatus } from '../../types/models';
import { omitUndefined } from '../../utils/firestore';
import { demoStore, hydrateDemoState } from '../demo/demoStore';
import { COLLECTIONS, getDb, isFirebaseConfigured } from '../firebase';

const toReport = (snapshot: QueryDocumentSnapshot<DocumentData>): Report => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    videoId: data.videoId ?? '',
    videoTitle: data.videoTitle ?? '',
    orgId: data.orgId ?? '',
    reporterId: data.reporterId ?? '',
    reason: data.reason ?? 'other',
    details: data.details,
    status: data.status ?? 'open',
    createdAt: data.createdAt?.toDate?.().toISOString() ?? data.createdAt ?? '',
  };
};

/**
 * A viewer reporting a video. Every report always lands as `open` regardless of
 * caller input — same principle as video submissions always landing `pending`;
 * resolving one is a moderation action, never something the reporter controls.
 */
export const submitReport = async (params: {
  reporterId: string;
  videoId: string;
  videoTitle: string;
  orgId: string;
  reason: ReportReason;
  details?: string;
}): Promise<Report> => {
  const draft = {
    videoId: params.videoId,
    videoTitle: params.videoTitle,
    orgId: params.orgId,
    reporterId: params.reporterId,
    reason: params.reason,
    details: params.details,
    status: 'open' as const,
  };

  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore.addReport({
      ...draft,
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }

  const ref = await addDoc(
    collection(getDb(), COLLECTIONS.reports),
    omitUndefined({ ...draft, createdAt: serverTimestamp() }),
  );
  return { ...draft, id: ref.id, createdAt: new Date().toISOString() };
};

/** Moderation queue: every report awaiting a decision. */
export const listOpenReports = async (max = 100): Promise<Report[]> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore
      .getReports()
      .filter((report) => report.status === 'open')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, max);
  }

  const snapshot = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.reports),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      fbLimit(max),
    ),
  );
  return snapshot.docs.map(toReport);
};

/** Marks a report as resolved — the report itself, not the video it points at. */
export const resolveReport = async (reportId: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    demoStore.updateReport(reportId, { status: 'resolved' as ReportStatus });
    return;
  }
  await updateDoc(doc(getDb(), COLLECTIONS.reports, reportId), { status: 'resolved' });
};
