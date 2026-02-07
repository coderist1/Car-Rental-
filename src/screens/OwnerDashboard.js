import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
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

export default OwnerDashboard;
