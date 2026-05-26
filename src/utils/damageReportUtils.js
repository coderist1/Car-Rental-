export function fromApiDamageReport(apiReport) {
  if (!apiReport) return apiReport;

  const custom = apiReport.customLabels || {};

  return {
    ...custom,
    ...apiReport,
    id: apiReport.id ?? apiReport._id ?? apiReport.pk,
    type: custom.discoveryType || custom.type || apiReport.type || 'during_rental',
    bookingId: custom.bookingId ?? apiReport.bookingId ?? apiReport.rentalId,
    rentalId: apiReport.rentalId ?? custom.bookingId,
    vehicleId: apiReport.vehicleId ?? apiReport.vehicle_id,
    renterId: custom.renterId ?? apiReport.renterId,
    ownerId: custom.ownerId ?? apiReport.ownerId,
    vehicleName: apiReport.vehicleName ?? apiReport.vehicle_name ?? 'Vehicle',
    renterName: apiReport.renterName ?? apiReport.renter_name ?? custom.renterName ?? '',
    ownerName: custom.ownerName ?? apiReport.ownerName ?? '',
    title: custom.title || 'Damage Report',
    description: custom.description || apiReport.notes || '',
    severity: custom.severity || 'minor',
    status: custom.status || 'submitted',
    location: custom.location || '',
    estimatedRepairCost: custom.estimatedRepairCost ?? apiReport.amount,
    discoveredDate: custom.discoveredDate,
    reportedDate: custom.reportedDate ?? apiReport.createdAt,
    acknowledgedDate: custom.acknowledgedDate,
    resolvedDate: custom.resolvedDate,
    resolutionNotes: custom.resolutionNotes,
    photos: apiReport.photos || [],
    notes: apiReport.notes || '',
    createdAt: apiReport.createdAt,
  };
}

export function flattenFormInput(formData) {
  if (!formData) return {};
  if (typeof formData.entries !== 'function') return { ...formData };

  const flat = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'photos' || key === 'photoPreviews') continue;
    flat[key] = value;
  }
  return flat;
}

export function extractPhotosFromForm(formData, photoItems = []) {
  if (photoItems.length > 0) {
    return photoItems
      .map((photo) => photo.preview || photo.url || photo)
      .filter(Boolean);
  }

  if (formData && typeof formData.getAll === 'function') {
    const previews = formData.getAll('photoPreviews');
    if (previews.length > 0) return previews.filter(Boolean);
  }

  return [];
}

export function toApiDamagePayload(input, user, photoItems = []) {
  const form = flattenFormInput(input);
  const photos = extractPhotosFromForm(input, photoItems);
  const description = form.description || '';
  const title = form.title || 'Damage Report';

  return {
    type: 'damage',
    vehicleId: Number(form.vehicleId),
    vehicleName: form.vehicleName || '',
    rentalId: Number(form.bookingId || form.rentalId),
    renterName: form.renterName || user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Renter',
    startDate: form.startDate || form.discoveredDate || new Date().toISOString(),
    endDate: form.endDate || null,
    amount: Number(form.estimatedRepairCost) || 0,
    notes: [title, description, form.notes].filter(Boolean).join('\n\n'),
    photos,
    customLabels: {
      bookingId: Number(form.bookingId || form.rentalId) || null,
      title,
      description,
      severity: form.severity || 'minor',
      status: form.status || 'submitted',
      location: form.location || '',
      ownerId: form.ownerId ? Number(form.ownerId) : null,
      ownerName: form.ownerName || '',
      renterId: form.renterId ? Number(form.renterId) : user?.id ?? null,
      estimatedRepairCost: form.estimatedRepairCost || '',
      discoveredDate: form.discoveredDate || new Date().toISOString().split('T')[0],
      discoveryType: form.type || 'during_rental',
      reportedDate: new Date().toISOString(),
    },
  };
}

export function toApiDamagePatch(updates = {}) {
  const patch = {};
  const customLabels = { ...(updates.customLabels || {}) };

  if (updates.title !== undefined) customLabels.title = updates.title;
  if (updates.description !== undefined) customLabels.description = updates.description;
  if (updates.severity !== undefined) customLabels.severity = updates.severity;
  if (updates.status !== undefined) customLabels.status = updates.status;
  if (updates.location !== undefined) customLabels.location = updates.location;
  if (updates.estimatedRepairCost !== undefined) customLabels.estimatedRepairCost = updates.estimatedRepairCost;
  if (updates.acknowledgedDate !== undefined) customLabels.acknowledgedDate = updates.acknowledgedDate;
  if (updates.resolvedDate !== undefined) customLabels.resolvedDate = updates.resolvedDate;
  if (updates.resolutionNotes !== undefined) customLabels.resolutionNotes = updates.resolutionNotes;

  if (Object.keys(customLabels).length > 0) {
    patch.customLabels = customLabels;
  }

  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.photos !== undefined) patch.photos = updates.photos;
  if (updates.vehicleId !== undefined) patch.vehicleId = updates.vehicleId;
  if (updates.rentalId !== undefined) patch.rentalId = updates.rentalId;

  return patch;
}
