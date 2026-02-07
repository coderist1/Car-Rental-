import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { vehicleTypes, locations } from '../data/vehicles';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
  mint: '#6FD8BF',
  teal: '#3F9B84',
  lightGray: '#EDEDED',
  white: '#ffffff',
  bg: '#f8fafc',
  textDark: '#1a2c5e',
  borderLight: '#e5e7eb',
  yellow: '#F2CF1F',
  success: '#808080',
  danger: '#ff6b6b',
};

const VehicleCard = ({ vehicle, onEdit, onDelete, onToggleAvailability }) => (
  <View style={styles.vehicleCard}>
    <View style={styles.vehicleImageContainer}>
      {vehicle.imageUri ? (
        <Image source={{ uri: vehicle.imageUri }} style={styles.vehicleImage} resizeMode="contain" />
      ) : (
        <Text style={styles.vehicleEmoji}>{vehicle.image}</Text>
      )}
    </View>
    <View style={styles.vehicleInfo}>
      <View style={styles.vehicleHeader}>
        <Text style={styles.vehicleName}>{vehicle.name}</Text>
        <TouchableOpacity
          style={[styles.availabilityBadge, !vehicle.available && styles.unavailableBadge]}
          onPress={() => onToggleAvailability(vehicle)}
        >
          <Text style={[styles.availabilityText, !vehicle.available && styles.unavailableText]}>
            {vehicle.available ? 'Available' : 'Rented'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.vehicleBrand}>{vehicle.brand} • {vehicle.year}</Text>
      <View style={styles.vehicleDetails}>
        <Text style={styles.vehicleDetail}>📍 {vehicle.location}</Text>
        <Text style={styles.vehicleDetail}>👥 {vehicle.seats} seats</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Per day</Text>
        <Text style={styles.price}>${vehicle.pricePerDay}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(vehicle)}>
          <Text style={styles.editButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(vehicle)}>
          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const VehicleTile = ({ vehicle, onPress }) => (
  <TouchableOpacity style={styles.vehicleTile} onPress={() => onPress && onPress(vehicle)}>
    <View style={styles.tileImageContainer}>
      {vehicle.imageUri ? (
        <Image source={{ uri: vehicle.imageUri }} style={styles.tileImage} resizeMode="contain" />
      ) : (
        <Text style={styles.tileEmoji}>{vehicle.image}</Text>
      )}
    </View>
    <Text style={styles.tileLabel} numberOfLines={1}>{vehicle.name}</Text>
  </TouchableOpacity>
);

