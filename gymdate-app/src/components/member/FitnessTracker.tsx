import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Modal,
  Alert 
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  Flame, 
  Droplet, 
  Footprints, 
  Scale, 
  Plus, 
  Minus, 
  Check 
} from 'lucide-react-native';

export const FitnessTracker: React.FC = () => {
  const { 
    fitnessMetrics, 
    updateWaterIntake, 
    updateSteps, 
    addWeightLog, 
    userProfile 
  } = useGymDate();

  const [weightInput, setWeightInput] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);

  const handleWeightSubmit = () => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    addWeightLog(val);
    setWeightInput('');
    setShowWeightModal(false);
    Alert.alert('Weight Logged', `Logged weight of ${val}kg. Core BMI re-calculated!`);
  };

  const waterPercent = Math.min(100, Math.round((fitnessMetrics.waterIntake / fitnessMetrics.waterGoal) * 100));
  const stepsPercent = Math.min(100, Math.round((fitnessMetrics.steps / fitnessMetrics.stepsGoal) * 100));
  const calsPercent = Math.min(100, Math.round((fitnessMetrics.caloriesBurned / fitnessMetrics.caloriesGoal) * 100));

  // Determine heights for premium capsule weight graph
  const weights = fitnessMetrics.weightLog.map(d => d.weight);
  const minWeight = Math.min(...weights) - 0.5;
  const maxWeight = Math.max(...weights) + 0.5;
  const weightRange = maxWeight - minWeight || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Title */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.titleText}>Daily Tracker</Text>
            <Text style={styles.descText}>Monitor weight progression, steps, & calorie burns.</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowWeightModal(true)}
            style={styles.logWeightBtn}
          >
            <Scale size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 1. THREE DYNAMIC PROGRESS WIDGET CAPSULES */}
      <View style={styles.metricsRow}>
        {/* Calorie Gauge */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBoxSecondary}>
              <Flame size={14} color={THEME.COLORS.secondary} />
            </View>
            <Text style={styles.percentTextSecondary}>{calsPercent}%</Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>Burn Goal</Text>
            <Text style={styles.metricVal}>{fitnessMetrics.caloriesBurned} kcal</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBarSecondary, { width: `${calsPercent}%` }]} />
          </View>
        </View>

        {/* Steps Gauge */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBoxSuccess}>
              <Footprints size={14} color={THEME.COLORS.success} />
            </View>
            <Text style={styles.percentTextSuccess}>{stepsPercent}%</Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>Daily Steps</Text>
            <Text style={styles.metricVal}>{fitnessMetrics.steps.toLocaleString()}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBarSuccess, { width: `${stepsPercent}%` }]} />
          </View>
        </View>

        {/* Water Gauge */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBoxInfo}>
              <Droplet size={14} color={THEME.COLORS.info} />
            </View>
            <Text style={styles.percentTextInfo}>{waterPercent}%</Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>Hydration</Text>
            <Text style={styles.metricVal}>{fitnessMetrics.waterIntake} ml</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBarInfo, { width: `${waterPercent}%` }]} />
          </View>
        </View>
      </View>

      {/* 2. DYNAMIC RESPONSIVE CAPSULE WEIGHT PROGRESS GRAPH */}
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Text style={styles.graphLabel}>Weight Progression Tracker</Text>
          <Text style={styles.graphSub}>Last 5 logs</Text>
        </View>

        {/* Customized pure CSS capsule weight curves */}
        <View style={styles.chartBlock}>
          {fitnessMetrics.weightLog.map((item, idx) => {
            const heightPercent = Math.max(15, Math.round(((item.weight - minWeight) / weightRange) * 100));
            return (
              <View key={idx} style={styles.chartColumn}>
                {/* Weight badge label on peak */}
                <View style={styles.peakBadge}>
                  <Text style={styles.peakBadgeText}>{item.weight}kg</Text>
                </View>
                {/* Glowing capsule bar */}
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { height: `${heightPercent}%` }]} />
                </View>
                {/* X axis date */}
                <Text style={styles.xAxisText}>{item.date}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.bmiSummaryRow}>
          <Text style={styles.bmiLabel}>Body Mass Index (BMI):</Text>
          <View style={styles.bmiBadge}>
            <Text style={styles.bmiBadgeText}>{userProfile.bmi}</Text>
          </View>
        </View>
      </View>

      {/* 3. SIMULATOR live adjusters */}
      <View style={styles.adjustersBlock}>
        <Text style={styles.sectionTitle}>Simulate Live Activity</Text>
        
        {/* Water adjustment controls */}
        <View style={styles.adjusterCard}>
          <View>
            <Text style={styles.adjusterName}>Drink Water</Text>
            <Text style={styles.adjusterSub}>Standard intake goal: 3,500ml</Text>
          </View>
          <View style={styles.adjusterControls}>
            <TouchableOpacity 
              onPress={() => updateWaterIntake(-250)}
              style={styles.adjBtn}
            >
              <Minus size={12} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.adjValText}>+250ml</Text>
            <TouchableOpacity 
              onPress={() => updateWaterIntake(250)}
              style={styles.adjBtn}
            >
              <Plus size={12} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Walk steps simulation buttons */}
        <View style={styles.adjusterCard}>
          <View>
            <Text style={styles.adjusterName}>Step Counter</Text>
            <Text style={styles.adjusterSub}>Calculates caloric burn values.</Text>
          </View>
          <View style={styles.stepBtnRow}>
            <TouchableOpacity 
              onPress={() => updateSteps(1000)}
              style={styles.stepBtnSecondary}
            >
              <Text style={styles.stepBtnSecondaryText}>+1,000</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => updateSteps(2500)}
              style={styles.stepBtnPrimary}
            >
              <Text style={styles.stepBtnPrimaryText}>+2,500</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= MODAL: WEIGHT LOG INPUT ================= */}
      <Modal visible={showWeightModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Active Weight</Text>
              <Text style={styles.modalSub}>Updates logs and recomputes BMI compositing.</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Weight in Kilograms (kg)</Text>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="e.g. 76.5"
                placeholderTextColor={THEME.COLORS.textMuted}
                keyboardType="numeric"
                style={styles.textInput}
                autoFocus
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                onPress={() => setShowWeightModal(false)} 
                style={styles.modalSecondaryBtn}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleWeightSubmit} 
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>Log Weight</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.bgDark,
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 20,
  },
  descText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  logWeightBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    height: 120,
    flexShrink: 0,
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBoxSecondary: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(254, 110, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSuccess: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 199, 88, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxInfo: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(48, 128, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentTextSecondary: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.COLORS.secondary,
    fontFamily: 'monospace',
  },
  percentTextSuccess: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.COLORS.success,
    fontFamily: 'monospace',
  },
  percentTextInfo: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.COLORS.info,
    fontFamily: 'monospace',
  },
  metricLabel: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  metricVal: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  progressBarSecondary: {
    height: '100%',
    backgroundColor: THEME.COLORS.secondary,
  },
  progressBarSuccess: {
    height: '100%',
    backgroundColor: THEME.COLORS.success,
  },
  progressBarInfo: {
    height: '100%',
    backgroundColor: THEME.COLORS.info,
  },
  graphContainer: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 20,
    gap: 16,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  graphLabel: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  graphSub: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
  },
  chartBlock: {
    height: 110,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  peakBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  peakBadgeText: {
    color: '#000000',
    fontSize: 7,
    fontWeight: '900',
  },
  chartBarTrack: {
    width: 6,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 3,
    marginBottom: 6,
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 3,
  },
  xAxisText: {
    color: THEME.COLORS.textMuted,
    fontSize: 7,
    fontWeight: '600',
  },
  bmiSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  bmiLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
  },
  bmiBadge: {
    backgroundColor: 'rgba(0, 199, 88, 0.12)',
    borderColor: 'rgba(0, 199, 88, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bmiBadgeText: {
    color: THEME.COLORS.success,
    fontWeight: '800',
    fontSize: 10,
  },
  adjustersBlock: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  adjusterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 14,
    borderRadius: 20,
  },
  adjusterName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  adjusterSub: {
    color: THEME.COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  adjusterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjValText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 10,
    minWidth: 44,
    textAlign: 'center',
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtnSecondary: {
    borderColor: 'rgba(0, 199, 88, 0.25)',
    borderWidth: 1,
    backgroundColor: 'rgba(0, 199, 88, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  stepBtnSecondaryText: {
    color: THEME.COLORS.success,
    fontWeight: '800',
    fontSize: 9,
  },
  stepBtnPrimary: {
    backgroundColor: THEME.COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  stepBtnPrimaryText: {
    color: THEME.COLORS.textBlack,
    fontWeight: '900',
    fontSize: 9,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: 'rgba(229, 9, 20, 0.2)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '800',
    fontSize: 14,
  },
  modalSub: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#ffffff',
    fontSize: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 10,
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: THEME.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
  }
});
