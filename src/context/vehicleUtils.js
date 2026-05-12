export const SAVED_CARS_KEY = 'renterSavedCars';
export const RENTAL_HISTORY_KEY = 'rentalHistory';

const getBaseUrl = () => {
  try {
    // Check for Vite environment
    if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    }
    // Check for Expo / React Native environment
    if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
    }
  } catch (error) {
    // Handle safely if environment variables are not accessible
  }
  return 'http://127.0.0.1:8000';
};

export const getImageSource = (imageField) => {
  if (!imageField) return '';
  let src = '';
  if (typeof imageField === 'string') src = imageField;
  else if (typeof imageField === 'object') {
    src = imageField.url || imageField.src || imageField.thumbnail || imageField.path || '';
  }
  
  if (!src) return '';

  // If it's already a full URL or a base64 string, return as is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  
  // If it starts with a slash, prepend base URL
  if (src.startsWith('/')) {
    return `${getBaseUrl()}${src}`;
  }

  // Point relative filenames to the backend's /uploads/ or /media/ directory
  if (src.startsWith('uploads/') || src.startsWith('media/')) {
    return `${getBaseUrl()}/${src}`;
  }
  return `${getBaseUrl()}/uploads/${src}`;
};

const getVehicleImage = (vehicle) => {
  return (
    getImageSource(vehicle.image) ||
    getImageSource(vehicle.imageUri) ||
    getImageSource(vehicle.photoUrl) ||
    getImageSource(vehicle.photoUri) || // ✅ FIXED: Added photoUri check
    getImageSource(vehicle.photo)
  );
};

export const fromApiVehicle = (vehicle) => {
  const price = Number(vehicle.pricePerDay ?? vehicle.daily_rate ?? 0);
  const status = vehicle.status || (vehicle.available ? 'available' : 'rented');
  const image = getVehicleImage(vehicle);

  // Safely extract ownerId from various possible backend formats
  let extractedOwnerId = vehicle.ownerId ?? vehicle.owner_id ?? null;
  if (extractedOwnerId === null && vehicle.owner) {
    extractedOwnerId = typeof vehicle.owner === 'object' ? vehicle.owner.id : vehicle.owner;
  }

  // Safely extract owner name
  let extractedOwnerName = '';
  if (typeof vehicle.owner === 'string') extractedOwnerName = vehicle.owner;
  else if (typeof vehicle.owner === 'object') extractedOwnerName = vehicle.owner.name || vehicle.owner.fullName || vehicle.owner.username || '';
  else if (vehicle.ownerName) extractedOwnerName = vehicle.ownerName;

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
    owner: extractedOwnerName || vehicle.owner || '',
    ownerId: extractedOwnerId !== null && extractedOwnerId !== undefined && !Number.isNaN(Number(extractedOwnerId)) ? Number(extractedOwnerId) : null,
    ownerEmail: vehicle.ownerEmail || vehicle.owner_email || (typeof vehicle.owner === 'object' ? vehicle.owner.email : ''),
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
    type: vehicleData.type || '',
    transmission: vehicleData.transmission || '',
    fuel: vehicleData.fuel || '',
    seats: vehicleData.seats ? Number(vehicleData.seats) : null,
    location: vehicleData.location || '',
    description: vehicleData.description || '',
  };
  const ownerId = vehicleData.ownerId ?? user?.id;
  const ownerEmail = vehicleData.ownerEmail ?? user?.email;
  if (ownerId != null) {
    payload.ownerId = ownerId;
    payload.owner_id = ownerId; // Provide snake_case for backend compatibility
  }
  if (ownerEmail) payload.ownerEmail = ownerEmail;

  // Automatically convert to FormData if a File is provided so the backend saves it in uploads
  const imageObj = vehicleData.image || vehicleData.imageFile || vehicleData.imageUri;
  if (typeof window !== 'undefined' && typeof File !== 'undefined' && imageObj instanceof File) {
    const formData = new FormData();
    formData.append('image', imageObj);
    Object.keys(payload).forEach(key => {
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });
    return formData;
  }

  payload.image = typeof imageObj === 'string' ? imageObj : '';
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
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.transmission !== undefined) patch.transmission = updates.transmission;
  if (updates.fuel !== undefined) patch.fuel = updates.fuel;
  if (updates.seats !== undefined) patch.seats = updates.seats ? Number(updates.seats) : null;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.description !== undefined) patch.description = updates.description;

  const imageObj = updates.image || updates.imageFile || updates.imageUri;
  if (typeof window !== 'undefined' && typeof File !== 'undefined' && imageObj instanceof File) {
    const formData = new FormData();
    formData.append('image', imageObj);
    Object.keys(patch).forEach(key => {
      if (patch[key] !== null && patch[key] !== undefined) {
        formData.append(key, patch[key]);
      }
    });
    return formData;
  }

  if (imageObj !== undefined) {
    patch.image = typeof imageObj === 'string' ? imageObj : '';
  }
  return patch;
};