const VehicleDetailModal = ({ visible, vehicle, onClose, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: vehicle?.name || '',
    brand: vehicle?.brand || '',
    year: vehicle?.year?.toString() || '',
    pricePerDay: vehicle?.pricePerDay?.toString() || '',
    location: vehicle?.location || '',
    transmission: vehicle?.transmission || '',
    image: vehicle?.image || '🚗',
    imageUri: vehicle?.imageUri || null,
  });

  React.useEffect(() => {
    if (vehicle) {
      setEditForm({
        name: vehicle.name || '',
        brand: vehicle.brand || '',
        year: vehicle.year?.toString() || '',
        pricePerDay: vehicle.pricePerDay?.toString() || '',
        location: vehicle.location || '',
        transmission: vehicle.transmission || '',
        image: vehicle.image || '🚗',
        imageUri: vehicle.imageUri || null,
      });
      setIsEditing(false);
    }
  }, [vehicle]);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permissions are required to select images.');
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setEditForm({ ...editForm, imageUri: result.assets[0].uri });
    }
  };

  if (!vehicle) return null;

  const handleSave = () => {
    const updatedVehicle = {
      ...vehicle,
      name: editForm.name,
      brand: editForm.brand,
      year: parseInt(editForm.year),
      pricePerDay: parseInt(editForm.pricePerDay),
      location: editForm.location,
      transmission: editForm.transmission,
      image: editForm.image,
      imageUri: editForm.imageUri,
    };
    onEdit(updatedVehicle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      name: vehicle.name || '',
      brand: vehicle.brand || '',
      year: vehicle.year?.toString() || '',
      pricePerDay: vehicle.pricePerDay?.toString() || '',
      location: vehicle.location || '',
      transmission: vehicle.transmission || '',
      image: vehicle.image || '🚗',
      imageUri: vehicle.imageUri || null,
    });
    setIsEditing(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.vehicleDetailModalOverlay}>
        <View style={[styles.modalContent, styles.vehicleDetailModalContent]}>
          <View style={styles.vehicleDetailLeft}>
            <ScrollView style={styles.detailsScrollView}>
              {!isEditing ? (
                <>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailTitle}>{vehicle.name}</Text>
                    <View style={[styles.statusBadgeDetail, vehicle.available ? styles.availableBadgeDetail : styles.rentedBadgeDetail]}>
                      <Text style={[styles.statusTextDetail, vehicle.available ? styles.availableTextDetail : styles.rentedTextDetail]}>
                        {vehicle.available ? 'Available' : 'Rented'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.detailSubtitle}>{vehicle.brand} • {vehicle.year}</Text>

                  <View style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Vehicle Info</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Brand</Text>
                      <Text style={styles.detailValue}>{vehicle.brand}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Year</Text>
                      <Text style={styles.detailValue}>{vehicle.year}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Seats</Text>
                      <Text style={styles.detailValue}>{vehicle.seats}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Transmission</Text>
                      <Text style={styles.detailValue}>{vehicle.transmission}</Text>
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Pricing & Location</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Price/Day</Text>
                      <Text style={[styles.detailValue, styles.priceValue]}>${vehicle.pricePerDay}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{vehicle.location}</Text>
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Features</Text>
                    <Text style={styles.featuresList}>{vehicle.features?.join(', ') || 'No features added'}</Text>
                  </View>

                  <TouchableOpacity style={styles.editActionButton} onPress={() => setIsEditing(true)}>
                    <Text style={styles.editActionButtonText}>✏️ Edit Details</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.editingTitle}>Edit Vehicle Details</Text>

                  <View style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Vehicle Image</Text>
                    <View style={styles.imageEditContainer}>
                      <View style={styles.imagePreviewBox}>
                        {editForm.imageUri ? (
                          <Image source={{ uri: editForm.imageUri }} style={styles.imagePreview} resizeMode="contain" />
                        ) : (
                          <Text style={styles.imagePreviewText}>{editForm.image}</Text>
                        )}
                      </View>
                      <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
                        <Text style={styles.pickImageButtonText}>📷 Pick Image</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.imageEditInput}
                        value={editForm.image}
                        onChangeText={(text) => setEditForm({...editForm, image: text})}
                        placeholder="Or paste emoji"
                        placeholderTextColor="#999"
                        maxLength={5}
                      />
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Vehicle Info</Text>
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Name</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editForm.name}
                        onChangeText={(text) => setEditForm({...editForm, name: text})}
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Brand</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editForm.brand}
                        onChangeText={(text) => setEditForm({...editForm, brand: text})}
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Year</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editForm.year}
                        onChangeText={(text) => setEditForm({...editForm, year: text})}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Transmission</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editForm.transmission}
                        onChangeText={(text) => setEditForm({...editForm, transmission: text})}
                      />
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Pricing & Location</Text>
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Price/Day ($)</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editForm.pricePerDay}
                        onChangeText={(text) => setEditForm({...editForm, pricePerDay: text})}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Location</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editForm.location}
                        onChangeText={(text) => setEditForm({...editForm, location: text})}
                      />
                    </View>
                  </View>

                  <View style={styles.editActionButtons}>
                    <TouchableOpacity style={styles.cancelEditButton} onPress={handleCancel}>
                      <Text style={styles.cancelEditButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveEditButton} onPress={handleSave}>
                      <Text style={styles.saveEditButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
          <View style={styles.vehicleDetailRight}>
            <View style={styles.vehicleDetailImageContainer}>
              {isEditing ? (
                editForm.imageUri ? (
                  <Image source={{ uri: editForm.imageUri }} style={styles.vehicleDetailImage} resizeMode="contain" />
                ) : (
                  <View style={styles.vehicleDetailImageFallback}>
                    <Text style={styles.vehicleEmojiLarge}>{editForm.image}</Text>
                  </View>
                )
              ) : (
                vehicle.imageUri ? (
                  <Image source={{ uri: vehicle.imageUri }} style={styles.vehicleDetailImage} resizeMode="contain" />
                ) : (
                  <View style={styles.vehicleDetailImageFallback}>
                    <Text style={styles.vehicleEmojiLarge}>{vehicle.image}</Text>
                  </View>
                )
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.closeFloating} onPress={onClose}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const AddVehicleModal = ({ visible, onClose, onSave, editingVehicle }) => {
  const [name, setName] = useState(editingVehicle?.name || '');
  const [brand, setBrand] = useState(editingVehicle?.brand || '');
  const [type, setType] = useState(editingVehicle?.type || 'Sedan');
  const [year, setYear] = useState(editingVehicle?.year?.toString() || '2024');
  const [pricePerDay, setPricePerDay] = useState(editingVehicle?.pricePerDay?.toString() || '');
  const [location, setLocation] = useState(editingVehicle?.location || 'New York');
  const [seats, setSeats] = useState(editingVehicle?.seats?.toString() || '5');
  const [transmission, setTransmission] = useState(editingVehicle?.transmission || 'Automatic');
  const [features, setFeatures] = useState(editingVehicle?.features?.join(', ') || '');

  React.useEffect(() => {
    if (editingVehicle) {
      setName(editingVehicle.name || '');
      setBrand(editingVehicle.brand || '');
      setType(editingVehicle.type || 'Sedan');
      setYear(editingVehicle.year?.toString() || '2024');
      setPricePerDay(editingVehicle.pricePerDay?.toString() || '');
      setLocation(editingVehicle.location || 'New York');
      setSeats(editingVehicle.seats?.toString() || '5');
      setTransmission(editingVehicle.transmission || 'Automatic');
      setFeatures(editingVehicle.features?.join(', ') || '');
    } else {
      setName('');
      setBrand('');
      setType('Sedan');
      setYear('2024');
      setPricePerDay('');
      setLocation('New York');
      setSeats('5');
      setTransmission('Automatic');
      setFeatures('');
    }
  }, [editingVehicle, visible]);

  const handleSave = () => {
    if (!name || !brand || !pricePerDay) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const vehicleData = {
      name,
      brand,
      type,
      year: parseInt(year),
      pricePerDay: parseInt(pricePerDay),
      location,
      seats: parseInt(seats),
      transmission,
      features: features.split(',').map(f => f.trim()).filter(f => f),
      image: type === 'SUV' ? '🚙' : type === 'Sports' ? '🏎️' : '🚗',
    };

    onSave(vehicleData);
    onClose();
  };

  const typeOptions = vehicleTypes.filter(t => t !== 'All');
  const locationOptions = locations.filter(l => l !== 'All');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScrollView}>
            <Text style={styles.inputLabel}>Vehicle Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Tesla Model 3"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Brand *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Tesla"
              placeholderTextColor="#888"
              value={brand}
              onChangeText={setBrand}
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.optionContainer}>
              {typeOptions.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.optionButton, type === t && styles.optionButtonActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.optionText, type === t && styles.optionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={year}
                  onChangeText={setYear}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Price/Day *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={pricePerDay}
                  onChangeText={setPricePerDay}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionContainer}>
                {locationOptions.map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.optionButton, location === l && styles.optionButtonActive]}
                    onPress={() => setLocation(l)}
                  >
                    <Text style={[styles.optionText, location === l && styles.optionTextActive]}>
                      {l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Seats</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={seats}
                  onChangeText={setSeats}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Transmission</Text>
                <View style={styles.optionContainer}>
                  {['Automatic', 'Manual'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.smallOptionButton, transmission === t && styles.optionButtonActive]}
                      onPress={() => setTransmission(t)}
                    >
                      <Text style={[styles.optionText, transmission === t && styles.optionTextActive]}>
                        {t.substring(0, 4)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Features (comma separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., GPS, Bluetooth, Leather Seats"
              placeholderTextColor="#888"
              value={features}
              onChangeText={setFeatures}
              multiline
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingVehicle ? 'Update' : 'Add Vehicle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const OwnerDashboard = () => {
  const { user, logout } = useAuth();
  const { getOwnerVehicles, addVehicle, updateVehicle, deleteVehicle, getOwnerRentals, vehicles } = useVehicles();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const ownerVehicles = useMemo(() => {
    return getOwnerVehicles(user?.id);
  }, [user?.id, vehicles]);

  const filteredVehicles = useMemo(() => {
    if (!searchQuery) return ownerVehicles;
    const query = searchQuery.toLowerCase();
    return ownerVehicles.filter(
      v => v.name.toLowerCase().includes(query) || v.brand.toLowerCase().includes(query)
    );
  }, [ownerVehicles, searchQuery]);

  const stats = useMemo(() => {
    const total = ownerVehicles.length;
    const available = ownerVehicles.filter(v => v.available).length;
    const rented = total - available;
    return { total, available, rented };
  }, [ownerVehicles]);

  const handleAddVehicle = (vehicleData) => {
    addVehicle(vehicleData, user.id, user.name);
    Alert.alert('Success', 'Vehicle added successfully!');
  };

  const handleEditVehicle = (vehicleData) => {
    updateVehicle(vehicleData.id, vehicleData);
    Alert.alert('Success', 'Vehicle updated successfully!');
  };

  const handleDelete = (vehicle) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteVehicle(vehicle.id);
            Alert.alert('Deleted', 'Vehicle has been removed');
          },
        },
      ]
    );
  };

  const handleToggleAvailability = (vehicle) => {
    updateVehicle(vehicle.id, { available: !vehicle.available });
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your vehicles..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleTile
            vehicle={item}
            onPress={(v) => setSelectedVehicle(v)}
          />
        )}
        numColumns={4}
        columnWrapperStyle={styles.tileRow}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🚗</Text>
            <Text style={styles.emptyText}>No vehicles yet</Text>
            <Text style={styles.emptySubtext}>Add your first vehicle to start earning</Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={openAddModal}>
              <Text style={styles.emptyAddButtonText}>+ Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <AddVehicleModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingVehicle(null);
        }}
        onSave={editingVehicle ? handleEditVehicle : handleAddVehicle}
        editingVehicle={editingVehicle}
      />

      <VehicleDetailModal
        visible={!!selectedVehicle}
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onEdit={handleEditVehicle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(63,155,132,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: COLORS.teal,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: COLORS.teal,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.teal,
  },
  orangeText: {
    color: '#ffa502',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textDark,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 20,
    marginBottom: 10,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: COLORS.textDark,
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  tileRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vehicleTile: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginHorizontal: 2,
  },
  tileImageContainer: {
    width: '100%',
    height: '75%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  tileEmoji: {
    fontSize: 28,
  },
  tileLabel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  vehicleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  vehicleImageContainer: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
    borderRadius: 8,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  vehicleEmoji: {
    fontSize: 30,
  },
  vehicleInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 6,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
  },
  availabilityBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.12)',
  },
  availabilityText: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: '600',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  unavailableText: {
    color: COLORS.danger,
  },
  vehicleBrand: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  vehicleDetails: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  vehicleDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.teal,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  editButton: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  editButtonText: {
    color: COLORS.teal,
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  formScrollView: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textDark,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  smallOptionButton: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(63,155,132,0.12)',
    borderColor: COLORS.teal,
  },
  optionText: {
    color: '#6b7280',
    fontSize: 13,
  },
  optionTextActive: {
    color: COLORS.teal,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  cancelButtonText: {
    color: COLORS.teal,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: COLORS.teal,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  vehicleDetailModalContent: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: undefined,
  },
  vehicleDetailLeft: {
    width: '50%',
    padding: 24,
    paddingTop: 16,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  vehicleDetailRight: {
    width: '50%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetailImageContainer: {
    width: 320,
    height: 360,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetailImage: {
    width: '100%',
    height: '100%',
  },
  vehicleDetailImageFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleEmojiLarge: {
    fontSize: 72,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  detailSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 6,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.textDark,
    marginTop: 10,
  },
  detailDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 12,
  },
  closeFloating: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    zIndex: 100,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  editActionButton: {
    marginTop: 16,
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editActionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  detailsScrollView: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
  },
  detailSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  priceValue: {
    color: COLORS.teal,
    fontSize: 16,
  },
  statusBadgeDetail: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableBadgeDetail: {
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  rentedBadgeDetail: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  statusTextDetail: {
    fontSize: 11,
    fontWeight: '600',
  },
  availableTextDetail: {
    color: COLORS.text,
  },
  rentedTextDetail: {
    color: '#ff6b6b',
  },
  featuresList: {
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 18,
  },
  editingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  imageEditContainer: {
    alignItems: 'center',
    gap: 12,
  },
  imagePreviewBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imagePreviewText: {
    fontSize: 56,
  },
  imageEditInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textDark,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    width: '100%',
    textAlign: 'center',
  },
  pickImageButton: {
    backgroundColor: COLORS.teal,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginVertical: 8,
  },
  pickImageButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textDark,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  editActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  cancelEditButtonText: {
    color: COLORS.textDark,
    fontWeight: '600',
    fontSize: 14,
  },
  saveEditButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.teal,
  },
  saveEditButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  vehicleDetailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
  },
});

export default OwnerDashboard;
