import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Modal,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
  bg: '#f8fafc',
  white: '#ffffff',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  teal: '#3F9B84',
  mint: '#6FD8BF',
  success: '#808080',
  danger: '#ef4444',
};

const UserCard = ({ user, onViewDetails }) => (
  <TouchableOpacity style={styles.userCard} onPress={() => onViewDetails(user)}>
    <View style={styles.userAvatar}>
      <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
    </View>
    <View style={styles.userInfo}>
      <Text style={styles.userName}>{user.name}</Text>
      <Text style={styles.userEmail}>{user.email}</Text>
      <View style={[styles.roleBadge, user.role === 'owner' ? styles.ownerBadge : user.role === 'admin' ? styles.adminBadge : styles.renterBadge]}>
        <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const VehicleAdminCard = ({ vehicle, onPress }) => (
  <TouchableOpacity style={styles.vehicleCard} onPress={() => onPress && onPress(vehicle)}>
    <View style={styles.vehicleImageContainer}>
      {vehicle.imageUri ? (
        <Image source={{ uri: vehicle.imageUri }} style={styles.vehicleImage} resizeMode="cover" />
      ) : (
        <Text style={styles.vehicleEmoji}>{vehicle.image}</Text>
      )}
    </View>
    <View style={styles.vehicleInfo}>
      <Text style={styles.vehicleName}>{vehicle.name}</Text>
      <Text style={styles.vehicleBrand}>{vehicle.brand} • {vehicle.year}</Text>
      <View style={styles.vehicleDetails}>
        <Text style={styles.vehicleDetail}>📍 {vehicle.location}</Text>
        <Text style={styles.vehicleDetail}>💰 ${vehicle.pricePerDay}/day</Text>
      </View>
      <Text style={styles.ownerName}>Owner: {vehicle.ownerName}</Text>
      <View style={[styles.statusBadge, vehicle.available ? styles.availableBadge : styles.rentedBadge]}>
        <Text style={[styles.statusText, vehicle.available ? styles.availableText : styles.rentedText]}>
          {vehicle.available ? 'Available' : 'Rented'}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const UserDetailModal = ({ visible, user, onClose, vehicles }) => {
  if (!user) return null;

  const userVehicles = user.role === 'owner' 
    ? vehicles.filter(v => v.ownerId === user.id)
    : [];

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
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.userDetailHeader}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.detailName}>{user.name}</Text>
              <Text style={styles.detailEmail}>{user.email}</Text>
              <View style={[styles.roleBadgeLarge, user.role === 'owner' ? styles.ownerBadge : user.role === 'admin' ? styles.adminBadge : styles.renterBadge]}>
                <Text style={styles.roleTextLarge}>{user.role.toUpperCase()}</Text>
              </View>
            </View>

            {user.role === 'owner' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Listed Vehicles ({userVehicles.length})</Text>
                {userVehicles.length > 0 ? (
                  userVehicles.map(vehicle => (
                    <View key={vehicle.id} style={styles.miniVehicleCard}>
                      <Text style={styles.miniVehicleEmoji}>{vehicle.image}</Text>
                      <View style={styles.miniVehicleInfo}>
                        <Text style={styles.miniVehicleName}>{vehicle.name}</Text>
                        <Text style={styles.miniVehiclePrice}>${vehicle.pricePerDay}/day</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No vehicles listed</Text>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Info</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue}>{user.id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{user.role}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, styles.activeStatus]}>Active</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const AdminDashboard = () => {
  const { user, logout, users } = useAuth();
  const { vehicles, rentals, updateVehicle } = useVehicles();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const stats = useMemo(() => {
    const totalUsers = users.filter(u => u.role !== 'admin').length;
    const owners = users.filter(u => u.role === 'owner').length;
    const renters = users.filter(u => u.role === 'renter').length;
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.available).length;
    const activeRentals = rentals.filter(r => r.status === 'active').length;
    const totalRevenue = vehicles.reduce((sum, v) => sum + v.pricePerDay, 0) * 30; // Estimated monthly

    return { totalUsers, owners, renters, totalVehicles, availableVehicles, activeRentals, totalRevenue };
  }, [users, vehicles, rentals]);

  const filteredUsers = useMemo(() => {
    const nonAdminUsers = users.filter(u => u.role !== 'admin');
    if (!searchQuery) return nonAdminUsers;
    const query = searchQuery.toLowerCase();
    return nonAdminUsers.filter(
      u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const filteredVehicles = useMemo(() => {
    if (!searchQuery) return vehicles;
    const query = searchQuery.toLowerCase();
    return vehicles.filter(
      v => v.name.toLowerCase().includes(query) || 
           v.brand.toLowerCase().includes(query) ||
           v.ownerName.toLowerCase().includes(query)
    );
  }, [vehicles, searchQuery]);

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionHeader}>📊 Platform Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGray]}>
          <Text style={styles.statIcon}>🚗</Text>
          <Text style={styles.statNumber}>{stats.totalVehicles}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        <View style={[styles.statCard, styles.statCardOrange]}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statNumber}>{stats.activeRentals}</Text>
          <Text style={styles.statLabel}>Active Rentals</Text>
        </View>
        <View style={[styles.statCard, styles.statCardPurple]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statNumber}>{stats.availableVehicles}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>

      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>User Breakdown</Text>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{stats.owners}</Text>
            <Text style={styles.breakdownLabel}>Owners</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{stats.renters}</Text>
            <Text style={styles.breakdownLabel}>Renters</Text>
          </View>
        </View>
      </View>

      <View style={styles.revenueCard}>
        <Text style={styles.revenueTitle}>💰 Estimated Monthly Revenue</Text>
        <Text style={styles.revenueAmount}>${stats.totalRevenue.toLocaleString()}</Text>
        <Text style={styles.revenueSubtext}>Based on current listings</Text>
      </View>

      <Text style={styles.sectionHeader}>🆕 Recent Vehicles</Text>
      {vehicles.slice(0, 3).map(vehicle => (
        <VehicleAdminCard key={vehicle.id} vehicle={vehicle} onPress={(v) => setSelectedVehicle(v)} />
      ))}
    </ScrollView>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserCard user={item} onViewDetails={setSelectedUser} />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👤</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );

  const renderVehicles = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicles..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VehicleAdminCard vehicle={item} onPress={(v) => setSelectedVehicle(v)} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🚗</Text>
            <Text style={styles.emptyText}>No vehicles found</Text>
          </View>
        }
      />
    </View>
  );

  const VehicleDetailModal = ({ visible, vehicle, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
      name: vehicle?.name || '',
      brand: vehicle?.brand || '',
      year: vehicle?.year?.toString() || '',
      pricePerDay: vehicle?.pricePerDay?.toString() || '',
      location: vehicle?.location || '',
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
        image: editForm.image,
        imageUri: editForm.imageUri,
      };
      updateVehicle(vehicle.id, updatedVehicle);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditForm({
        name: vehicle.name || '',
        brand: vehicle.brand || '',
        year: vehicle.year?.toString() || '',
        pricePerDay: vehicle.pricePerDay?.toString() || '',
        location: vehicle.location || '',
        image: vehicle.image || '🚗',
        imageUri: vehicle.imageUri || null,
      });
      setIsEditing(false);
    };
    return (
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
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
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Owner</Text>
                        <Text style={styles.detailValue}>{vehicle.ownerName}</Text>
                      </View>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.adminBadge}>👨‍💼 ADMIN</Text>
          <Text style={styles.greeting}>Hello, {user?.name}</Text>
          <Text style={styles.headerSubtitle}>Platform Management</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => { setActiveTab('overview'); setSearchQuery(''); }}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => { setActiveTab('users'); setSearchQuery(''); }}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
          onPress={() => { setActiveTab('vehicles'); setSearchQuery(''); }}
        >
          <Text style={[styles.tabText, activeTab === 'vehicles' && styles.activeTabText]}>Vehicles</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'vehicles' && renderVehicles()}

      <UserDetailModal
        visible={!!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        vehicles={vehicles}
      />
      
      <VehicleDetailModal
        visible={!!selectedVehicle}
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
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
    padding: 12,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  adminBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    color: COLORS.teal,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: COLORS.teal,
    fontWeight: '600',
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardPrimary: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4da6ff',
  },
  tabText: {
    color: '#888',
  },
  earningsCard: {
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTabText: {
    color: COLORS.teal,
  },
  tabContent: {
    flex: 1,
  },
  sectionHeader: {
    fontWeight: '600',
    color: COLORS.text,
    padding: 15,
    paddingBottom: 10,
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statCardBlue: {
    backgroundColor: 'rgba(77, 166, 255, 0.15)',
  },
  statCardGray: {
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  statCardOrange: {
    backgroundColor: 'rgba(255, 165, 2, 0.15)',
  },
  statCardPurple: {
    backgroundColor: 'rgba(156, 89, 255, 0.15)',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },
  breakdownSection: {
    backgroundColor: COLORS.white,
    margin: 15,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a2c5e',
    marginBottom: 15,
    textAlign: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.teal,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  breakdownDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e5e7eb',
  },
  revenueCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  revenueTitle: {
    fontSize: 16,
    color: COLORS.teal,
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.teal,
    marginVertical: 10,
  },
  revenueSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  searchContainer: {
    padding: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
    paddingTop: 0,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.teal,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  ownerBadge: {
    backgroundColor: 'rgba(255, 165, 2, 0.12)',
  },
  renterBadge: {
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  adminBadge: {
    backgroundColor: 'rgba(77, 166, 255, 0.12)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffa502',
  },
  vehicleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vehicleImageContainer: {
    width: 80,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleEmoji: {
    fontSize: 35,
  },
  vehicleInfo: {
    flex: 1,
    padding: 12,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  vehicleBrand: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  vehicleDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 15,
  },
  vehicleDetail: {
    fontSize: 11,
    color: COLORS.muted,
  },
  ownerName: {
    fontSize: 11,
    color: COLORS.teal,
    marginTop: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  availableBadge: {
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  rentedBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  availableText: {
    color: COLORS.text,
  },
  rentedText: {
    color: COLORS.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  vehicleDetailModalContent: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: COLORS.white,
  },
  vehicleDetailLeft: {
    width: '50%',
    padding: 24,
    paddingTop: 16,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
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
    color: COLORS.text,
    flex: 1,
  },
  detailSubtitle: {
    fontSize: 15,
    color: COLORS.muted,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
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
    color: COLORS.danger,
  },
  editingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
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
    borderColor: COLORS.border,
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
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.text,
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  cancelEditButtonText: {
    color: COLORS.text,
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
  closeFloating: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    zIndex: 100,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.muted,
  },
  modalScrollView: {
    padding: 20,
  },
  userDetailHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  largeAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.teal,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailEmail: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 5,
  },
  roleBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  roleTextLarge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffa502',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  miniVehicleCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniVehicleEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  miniVehicleInfo: {
    flex: 1,
  },
  miniVehicleName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  miniVehiclePrice: {
    fontSize: 12,
    color: COLORS.teal,
    marginTop: 2,
  },
  noDataText: {
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    color: COLORS.muted,
    fontSize: 14,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatus: {
    color: COLORS.text
  },
});

export default AdminDashboard;
