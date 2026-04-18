export const SAVED_CARS_KEY = 'renterSavedCars';
export const RENTAL_HISTORY_KEY = 'rentalHistory';

const getImageSource = (imageField) => {
  if (!imageField) return '';
  if (typeof imageField === 'string') return imageField;
  if (typeof imageField === 'object') {
    return imageField.url || imageField.src || imageField.thumbnail || imageField.path || '';
  }
  return '';
};

const getVehicleImage = (vehicle) => {
  return (
    getImageSource(vehicle.image) ||
    getImageSource(vehicle.imageUri) ||
    getImageSource(vehicle.photoUrl) ||
    getImageSource(vehicle.photo)
  );
};

export const fromApiVehicle = (vehicle) => {
  const price = Number(vehicle.pricePerDay ?? vehicle.daily_rate ?? 0);
  const status = vehicle.status || (vehicle.available ? 'available' : 'rented');
  const image = getVehicleImage(vehicle);

  return {
    ...vehicle,
    id: Number(vehicle.id),
    name: vehicle.name || vehicle.model || '',
    model: vehicle.model || vehicle.name || '',
    pricePerDay: Number.isNaN(price) ? 0 : price,
    price: Number.isNaN(price) ? 0 : price,
    available: status === 'available',
    status,
    image,
    imageUri: image,
    owner: vehicle.owner || '',
    ownerId: vehicle.ownerId || null,
    ownerEmail: vehicle.ownerEmail || '',
    type: vehicle.type || '',
    transmission: vehicle.transmission || '',
    fuel: vehicle.fuel || '',
    seats: vehicle.seats || null,
    location: vehicle.location || '',
    description: vehicle.description || '',
    features:
      Array.isArray(vehicle.features) && vehicle.features.length > 0
        ? vehicle.features
        : ['Aircon', 'Bluetooth', 'ABS', 'Backup Camera'],
  };
};

// Build a complete payload for POST (create) — all fields required by the model
export const toApiVehicle = (vehicleData, user) => {
  const rawPrice = Number(vehicleData.pricePerDay ?? vehicleData.price ?? 0);
  const payload = {
    brand: vehicleData.brand || '',
    model: vehicleData.model || vehicleData.name || '',
    year: Number(vehicleData.year || new Date().getFullYear()),
    pricePerDay: Number.isNaN(rawPrice) ? 0 : rawPrice,
    available: (vehicleData.status || 'available') === 'available',
    image: vehicleData.image || vehicleData.imageUri || '',
    type: vehicleData.type || '',
    transmission: vehicleData.transmission || '',
    fuel: vehicleData.fuel || '',
    seats: vehicleData.seats ? Number(vehicleData.seats) : null,
    location: vehicleData.location || '',
    description: vehicleData.description || '',
  };
  const ownerId = vehicleData.ownerId ?? user?.id;
  const ownerEmail = vehicleData.ownerEmail ?? user?.email;
  if (ownerId != null) payload.ownerId = ownerId;
  if (ownerEmail) payload.ownerEmail = ownerEmail;
  return payload;
};

// Build a partial payload for PATCH — only include fields explicitly provided
export const toApiVehiclePatch = (updates) => {
  const patch = {};
  if (updates.brand !== undefined) patch.brand = updates.brand;
  if (updates.model !== undefined || updates.name !== undefined)
    patch.model = updates.model || updates.name;
  if (updates.year !== undefined) patch.year = Number(updates.year);
  if (updates.pricePerDay !== undefined || updates.price !== undefined) {
    const rawPrice = Number(updates.pricePerDay ?? updates.price ?? 0);
    patch.pricePerDay = Number.isNaN(rawPrice) ? 0 : rawPrice;
  }
  if (updates.status !== undefined || updates.available !== undefined) {
    const statusVal = updates.status || (updates.available ? 'available' : 'rented');
    patch.available = statusVal === 'available';
  }
  if (updates.image !== undefined || updates.imageUri !== undefined)
    patch.image = updates.image || updates.imageUri || '';
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.transmission !== undefined) patch.transmission = updates.transmission;
  if (updates.fuel !== undefined) patch.fuel = updates.fuel;
  if (updates.seats !== undefined) patch.seats = updates.seats ? Number(updates.seats) : null;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.description !== undefined) patch.description = updates.description;
  return patch;
};
