import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useDamageReports } from '../context/DamageReportContext';

/**
 * Hook for managing damage report form state and operations
 * Handles draft creation, photo uploads, and submission
 */
export function useDamageReportForm() {
  const { user } = useAuth();
  const { createDamageReport, updateDamageReport } = useDamageReports();

  const [formData, setFormData] = useState({
    bookingId: null,
    vehicleId: null,
    ownerId: null,
    ownerName: '',
    vehicleName: '',
    renterName: '',
    type: 'during_rental',
    title: '',
    severity: 'minor',
    location: '',
    description: '',
    discoveredDate: new Date().toISOString().split('T')[0],
    estimatedRepairCost: '',
    notes: '',
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update form field
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  }, []);

  // Add photo
  const addPhoto = useCallback((photoFile, caption = '') => {
    if (photos.length >= 10) {
      setError('Maximum 10 photos per report');
      return false;
    }

    if (photoFile.size > 5 * 1024 * 1024) {
      setError('Photo must be smaller than 5MB');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos((prev) => [
        ...prev,
        {
          id: `photo_${Date.now()}`,
          file: photoFile,
          preview: e.target.result,
          caption: caption || photoFile.name,
        },
      ]);
    };
    reader.readAsDataURL(photoFile);
    return true;
  }, [photos.length]);

  // Remove photo
  const removePhoto = useCallback((photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  // Update photo caption
  const updatePhotoCaption = useCallback((photoId, caption) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
  }, []);

  // Validate form
  const validation = useMemo(() => {
    const errors = {};

    if (!formData.bookingId) errors.bookingId = 'Booking is required';
    if (!formData.title?.trim()) errors.title = 'Title is required';
    if (!formData.description?.trim() || formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    if (!formData.location?.trim()) errors.location = 'Location is required';
    if (!formData.severity) errors.severity = 'Severity is required';
    if (photos.length === 0) errors.photos = 'At least one photo is required';

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [formData, photos.length]);

  // Submit report
  const submitReport = useCallback(async () => {
    if (!validation.isValid) {
      setError('Please fix form errors before submitting');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare form data with files
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] != null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append photos
      photos.forEach((photo) => {
        formDataToSend.append('photos', photo.file, photo.caption);
        // Add preview for local fallback persistence across page reloads
        if (photo.preview) {
          formDataToSend.append('photoPreviews', photo.preview);
        }
      });

      // Add renter info
      if (user?.id) {
        formDataToSend.append('renterId', user.id);
        formDataToSend.append('renterName', user.fullName || user.firstName || 'Renter');
      }

      const result = await createDamageReport(formDataToSend);

      // Reset form
      setFormData({
        bookingId: null,
        vehicleId: null,
        ownerId: null,
        ownerName: '',
        vehicleName: '',
        renterName: '',
        type: 'during_rental',
        title: '',
        severity: 'minor',
        location: '',
        description: '',
        discoveredDate: new Date().toISOString().split('T')[0],
        estimatedRepairCost: '',
        notes: '',
      });
      setPhotos([]);

      return result;
    } catch (err) {
      setError(err.message || 'Failed to submit report');
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData, photos, user?.id, validation.isValid, createDamageReport]);

  // Save as draft
  const saveDraft = useCallback(async (reportId) => {
    if (!formData.title?.trim()) {
      setError('Title is required to save draft');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await updateDamageReport(reportId, {
        ...formData,
        status: 'draft',
      });
      return result;
    } catch (err) {
      setError(err.message || 'Failed to save draft');
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData, updateDamageReport]);

  return {
    formData,
    photos,
    loading,
    error,
    validation,
    updateField,
    addPhoto,
    removePhoto,
    updatePhotoCaption,
    submitReport,
    saveDraft,
    setFormData,
    setPhotos,
    setError,
  };
}

/**
 * Hook for managing damage reports list filtering and sorting
 */
export function useDamageReportFilters(reports) {
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    type: 'all',
    searchQuery: '',
  });

  const [sortBy, setSortBy] = useState('date-desc');

  const filtered = useMemo(() => {
    let result = [...reports];

    // Apply filters
    if (filters.status !== 'all') {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters.severity !== 'all') {
      result = result.filter((r) => r.severity === filters.severity);
    }

    if (filters.type !== 'all') {
      result = result.filter((r) => r.type === filters.type);
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.vehicleName?.toLowerCase().includes(q) ||
          r.renterName?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.reportedDate) - new Date(a.reportedDate);
        case 'date-asc':
          return new Date(a.reportedDate) - new Date(b.reportedDate);
        case 'severity':
          const severityOrder = { severe: 0, moderate: 1, minor: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [reports, filters, sortBy]);

  return {
    filters,
    sortBy,
    setFilters,
    setSortBy,
    filtered,
  };
}
