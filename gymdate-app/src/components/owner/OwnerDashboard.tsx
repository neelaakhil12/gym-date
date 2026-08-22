import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  Switch,
  Linking
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  QrCode, 
  DollarSign, 
  Users, 
  Clock, 
  Check, 
  AlertCircle,
  UserCheck,
  MapPin,
  TrendingUp,
  Building2,
  Calendar,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  Gift,
  Edit,
  Star,
  Copy,
  CreditCard,
  X,
  Share2,
  Menu,
  ArrowRight,
  CheckCircle2,
  Send,
  Upload
} from 'lucide-react-native';
import { apiService } from '../../services/apiService';

type DashboardTab = 'overview' | 'bookings' | 'wallet';

export const OwnerDashboard: React.FC = () => {
  const { 
    ownerProfile, 
    setOwnerProfile, 
    checkInUserByQR, 
    gyms, 
    userBookings,
    userProfile, 
    loginInput, 
    setCurrentRole, 
    setIsLoggedIn,
    setActiveScreen
  } = useGymDate();

  // Navigation & Drawer State
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // QR Checkin Terminal State
  const [showScanModal, setShowScanModal] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; memberName?: string } | null>(null);

  // Edit Details Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGymName, setEditGymName] = useState('');
  const [editGymLocation, setEditGymLocation] = useState('');
  const [editGymHours, setEditGymHours] = useState('');
  const [editGymDescription, setEditGymDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Operational & Promotional State
  const [isOpenStatus, setIsOpenStatus] = useState(true);
  const [hasOffer, setHasOffer] = useState(false);
  const [offerPercentage, setOfferPercentage] = useState('15');
  const [isUpdatingOffer, setIsUpdatingOffer] = useState(false);

  // Referral Wallet State
  const [copied, setCopied] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'upi'>('bank');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawIfsc, setWithdrawIfsc] = useState('');
  const [withdrawUpiId, setWithdrawUpiId] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');

  // Live Data State
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [liveStats, setLiveStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeMembers: 0,
    payoutPending: 0
  });
  const [partnerBookings, setPartnerBookings] = useState<any[]>([]);
  const [partnerGym, setPartnerGym] = useState<any>(null);

  const currentEmail = (loginInput || userProfile.email || '').toLowerCase();
  const activeGym = partnerGym || 
    gyms.find(g => 
      (ownerProfile.gymName && g.name.toLowerCase() === ownerProfile.gymName.toLowerCase()) ||
      (currentEmail && (g as any).owner_email?.toLowerCase() === currentEmail) ||
      (currentEmail.includes('sailakshmi') && g.name.toLowerCase().includes('national')) ||
      (currentEmail.includes('neelaakhil') && g.name.toLowerCase().includes('cult')) ||
      (currentEmail.includes('cult') && g.name.toLowerCase().includes('cult'))
    ) || (currentEmail.includes('sailakshmi') ? gyms.find(g => g.name.toLowerCase().includes('national')) : null)
    || gyms[0];

  const fetchLiveDashboard = async () => {
    setIsLoadingData(true);
    try {
      const email = loginInput || userProfile.email || 'neelaakhilkumar50@gmail.com';
      const data = await apiService.getPartnerDashboardData(email);
      
      let serverBookings: any[] = [];
      if (data && data.success) {
        if (data.bookings && data.bookings.length > 0) {
          serverBookings = data.bookings;
        }
        if (data.gym) {
          setPartnerGym(data.gym);
          setIsOpenStatus(data.gym.status !== 'Closed');
          setHasOffer(Boolean(data.gym.has_offer));
          if (data.gym.offer_percentage) {
            setOfferPercentage(String(data.gym.offer_percentage));
          }
        }
      }

      // Sync member bookings from app state for this gym
      const localGymBookings = (userBookings || [])
        .filter(b => !activeGym?.id || b.gymId === activeGym?.id || (b.gymName && activeGym?.name && b.gymName.toLowerCase() === activeGym.name.toLowerCase()))
        .map(b => ({
          id: b.id,
          customer_name: b.userName || userProfile.name || 'Member',
          plan_name: b.planName || 'Gym Pass',
          amount: String(b.price || b.planPrice || 350),
          created_at: b.date || b.bookingDate || new Date().toISOString(),
          status: b.status || 'Confirmed'
        }));

      // Combine unique bookings
      const allBookings = [...serverBookings];
      localGymBookings.forEach(lb => {
        if (!allBookings.some(sb => sb.id === lb.id)) {
          allBookings.push(lb);
        }
      });

      setPartnerBookings(allBookings);

      const netRev = allBookings.reduce((sum, b) => sum + (Number(b.amount || 0) * 0.9), 0);
      setLiveStats({
        totalRevenue: data?.stats?.totalRevenue || netRev,
        totalBookings: allBookings.length,
        activeMembers: allBookings.filter(b => (b.status || '').toLowerCase() !== 'cancelled').length,
        payoutPending: data?.stats?.payoutPending || netRev
      });
      setOwnerProfile(prev => ({
        ...prev,
        revenue: netRev,
        activeMembers: allBookings.length,
        payoutPending: netRev
      }));
    } catch (err) {
      console.warn('[OwnerDashboard] Failed to fetch live stats:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboard();
  }, [loginInput, userProfile.email, userBookings?.length, activeGym?.id]);

  useEffect(() => {
    if (activeGym) {
      setEditGymName(activeGym.name || 'cultfit gym');
      setEditGymLocation(activeGym.location || 'Hyderabad, Telangana');
      setEditGymHours(activeGym.timings || activeGym.hours || '06:00 AM - 10:00 PM');
      setEditGymDescription(activeGym.description || 'Premium fitness facility offering high-energy workouts and state-of-the-art strength gear.');
    }
  }, [activeGym]);

  const handleTerminalScan = () => {
    if (!terminalInput.trim()) return;

    const res = checkInUserByQR(terminalInput);
    setScanResult(res);

    if (res.success) {
      setTerminalInput('');
    }
  };

  const handleSaveGymDetails = () => {
    setIsSavingEdit(true);
    setTimeout(() => {
      setIsSavingEdit(false);
      setShowEditModal(false);
      setOwnerProfile(prev => ({ ...prev, gymName: editGymName }));
      if (partnerGym) {
        setPartnerGym({ ...partnerGym, name: editGymName, location: editGymLocation, description: editGymDescription });
      }
    }, 700);
  };

  const handleSaveOffer = () => {
    setIsUpdatingOffer(true);
    setTimeout(() => {
      setIsUpdatingOffer(false);
      if (Platform.OS === 'web') {
        alert('Promotional offer updated successfully!');
      }
    }, 600);
  };

  const handleCopyReferral = () => {
    const link = `https://gymdate.in/partner?ref=CULTFIT50`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdrawSubmit = () => {
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setWithdrawSuccessMsg('Withdrawal request submitted! Super Admin will approve shortly.');
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg('');
      }, 2500);
    }, 900);
  };

  const handleSignOut = () => {
    setCurrentRole('member');
    setIsLoggedIn(false);
    setActiveScreen('onboarding');
  };

  return (
    <View style={styles.outerContainer}>
      {/* 📱 SIDEBAR DRAWER OVERLAY (MOBILE RESPONSIVE MATCHING WEBSITE) */}
      {isSidebarOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity 
            style={styles.drawerBackdrop} 
            activeOpacity={1} 
            onPress={() => setIsSidebarOpen(false)} 
          />
          <View style={styles.drawerContent}>
            {/* Sidebar Brand Header */}
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.brandIconBox}>
                  <Building2 size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.brandTitle}>GymDate</Text>
                  <Text style={styles.brandSubtitle}>PARTNER PANEL</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)} style={styles.closeDrawerBtn}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Sidebar Navigation Items */}
            <View style={styles.drawerNavList}>
              <TouchableOpacity 
                style={[styles.drawerNavItem, activeTab === 'overview' && styles.drawerNavItemActive]}
                onPress={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              >
                <LayoutDashboard size={18} color={activeTab === 'overview' ? '#FFFFFF' : '#94A3B8'} />
                <Text style={[styles.drawerNavText, activeTab === 'overview' && styles.drawerNavTextActive]}>
                  My Gym Overview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.drawerNavItem, activeTab === 'bookings' && styles.drawerNavItemActive]}
                onPress={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }}
              >
                <CreditCard size={18} color={activeTab === 'bookings' ? '#FFFFFF' : '#94A3B8'} />
                <Text style={[styles.drawerNavText, activeTab === 'bookings' && styles.drawerNavTextActive]}>
                  Bookings & Revenue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.drawerNavItem, activeTab === 'wallet' && styles.drawerNavItemActive]}
                onPress={() => { setActiveTab('wallet'); setIsSidebarOpen(false); }}
              >
                <Wallet size={18} color={activeTab === 'wallet' ? '#FFFFFF' : '#94A3B8'} />
                <Text style={[styles.drawerNavText, activeTab === 'wallet' && styles.drawerNavTextActive]}>
                  Virtual Wallet
                </Text>
              </TouchableOpacity>
            </View>

            {/* Drawer Bottom Actions */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity 
                style={styles.drawerUserViewBtn}
                onPress={() => { setCurrentRole('member'); setIsSidebarOpen(false); }}
              >
                <Users size={16} color="#CBD5E1" />
                <Text style={styles.drawerUserViewText}>Switch to User View</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerLogoutBtn}
                onPress={handleSignOut}
              >
                <LogOut size={16} color="#EF4444" />
                <Text style={styles.drawerLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 🔝 TOP NAVIGATION BAR */}
      <View style={styles.topNavbar}>
        <TouchableOpacity 
          style={styles.menuToggleBtn} 
          onPress={() => setIsSidebarOpen(true)}
          activeOpacity={0.8}
        >
          <Menu size={22} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.navbarTabsRow}>
          <TouchableOpacity 
            style={[styles.navTabPill, activeTab === 'overview' && styles.navTabPillActive]}
            onPress={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={14} color={activeTab === 'overview' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.navTabPillText, activeTab === 'overview' && styles.navTabPillTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navTabPill, activeTab === 'wallet' && styles.navTabPillActive]}
            onPress={() => setActiveTab('wallet')}
          >
            <Gift size={14} color={activeTab === 'wallet' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.navTabPillText, activeTab === 'wallet' && styles.navTabPillTextActive]}>
              Referral & Wallet
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.navQrBtn}
          onPress={() => setShowScanModal(true)}
          activeOpacity={0.85}
        >
          <QrCode size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 📜 MAIN SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={{ paddingBottom: 90, paddingHorizontal: 16, paddingTop: 10 }}
        refreshControl={
          <RefreshControl refreshing={isLoadingData} onRefresh={fetchLiveDashboard} tintColor={THEME.COLORS.primary} />
        }
      >
        {/* ============================================================== */}
        {/* TAB 1: MY GYM OVERVIEW                                          */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <View style={styles.tabContentWrapper}>
            {/* Header Title & Action Buttons */}
            <View style={styles.overviewHeaderRow}>
              <View>
                <Text style={styles.pageTitle}>My Gym Overview</Text>
                <Text style={styles.pageSubtitle}>Manage your public listing and track your rating.</Text>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={styles.btnScanEntry}
                  onPress={() => setShowScanModal(true)}
                  activeOpacity={0.85}
                >
                  <QrCode size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnScanEntryText}>Scan Entry QR</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.btnEditDetails}
                  onPress={() => setShowEditModal(true)}
                  activeOpacity={0.85}
                >
                  <Edit size={14} color="#334155" style={{ marginRight: 6 }} />
                  <Text style={styles.btnEditDetailsText}>Edit Details</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 1. HERO GYM BANNER CARD */}
            <View style={styles.gymHeroCard}>
              <View style={styles.gymHeroImageContainer}>
                <Image 
                  source={{ uri: activeGym?.image || 'https://gymdate.in/uploads/gyms/1787212199835-j01we.png' }} 
                  style={styles.gymHeroImage}
                  resizeMode="cover"
                />
                <View style={styles.ratingBadge}>
                  <Star size={13} color="#EAB308" fill="#EAB308" style={{ marginRight: 4 }} />
                  <Text style={styles.ratingBadgeText}>{activeGym?.rating || '4.5'} ({activeGym?.reviews || '0'} reviews)</Text>
                </View>
              </View>

              <View style={styles.gymHeroDetails}>
                <Text style={styles.gymTitleText}>{activeGym?.name || 'cultfit gym'}</Text>
                <TouchableOpacity 
                  style={styles.locationLinkRow}
                  onPress={() => activeGym?.location && activeGym.location.startsWith('http') ? Linking.openURL(activeGym.location) : null}
                >
                  <MapPin size={14} color="#EF4444" style={{ marginRight: 5 }} />
                  <Text style={styles.locationLinkText} numberOfLines={1}>
                    {activeGym?.location || 'Hyderabad, Telangana'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.sectionHeading}>Description</Text>
                <Text style={styles.descriptionText}>
                  {activeGym?.description || 'Premium fitness facility offering high-energy workouts and state-of-the-art strength gear.'}
                </Text>
              </View>
            </View>

            {/* 2. OPERATIONAL STATUS & PROMOTIONS GRID */}
            <View style={styles.cardsGrid}>
              {/* OPERATIONAL STATUS CARD */}
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Operational Status</Text>
                <View style={styles.statusBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={18} color={isOpenStatus ? '#059669' : '#DC2626'} />
                    <View>
                      <Text style={[styles.statusText, { color: isOpenStatus ? '#059669' : '#DC2626' }]}>
                        {isOpenStatus ? 'Open' : 'Closed'}
                      </Text>
                      <Text style={styles.statusSubText}>
                        {isOpenStatus ? 'Visible to customers' : 'Temporarily paused'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.statusToggleBtn}
                    onPress={() => setIsOpenStatus(!isOpenStatus)}
                  >
                    <Text style={styles.statusToggleText}>
                      {isOpenStatus ? 'Close Gym' : 'Open Gym'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PROMOTIONAL OFFER CARD */}
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Promotional Offer</Text>
                <View style={styles.offerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerLabel}>Activate Discount</Text>
                    <Text style={styles.offerSub}>Apply to all memberships</Text>
                  </View>
                  <Switch 
                    value={hasOffer} 
                    onValueChange={setHasOffer}
                    trackColor={{ false: '#E2E8F0', true: '#EF4444' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {hasOffer && (
                  <View style={styles.offerInputWrapper}>
                    <Text style={styles.offerInputLabel}>Discount %</Text>
                    <TextInput 
                      value={offerPercentage}
                      onChangeText={setOfferPercentage}
                      keyboardType="numeric"
                      style={styles.offerTextInput}
                    />
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.saveOfferBtn}
                  onPress={handleSaveOffer}
                  disabled={isUpdatingOffer}
                >
                  {isUpdatingOffer ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveOfferBtnText}>Save Offer Settings</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* QUICK STATS CARD */}
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Quick Stats</Text>
                
                <View style={styles.quickStatRow}>
                  <Text style={styles.quickStatLabel}>Total Bookings</Text>
                  <Text style={styles.quickStatVal}>{liveStats.totalBookings}</Text>
                </View>
                
                <View style={styles.quickStatRow}>
                  <Text style={styles.quickStatLabel}>Total Net Revenue</Text>
                  <Text style={styles.quickStatValGreen}>₹{liveStats.totalRevenue.toLocaleString()}</Text>
                </View>

                <View style={[styles.quickStatRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.quickStatLabel}>Commission Rate</Text>
                  <Text style={styles.quickStatVal}>10%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: BOOKINGS & REVENUE                                       */}
        {/* ============================================================== */}
        {activeTab === 'bookings' && (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.pageTitle}>Bookings & Revenue</Text>
            <Text style={styles.pageSubtitle}>Live check-in history and revenue payouts breakdown.</Text>

            {/* Metrics Row */}
            <View style={styles.statsRow}>
              <View style={styles.statMetricCard}>
                <View style={styles.statMetricIconBoxGreen}>
                  <DollarSign size={18} color="#059669" />
                </View>
                <Text style={styles.statMetricLabel}>Net Revenue</Text>
                <Text style={styles.statMetricValGreen}>₹{liveStats.totalRevenue.toLocaleString()}</Text>
                <Text style={styles.statMetricSub}>After 10% platform share</Text>
              </View>

              <View style={styles.statMetricCard}>
                <View style={styles.statMetricIconBoxBlue}>
                  <Users size={18} color="#2563EB" />
                </View>
                <Text style={styles.statMetricLabel}>Active Passes</Text>
                <Text style={styles.statMetricValDark}>{liveStats.activeMembers}</Text>
                <Text style={styles.statMetricSub}>Confirmed entries</Text>
              </View>
            </View>

            {/* Bookings List Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Transactions</Text>
                <Text style={styles.countBadge}>{partnerBookings.length} Total</Text>
              </View>

              {partnerBookings.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                  <Users size={32} color="#CBD5E1" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>No Customer Bookings Yet</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                    Real-time member passes and customer transactions booked for your gym will appear here.
                  </Text>
                </View>
              ) : (
                partnerBookings.map((b, idx) => (
                  <View key={b.id || idx} style={styles.bookingRowItem}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.bookingUserName}>{b.customer_name || 'Gym Member'}</Text>
                      {b.customer_email ? (
                        <Text style={styles.bookingEmailText} numberOfLines={1}>{b.customer_email}</Text>
                      ) : null}
                      <Text style={styles.bookingUserPlan}>{b.plan_name || 'Yearly'} • {new Date(b.created_at || Date.now()).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Text style={styles.bookingAmountText}>₹{Number(b.amount || 0).toLocaleString()}</Text>
                      <View style={styles.confirmedPill}>
                        <Text style={styles.confirmedPillText}>{b.status || 'SUCCESS'}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 3: VIRTUAL WALLET & REFERRALS                               */}
        {/* ============================================================== */}
        {activeTab === 'wallet' && (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.pageTitle}>Referral & Virtual Wallet</Text>
            <Text style={styles.pageSubtitle}>Earn commissions by referring fellow gyms to the GymDate network.</Text>

            {/* Referral Wallet Card */}
            <View style={styles.walletHeroCard}>
              <View style={styles.walletHeaderRow}>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={styles.walletHeroLabel}>AVAILABLE REWARD BALANCE</Text>
                  <Text style={styles.walletHeroBalance}>₹0</Text>
                </View>
                <View style={styles.walletBadge}>
                  <Gift size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.walletBadgeText}>Partner Rewards</Text>
                </View>
              </View>

              <Text style={styles.walletHeroDesc}>
                Minimum withdrawal threshold: ₹1,500
              </Text>

              <TouchableOpacity 
                style={styles.withdrawBtn}
                onPress={() => setShowWithdrawModal(true)}
                activeOpacity={0.85}
              >
                <Send size={15} color="#0F172A" style={{ marginRight: 8 }} />
                <Text style={styles.withdrawBtnText}>Request Payout Withdrawal</Text>
              </TouchableOpacity>
            </View>

            {/* Referral Link Share Box */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Partner Referral Link</Text>
              <Text style={styles.cardDesc}>
                Share this link with other gym owners in India. Earn ₹200 bonus directly to your wallet for each approved gym!
              </Text>

              <View style={styles.referralLinkBox}>
                <Text style={styles.referralLinkText} numberOfLines={1}>
                  https://gymdate.in/partner?ref=CULTFIT50
                </Text>
                <TouchableOpacity 
                  style={styles.copyLinkBtn} 
                  onPress={handleCopyReferral}
                >
                  <Copy size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.copyLinkBtnText}>{copied ? 'COPIED!' : 'COPY'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 📷 IN-FRAME MODAL: SCAN ENTRY QR TERMINAL */}
      {showScanModal && (
        <View style={styles.inFrameModalOverlay}>
          <TouchableOpacity 
            style={styles.inFrameModalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowScanModal(false)} 
          />
          <View style={styles.inFrameModalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <QrCode size={18} color={THEME.COLORS.primary} />
                <Text style={styles.modalTitle}>Scan Entry QR Pass</Text>
              </View>
              <TouchableOpacity onPress={() => setShowScanModal(false)} style={{ padding: 4 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter or scan the customer's mobile app ticket code to validate entry.
            </Text>

            <View style={styles.qrInputRow}>
              <TextInput 
                value={terminalInput}
                onChangeText={(val) => { setTerminalInput(val); setScanResult(null); }}
                placeholder="e.g. GD-MEMBER-9988"
                placeholderTextColor="#94A3B8"
                style={styles.qrTextInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={styles.qrValidateBtn}
                onPress={handleTerminalScan}
              >
                <Text style={styles.qrValidateBtnText}>VALIDATE</Text>
              </TouchableOpacity>
            </View>

            {scanResult && (
              <View style={[styles.scanFeedbackCard, scanResult.success ? styles.scanSuccess : styles.scanError]}>
                <UserCheck size={18} color={scanResult.success ? '#059669' : '#DC2626'} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scanFeedbackTitle, { color: scanResult.success ? '#065F46' : '#991B1B' }]}>
                    {scanResult.success ? `Entry Approved: ${scanResult.memberName || 'Member'}` : 'Check-In Denied'}
                  </Text>
                  <Text style={[styles.scanFeedbackDesc, { color: scanResult.success ? '#047857' : '#B91C1C' }]}>
                    {scanResult.message}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setShowScanModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close Terminal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ✏️ IN-FRAME MODAL: EDIT GYM DETAILS */}
      {showEditModal && (
        <View style={styles.inFrameModalOverlay}>
          <TouchableOpacity 
            style={styles.inFrameModalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowEditModal(false)} 
          />
          <View style={styles.inFrameModalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Edit size={18} color={THEME.COLORS.primary} />
                <Text style={styles.modalTitle}>Edit Gym Details</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ padding: 4 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Gym Name</Text>
              <TextInput 
                value={editGymName}
                onChangeText={setEditGymName}
                style={styles.formInput}
              />
            </View>

            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Timings</Text>
              <TextInput 
                value={editGymHours}
                onChangeText={setEditGymHours}
                placeholder="06:00 AM - 10:00 PM"
                style={styles.formInput}
              />
            </View>

            <View style={styles.formFieldGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput 
                value={editGymDescription}
                onChangeText={setEditGymDescription}
                multiline
                numberOfLines={3}
                style={[styles.formInput, { height: 68, textAlignVertical: 'top' }]}
              />
            </View>

            <TouchableOpacity 
              style={styles.saveDetailsBtn}
              onPress={handleSaveGymDetails}
              disabled={isSavingEdit}
            >
              {isSavingEdit ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveDetailsBtnText}>Save Gym Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 💰 IN-FRAME MODAL: WITHDRAWAL REQUEST */}
      {showWithdrawModal && (
        <View style={styles.inFrameModalOverlay}>
          <TouchableOpacity 
            style={styles.inFrameModalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowWithdrawModal(false)} 
          />
          <View style={styles.inFrameModalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wallet size={18} color={THEME.COLORS.primary} />
                <Text style={styles.modalTitle}>Request Payout</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)} style={{ padding: 4 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {withdrawSuccessMsg ? (
              <View style={styles.successBanner}>
                <CheckCircle2 size={20} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.successBannerText}>{withdrawSuccessMsg}</Text>
              </View>
            ) : (
              <>
                <View style={styles.withdrawTypeTabs}>
                  <TouchableOpacity 
                    style={[styles.withdrawTypeTab, withdrawMethod === 'bank' && styles.withdrawTypeTabActive]}
                    onPress={() => setWithdrawMethod('bank')}
                  >
                    <Text style={[styles.withdrawTypeTabText, withdrawMethod === 'bank' && styles.withdrawTypeTabTextActive]}>
                      Bank Transfer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.withdrawTypeTab, withdrawMethod === 'upi' && styles.withdrawTypeTabActive]}
                    onPress={() => setWithdrawMethod('upi')}
                  >
                    <Text style={[styles.withdrawTypeTabText, withdrawMethod === 'upi' && styles.withdrawTypeTabTextActive]}>
                      UPI / QR
                    </Text>
                  </TouchableOpacity>
                </View>

                {withdrawMethod === 'bank' ? (
                  <View style={{ gap: 8 }}>
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Bank Name</Text>
                      <TextInput value={withdrawBankName} onChangeText={setWithdrawBankName} placeholder="HDFC, SBI, ICICI..." style={styles.formInput} />
                    </View>
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Account Number</Text>
                      <TextInput value={withdrawAccountNumber} onChangeText={setWithdrawAccountNumber} placeholder="0000 0000 0000" keyboardType="numeric" style={styles.formInput} />
                    </View>
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>IFSC Code</Text>
                      <TextInput value={withdrawIfsc} onChangeText={setWithdrawIfsc} placeholder="HDFC0001234" autoCapitalize="characters" style={styles.formInput} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>UPI ID / Mobile</Text>
                    <TextInput value={withdrawUpiId} onChangeText={setWithdrawUpiId} placeholder="partner@upi or 9876543210" style={styles.formInput} />
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.submitWithdrawBtn}
                  onPress={handleWithdrawSubmit}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitWithdrawBtnText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainScrollView: {
    flex: 1,
  },
  tabContentWrapper: {
    gap: 14,
  },

  /* TOP NAVBAR */
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuToggleBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  navbarTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 14,
    gap: 4,
  },
  navTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  navTabPillActive: {
    backgroundColor: '#0F172A',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)' }
    })
  },
  navTabPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  navTabPillTextActive: {
    color: '#FFFFFF',
  },
  navQrBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* DRAWER SIDEBAR */
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContent: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#0F172A',
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 18,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  closeDrawerBtn: {
    padding: 4,
  },
  drawerNavList: {
    gap: 8,
    marginTop: 20,
    flex: 1,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  drawerNavItemActive: {
    backgroundColor: '#EF4444',
  },
  drawerNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  drawerNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 16,
    gap: 10,
  },
  drawerUserViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  drawerUserViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  drawerLogoutText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },

  /* OVERVIEW HEADER */
  overviewHeaderRow: {
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  btnScanEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  btnScanEntryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnEditDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  btnEditDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  /* HERO GYM CARD */
  gymHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }
    })
  },
  gymHeroImageContainer: {
    height: 160,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  gymHeroImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B',
  },
  gymHeroDetails: {
    padding: 16,
  },
  gymTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  locationLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },

  /* CARDS GRID */
  cardsGrid: {
    gap: 12,
  },
  sideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sideCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '900',
  },
  statusSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  statusToggleBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },

  /* OFFER CARD */
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  offerSub: {
    fontSize: 10,
    color: '#64748B',
  },
  offerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  offerInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  offerTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 60,
    textAlign: 'center',
    fontWeight: '800',
  },
  saveOfferBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveOfferBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* QUICK STATS */
  quickStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  quickStatVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  quickStatValGreen: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
  },

  /* GENERIC CARD */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  countBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  /* STATS ROW */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statMetricIconBoxGreen: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statMetricIconBoxBlue: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statMetricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  statMetricValGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  statMetricValDark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  statMetricSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* BOOKINGS ITEMS */
  bookingRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bookingUserName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingEmailText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  bookingUserPlan: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bookingAmountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
  },
  confirmedPill: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  confirmedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },

  /* WALLET TAB */
  walletHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  walletHeroLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  walletHeroBalance: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  walletBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  walletHeroDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 10,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  referralLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 6,
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  referralLinkText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyLinkBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* IN-FRAME MODALS (STAYS STRICTLY INSIDE MOBILE SHELL) */
  inFrameModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  inFrameModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  inFrameModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 360,
    gap: 12,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }
    })
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  qrInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qrTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  qrValidateBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrValidateBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scanFeedbackCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
  },
  scanSuccess: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  scanError: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  scanFeedbackTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  scanFeedbackDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },

  /* EDIT DETAILS FORM */
  formFieldGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    color: '#0F172A',
  },
  saveDetailsBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveDetailsBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* WITHDRAWAL TABS */
  withdrawTypeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  withdrawTypeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  withdrawTypeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  withdrawTypeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  withdrawTypeTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  submitWithdrawBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitWithdrawBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  successBannerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  }
});
