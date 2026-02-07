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
import { vehicleTypes, brands, locations } from '../data/vehicles';

const VehicleCard = ({ vehicle, onPress, showOwner = true }) => (
  <TouchableOpacity style={styles.vehicleCard} onPress={onPress}>
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
        <View style={[styles.availabilityBadge, !vehicle.available && styles.unavailableBadge]}>
          <Text style={[styles.availabilityText, !vehicle.available && styles.unavailableText]}>
            {vehicle.available ? 'Available' : 'Rented'}
          </Text>
        </View>
      </View>
      <Text style={styles.vehicleBrand}>{vehicle.brand} • {vehicle.year}</Text>
      <View style={styles.vehicleDetails}>
        <Text style={styles.vehicleDetail}>📍 {vehicle.location}</Text>
        <Text style={styles.vehicleDetail}>👥 {vehicle.seats} seats</Text>
        <Text style={styles.vehicleDetail}>⚙️ {vehicle.transmission}</Text>
      </View>
      <View style={styles.vehicleFeatures}>
        {vehicle.features.slice(0, 2).map((feature, index) => (
          <View key={index} style={styles.featureTag}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Per day</Text>
        <Text style={styles.price}>${vehicle.pricePerDay}</Text>
      </View>
      {showOwner && (
        <Text style={styles.ownerName}>Owner: {vehicle.ownerName}</Text>
      )}
    </View>
  </TouchableOpacity>
);

const FilterModal = ({ visible, onClose, filters, setFilters, onApply, onReset }) => {
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
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterScrollView}>
            <Text style={styles.filterLabel}>Vehicle Type</Text>
            <View style={styles.filterOptions}>
              {vehicleTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    filters.type === type && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, type })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.type === type && styles.filterOptionTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.filterLabel}>Brand</Text>
            <View style={styles.filterOptions}>
              {brands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  style={[
                    styles.filterOption,
                    filters.brand === brand && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, brand })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.brand === brand && styles.filterOptionTextActive,
                    ]}
                  >
                    {brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.filterLabel}>Location</Text>
            <View style={styles.filterOptions}>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.filterOption,
                    filters.location === location && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, location })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.location === location && styles.filterOptionTextActive,
                    ]}
                  >
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.filterLabel}>Price Range (per day)</Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={filters.minPrice}
                onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
              />
              <Text style={styles.priceSeparator}>to</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={filters.maxPrice}
                onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
              />
            </View>
            
            <Text style={styles.filterLabel}>Transmission</Text>
            <View style={styles.filterOptions}>
              {['All', 'Automatic', 'Manual'].map((trans) => (
                <TouchableOpacity
                  key={trans}
                  style={[
                    styles.filterOption,
                    filters.transmission === trans && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, transmission: trans })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.transmission === trans && styles.filterOptionTextActive,
                    ]}
                  >
                    {trans}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.resetButton} onPress={onReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const VehicleDetailModal = ({ visible, vehicle, onClose, onRent, isRenter }) => {
  if (!vehicle) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailModalContent}>
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          
          <ScrollView>
            <View style={styles.detailImageContainer}>
              <Text style={styles.detailEmoji}>{vehicle.image}</Text>
            </View>
            
            <Text style={styles.detailName}>{vehicle.name}</Text>
            <Text style={styles.detailBrand}>{vehicle.brand} • {vehicle.year}</Text>
            
            <View style={styles.detailPriceContainer}>
              <Text style={styles.detailPriceLabel}>Price per day</Text>
              <Text style={styles.detailPrice}>${vehicle.pricePerDay}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Specifications</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>📍</Text>
                  <Text style={styles.specLabel}>Location</Text>
                  <Text style={styles.specValue}>{vehicle.location}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>👥</Text>
                  <Text style={styles.specLabel}>Seats</Text>
                  <Text style={styles.specValue}>{vehicle.seats}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>⚙️</Text>
                  <Text style={styles.specLabel}>Transmission</Text>
                  <Text style={styles.specValue}>{vehicle.transmission}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>🚗</Text>
                  <Text style={styles.specLabel}>Type</Text>
                  <Text style={styles.specValue}>{vehicle.type}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Features</Text>
              <View style={styles.featuresContainer}>
                {vehicle.features.map((feature, index) => (
                  <View key={index} style={styles.featureTagLarge}>
                    <Text style={styles.featureTextLarge}>✓ {feature}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Owner</Text>
              <Text style={styles.ownerInfo}>{vehicle.ownerName}</Text>
            </View>
          </ScrollView>
          
          {isRenter && vehicle.available && (
            <TouchableOpacity style={styles.rentButton} onPress={onRent}>
              <Text style={styles.rentButtonText}>Rent This Car</Text>
            </TouchableOpacity>
          )}
          
          {isRenter && !vehicle.available && (
            <View style={styles.unavailableButton}>
              <Text style={styles.unavailableButtonText}>Currently Unavailable</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const RenterDashboard = () => {
  const { user, logout } = useAuth();
  const { vehicles, rentVehicle } = useVehicles();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({
    type: 'All',
    brand: 'All',
    location: 'All',
    minPrice: '',
    maxPrice: '',
    transmission: 'All',
  });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          vehicle.name.toLowerCase().includes(query) ||
          vehicle.brand.toLowerCase().includes(query) ||
          vehicle.location.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type !== 'All' && vehicle.type !== filters.type) return false;

      // Brand filter
      if (filters.brand !== 'All' && vehicle.brand !== filters.brand) return false;

      // Location filter
      if (filters.location !== 'All' && vehicle.location !== filters.location) return false;

      // Price filter
      if (filters.minPrice && vehicle.pricePerDay < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && vehicle.pricePerDay > parseInt(filters.maxPrice)) return false;

      // Transmission filter
      if (filters.transmission !== 'All' && vehicle.transmission !== filters.transmission) return false;

      return true;
    });
  }, [vehicles, searchQuery, filters]);

  const handleRent = () => {
    if (selectedVehicle && user) {
      rentVehicle(
        selectedVehicle.id,
        user.id,
        user.name,
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      );
      Alert.alert('Success', `You have rented ${selectedVehicle.name}!`);
      setSelectedVehicle(null);
    }
  };

  const resetFilters = () => {
    setFilters({
      type: 'All',
      brand: 'All',
      location: 'All',
      minPrice: '',
      maxPrice: '',
      transmission: 'All',
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'All') count++;
    if (filters.brand !== 'All') count++;
    if (filters.location !== 'All') count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.transmission !== 'All') count++;
    return count;
  }, [filters]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name} 👋</Text>
          <Text style={styles.headerSubtitle}>Find your perfect ride</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cars..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>Total Cars</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{vehicles.filter(v => v.available).length}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredVehicles.length}</Text>
          <Text style={styles.statLabel}>Matching</Text>
        </View>
      </View>

      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={() => setSelectedVehicle(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No vehicles found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={() => setFilterModalVisible(false)}
        onReset={resetFilters}
      />

      <VehicleDetailModal
        visible={!!selectedVehicle}
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onRent={handleRent}
        isRenter={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f6f8fa',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#e94560',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#222',
  },
  filterButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 20,
  },
  filterBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#e94560',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  vehicleImageContainer: {
    width: 120,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleEmoji: {
    fontSize: 50,
  },
  vehicleInfo: {
    flex: 1,
    padding: 15,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  availabilityBadge: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  availabilityText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  unavailableText: {
    color: '#ff6b6b',
  },
  vehicleBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  vehicleDetails: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 10,
  },
  vehicleDetail: {
    fontSize: 12,
    color: '#666',
  },
  vehicleFeatures: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  featureTag: {
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    color: '#e94560',
    fontSize: 11,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e94560',
  },
  ownerName: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
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
    color: '#222',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  filterScrollView: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
    marginTop: 15,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    backgroundColor: '#f6f8fa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionActive: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    borderColor: '#e94560',
  },
  filterOptionText: {
    color: '#666',
    fontSize: 13,
  },
  filterOptionTextActive: {
    color: '#e94560',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priceSeparator: {
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  resetButtonText: {
    color: '#e94560',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#e94560',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  closeModalButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  detailImageContainer: {
    backgroundColor: '#f1f3f4',
    borderRadius: 20,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailEmoji: {
    fontSize: 80,
  },
  detailName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  detailBrand: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  detailPriceContainer: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  detailPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e94560',
    marginTop: 5,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specItem: {
    backgroundColor: '#f6f8fa',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    alignItems: 'center',
  },
  specIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  specLabel: {
    fontSize: 12,
    color: '#666',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginTop: 4,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTagLarge: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  featureTextLarge: {
    color: '#666',
    fontSize: 13,
  },
  ownerInfo: {
    fontSize: 16,
    color: '#222',
  },
  rentButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  unavailableButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  unavailableButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RenterDashboard;
