import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Modal,
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


export default AdminDashboard;
