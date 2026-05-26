const toNumericId = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Flat backend record → nested UI shape */
export function fromApiReport(api) {
  if (!api) return null;
  if (api.rental && api.checkin) return api;

  const customLabels = api.customLabels || {};

  return {
    id: api.id,
    type: api.type || 'checkin',
    vehicleId: api.vehicleId,
    rentalId: api.rentalId,
    vehicleName: api.vehicleName || '',
    renterName: api.renterName || '',
    renterEmail: customLabels.renterEmail || api.renterEmail || '',
    renterId: customLabels.renterId || api.renterId || null,
    startDate: api.startDate,
    endDate: api.endDate,
    amount: api.amount,
    rental: {
      vehicleId: api.vehicleId,
      vehicleName: api.vehicleName || '',
      rentalId: api.rentalId,
      renterName: api.renterName || '',
      renterEmail: customLabels.renterEmail || api.renterEmail || '',
      renterId: customLabels.renterId || api.renterId || null,
      startDate: api.startDate,
      endDate: api.endDate,
      amount: api.amount,
    },
    checkin: {
      issues: api.issues || [],
      notes: api.notes || '',
      odometer: api.odometer || '',
      fuel: api.fuelLevel || '',
      fuelLevel: api.fuelLevel || '',
      condition: customLabels.condition || '',
      damageCost: customLabels.damageCost || 0,
      photos: api.photos || [],
      customLabels,
    },
    checkout: api.checkout || null,
    comments: api.comments || [],
    createdAt: api.createdAt,
  };
}

/** Nested or flat UI shape → flat backend payload */
export function toApiPayload(report) {
  const rental = report.rental || report;
  const checkin = report.checkin || {};
  const customLabels = {
    ...(checkin.customLabels || report.customLabels || {}),
  };

  if (checkin.condition) customLabels.condition = checkin.condition;
  if (checkin.damageCost) customLabels.damageCost = checkin.damageCost;
  if (rental.renterEmail) customLabels.renterEmail = rental.renterEmail;
  if (rental.renterId) customLabels.renterId = rental.renterId;

  return {
    type: report.type || 'checkin',
    vehicleId: toNumericId(rental.vehicleId ?? rental.vehicle_id ?? report.vehicleId) || 0,
    vehicleName: rental.vehicleName || rental.vehicle_name || report.vehicleName || '',
    rentalId: toNumericId(rental.rentalId ?? rental.id ?? rental.rental_id ?? report.rentalId) || 0,
    renterName: rental.renterName || rental.renter_name || report.renterName || '',
    startDate: rental.startDate || rental.start_date || report.startDate || null,
    endDate: rental.endDate || rental.end_date || report.endDate || null,
    amount: Number(rental.amount ?? rental.totalPrice ?? rental.total_price ?? report.amount ?? 0),
    issues: checkin.issues || report.issues || [],
    notes: checkin.notes || report.notes || '',
    odometer: String(checkin.odometer ?? report.odometer ?? ''),
    fuelLevel: checkin.fuelLevel || checkin.fuel || report.fuelLevel || '',
    photos: checkin.photos || report.photos || [],
    customLabels,
    checkout: report.checkout ?? null,
    comments: report.comments || [],
  };
}

export function updatesToApiPatch(updates, existing) {
  const patch = {};

  if (updates.checkin) {
    const ci = updates.checkin;
    if (ci.issues !== undefined) patch.issues = ci.issues;
    if (ci.notes !== undefined) patch.notes = ci.notes;
    if (ci.odometer !== undefined) patch.odometer = String(ci.odometer);
    if (ci.fuel !== undefined || ci.fuelLevel !== undefined) patch.fuelLevel = ci.fuelLevel || ci.fuel;
    if (ci.photos !== undefined) patch.photos = ci.photos;
    const labels = { ...(existing?.checkin?.customLabels || existing?.customLabels || {}) };
    if (ci.condition !== undefined) labels.condition = ci.condition;
    if (ci.damageCost !== undefined) labels.damageCost = ci.damageCost;
    patch.customLabels = labels;
  }

  if (updates.checkout !== undefined) patch.checkout = updates.checkout;
  if (updates.comments !== undefined) patch.comments = updates.comments;

  return patch;
}

export function feedbackToApiPayload(feedback) {
  return {
    type: 'feedback',
    vehicleId: toNumericId(feedback.vehicleId) || 0,
    vehicleName: feedback.vehicleName || '',
    rentalId: toNumericId(feedback.bookingId ?? feedback.rentalId) || 0,
    renterName: feedback.fromUserEmail || feedback.renterName || '',
    notes: feedback.message || feedback.text || '',
    customLabels: {
      rating: feedback.rating ?? 5,
      fromUserId: feedback.fromUserId,
      fromUserEmail: feedback.fromUserEmail,
      fromUserRole: feedback.fromUserRole,
      toUserId: feedback.toUserId,
      toUserEmail: feedback.toUserEmail,
      toUserRole: feedback.toUserRole,
      bookingId: feedback.bookingId ?? feedback.rentalId,
      feedbackType: feedback.type || 'general',
      ownerName: feedback.ownerName,
      renterName: feedback.renterName,
    },
    issues: [],
    photos: [],
    comments: [],
  };
}

export function fromApiFeedback(api) {
  const labels = api.customLabels || {};
  return {
    id: api.id,
    bookingId: labels.bookingId ?? api.rentalId,
    rentalId: labels.bookingId ?? api.rentalId,
    vehicleId: api.vehicleId,
    vehicleName: api.vehicleName,
    fromUserId: labels.fromUserId,
    fromUserEmail: labels.fromUserEmail,
    fromUserRole: labels.fromUserRole,
    toUserId: labels.toUserId,
    toUserEmail: labels.toUserEmail,
    toUserRole: labels.toUserRole,
    ownerName: labels.ownerName || labels.toUserEmail,
    renterName: labels.renterName || labels.fromUserEmail || api.renterName,
    rating: Number(labels.rating ?? 5),
    message: api.notes || '',
    text: api.notes || '',
    type: labels.feedbackType || 'general',
    createdAt: api.createdAt,
    date: api.createdAt,
  };
}
