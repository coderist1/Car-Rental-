import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, realtimeManager } from '../lib/api';
import { feedbackToApiPayload, fromApiFeedback } from '../utils/logReportUtils';

const FeedbackContext = createContext(null);
const FEEDBACK_ENDPOINTS = ['/api/logreports/', '/api/log-reports/'];

async function requestFeedback(method, pathSuffix = '', body) {
  let lastError;
  for (const base of FEEDBACK_ENDPOINTS) {
    try {
      return await apiRequest(`${base}${pathSuffix}`, {
        method,
        ...(body !== undefined ? { body } : {}),
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Feedback request failed');
}

async function fetchAllFeedback() {
  for (const base of FEEDBACK_ENDPOINTS) {
    try {
      const data = await apiRequest(base, { method: 'GET' });
      if (Array.isArray(data)) {
        return data.filter((item) => item.type === 'feedback').map(fromApiFeedback);
      }
    } catch {
      // try next
    }
  }
  return [];
}

export function FeedbackProvider({ children }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeedback = useCallback(async () => {
    try {
      const remote = await fetchAllFeedback();
      setFeedback(remote);
    } catch (error) {
      console.warn('[FeedbackContext] load failed', error);
      setFeedback([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadFeedback();
      setLoading(false);
    })();
  }, [loadFeedback]);

  useEffect(() => {
    const upsert = (payload) => {
      if (!payload || payload.type !== 'feedback') return;
      const normalized = fromApiFeedback(payload);
      setFeedback((prev) => {
        const next = prev.filter((item) => String(item.id) !== String(normalized.id));
        return [...next, normalized];
      });
    };

    const onCreate = ({ payload }) => upsert(payload);
    const onUpdate = ({ payload }) => upsert(payload);
    const onDelete = ({ id }) => {
      setFeedback((prev) => prev.filter((item) => String(item.id) !== String(id)));
    };

    const offCreate = realtimeManager.on('logreport_created', onCreate);
    const offUpdate = realtimeManager.on('logreport_updated', onUpdate);
    const offDelete = realtimeManager.on('logreport_deleted', onDelete);

    return () => {
      offCreate();
      offUpdate();
      offDelete();
    };
  }, []);

  const addFeedback = useCallback(async (feedbackData) => {
    const created = await requestFeedback('POST', '', feedbackToApiPayload(feedbackData));
    const normalized = fromApiFeedback(created);
    setFeedback((prev) => {
      const next = prev.filter((item) => String(item.id) !== String(normalized.id));
      return [...next, normalized];
    });
    return normalized;
  }, []);

  const updateFeedback = useCallback(async (feedbackId, updates) => {
    const existing = feedback.find((item) => String(item.id) === String(feedbackId));
    const merged = { ...existing, ...updates };
    const updated = await requestFeedback('PATCH', `${feedbackId}/`, feedbackToApiPayload(merged));
    const normalized = fromApiFeedback(updated);
    setFeedback((prev) => prev.map((item) => (String(item.id) === String(feedbackId) ? normalized : item)));
    return normalized;
  }, [feedback]);

  const deleteFeedback = useCallback(async (feedbackId) => {
    await requestFeedback('DELETE', `${feedbackId}/`);
    setFeedback((prev) => prev.filter((item) => String(item.id) !== String(feedbackId)));
  }, []);

  const getFeedbackForBooking = useCallback((bookingId) => {
    if (!bookingId) return [];
    return feedback.filter((f) => String(f.bookingId) === String(bookingId));
  }, [feedback]);

  const getFeedbackForOwner = useCallback((ownerIdOrEmail, vehicleIds = []) => {
    const target = String(ownerIdOrEmail || '').toLowerCase();
    return feedback.filter((item) =>
      vehicleIds.includes(item.vehicleId)
      || String(item.toUserEmail || '').toLowerCase() === target
      || String(item.toUserId || '') === String(ownerIdOrEmail)
    );
  }, [feedback]);

  const getFeedbackFromUser = useCallback((userEmail) => {
    const target = String(userEmail || '').toLowerCase();
    return feedback.filter((f) => String(f.fromUserEmail || '').toLowerCase() === target);
  }, [feedback]);

  return (
    <FeedbackContext.Provider value={{
      feedback,
      loading,
      addFeedback,
      updateFeedback,
      deleteFeedback,
      getFeedbackForBooking,
      getFeedbackForOwner,
      getFeedbackFromUser,
      refreshFeedback: loadFeedback,
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return ctx;
}
