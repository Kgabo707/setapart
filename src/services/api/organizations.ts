import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type { Organization, OrganizationApplication } from '../../types/models';
import { demoStore, hydrateDemoState } from '../demo/demoStore';
import { COLLECTIONS, getDb, isFirebaseConfigured } from '../firebase';

const toOrganization = (snapshot: QueryDocumentSnapshot<DocumentData>): Organization => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? '',
    description: data.description ?? '',
    logoUrl: data.logoUrl,
    verificationStatus: data.verificationStatus ?? 'pending',
    contactEmail: data.contactEmail ?? '',
    ownerUserId: data.ownerUserId,
    websiteUrl: data.websiteUrl,
    location: data.location,
    followerCount: data.followerCount ?? 0,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? data.createdAt ?? '',
  };
};

export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore.getOrganizations().find((org) => org.id === orgId) ?? null;
  }

  const snapshot = await getDoc(doc(getDb(), COLLECTIONS.organizations, orgId));
  return snapshot.exists()
    ? toOrganization(snapshot as QueryDocumentSnapshot<DocumentData>)
    : null;
};

export const listOrganizationsByIds = async (orgIds: string[]): Promise<Organization[]> => {
  if (orgIds.length === 0) return [];

  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    const wanted = new Set(orgIds);
    return demoStore.getOrganizations().filter((org) => wanted.has(org.id));
  }

  const chunks: string[][] = [];
  for (let i = 0; i < orgIds.length; i += 10) chunks.push(orgIds.slice(i, i + 10));

  const results = await Promise.all(
    chunks.map((chunk) =>
      getDocs(
        query(collection(getDb(), COLLECTIONS.organizations), where('__name__', 'in', chunk)),
      ),
    ),
  );
  return results.flatMap((snapshot) => snapshot.docs.map(toOrganization));
};

/**
 * Text search across verified organizations only — a pending or rejected application
 * should never surface to a viewer, search included.
 */
export const searchVerifiedOrganizations = async (
  queryText: string,
  max = 10,
): Promise<Organization[]> => {
  const needle = queryText.trim().toLowerCase();
  if (!needle) return [];

  let verified: Organization[];
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    verified = demoStore.getOrganizations().filter((org) => org.verificationStatus === 'verified');
  } else {
    const snapshot = await getDocs(
      query(
        collection(getDb(), COLLECTIONS.organizations),
        where('verificationStatus', '==', 'verified'),
        fbLimit(200),
      ),
    );
    verified = snapshot.docs.map(toOrganization);
  }

  return verified
    .filter(
      (org) =>
        org.name.toLowerCase().includes(needle) || org.description.toLowerCase().includes(needle),
    )
    .slice(0, max);
};

/**
 * Finds the application a viewer has already submitted, so the Profile screen can show
 * "under review" instead of inviting them to apply twice.
 */
export const getOrganizationByOwner = async (userId: string): Promise<Organization | null> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore.getOrganizations().find((org) => org.ownerUserId === userId) ?? null;
  }

  const snapshot = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.organizations),
      where('ownerUserId', '==', userId),
      fbLimit(1),
    ),
  );
  return snapshot.empty ? null : toOrganization(snapshot.docs[0]);
};

/**
 * Submits an organization application.
 *
 * Deliberately does *not* touch the user's `roles` or `orgId`: the `organization` role
 * is only granted once a super-admin flips `verificationStatus` to `verified`.
 */
export const submitOrganizationApplication = async (
  ownerUserId: string,
  application: OrganizationApplication,
): Promise<Organization> => {
  const draft = {
    ...application,
    ownerUserId,
    verificationStatus: 'pending' as const,
    followerCount: 0,
  };

  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore.addOrganization({
      ...draft,
      id: `org-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }

  const ref = await addDoc(collection(getDb(), COLLECTIONS.organizations), {
    ...draft,
    createdAt: serverTimestamp(),
  });

  return { ...draft, id: ref.id, createdAt: new Date().toISOString() };
};
