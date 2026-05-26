/** Align web legacy statuses with mobile/backend vocabulary */
export function normalizeBookingStatus(status) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'active') return 'approved';
  if (value === 'returned' || value === 'return_requested') return 'completed';
  return value;
}

export function normalizeBookingRecord(booking, fallback = {}) {
  if (!booking) return fallback;

  const ownerData = booking.owner ?? booking.owner_user ?? null;
  const renterData = booking.renter ?? booking.renter_user ?? null;
  const vehicleData = booking.vehicle ?? booking.car ?? null;

  const vehicleId = booking.vehicleId
    ?? booking.vehicle_id
    ?? (vehicleData && typeof vehicleData === 'object' ? vehicleData.id : vehicleData)
    ?? fallback.vehicleId;

  const renterId = booking.renterId
    ?? booking.renter_id
    ?? (renterData && typeof renterData === 'object' ? renterData.id : renterData)
    ?? fallback.renterId;

  const amount = Number(booking.amount ?? booking.totalPrice ?? booking.total_price ?? fallback.amount ?? 0);

  return {
    ...fallback,
    ...booking,
    id: booking.id ?? booking.pk ?? fallback.id,
    vehicleId: Number(vehicleId ?? NaN),
    renterId: Number(renterId ?? NaN),
    vehicleName: booking.vehicleName ?? booking.vehicle_name ?? booking.carName ?? fallback.vehicleName ?? 'Vehicle',
    ownerId: booking.ownerId ?? booking.owner_id ?? fallback.ownerId ?? null,
    ownerEmail: booking.ownerEmail ?? booking.owner_email ?? fallback.ownerEmail ?? '',
    ownerName: booking.ownerName ?? booking.owner_name ?? fallback.ownerName ?? '',
    renterEmail: booking.renterEmail ?? booking.renter_email ?? fallback.renterEmail ?? '',
    renterName: booking.renterName ?? booking.renter_name ?? fallback.renterName ?? '',
    startDate: booking.startDate ?? booking.start_date ?? fallback.startDate ?? null,
    endDate: booking.endDate ?? booking.end_date ?? fallback.endDate ?? null,
    amount,
    totalPrice: amount,
    status: normalizeBookingStatus(booking.status ?? fallback.status),
  };
}
