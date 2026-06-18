import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  Alert 
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { useTheme } from '../../useTheme';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Sparkles, 
  Award, 
  PlusCircle, 
  Image as ImageIcon,
  Menu 
} from 'lucide-react-native';

export const CommunityFeed: React.FC = () => {
  const { posts, addPost, toggleLikePost, addComment, userProfile, setActiveScreen } = useGymDate();
  const { isDark, bg } = useTheme();
  
  const [newPostText, setNewPostText] = useState('');
  const [selectedMockImage, setSelectedMockImage] = useState<string | undefined>(undefined);
  const [showPublisher, setShowPublisher] = useState(false);
  
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const mockFeedImages = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400'
  ];

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;
    
    addPost(newPostText, selectedMockImage);
    setNewPostText('');
    setSelectedMockImage(undefined);
    setShowPublisher(false);
    
    Alert.alert('Post Published', 'Your motivational update is now live on the fitness feed!');
  };

  const handleSendComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    
    addComment(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const earnedBadges = [
    { title: 'Multi-Explorer', desc: 'Booked slots at 2+ different gym brands', icon: '🚀' },
    { title: 'Hydration Star', desc: 'Reached water target 3 days consecutively', icon: '💧' },
    { title: 'Weight Shredder', desc: 'Logged weight progression over 2 weeks', icon: '🏆' }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Title */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleText}>Community Feed</Text>
            <Text style={styles.descText}>Interact with other gym members & expert coaches.</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!showPublisher && (
              <TouchableOpacity 
                onPress={() => setShowPublisher(true)}
                style={styles.pubBtn}
              >
                <PlusCircle size={18} color={THEME.COLORS.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setActiveScreen('profile')} 
              style={styles.pubBtn}
            >
              <Menu size={16} color={isDark ? '#ffffff' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 1. EARNED PROFILE BADGES */}
      {!showPublisher && (
        <View style={styles.badgesContainer}>
          <View style={styles.badgesHeader}>
            <Award size={12} color={THEME.COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.badgesLabel}>Earned Achievement Badges</Text>
          </View>

          <View style={styles.badgesGrid}>
            {earnedBadges.map((badge, idx) => (
              <View 
                key={idx} 
                style={styles.badgeCard}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeTitle} numberOfLines={1}>{badge.title}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 2. DYNAMIC POST PUBLISHER */}
      {showPublisher && (
        <View style={styles.publisherCard}>
          <View style={styles.publisherHeader}>
            <Text style={styles.publisherHeaderTitle}>Post Motivational Update</Text>
            <TouchableOpacity onPress={() => setShowPublisher(false)}>
              <Text style={styles.publisherHeaderCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            multiline
            numberOfLines={3}
            placeholder="What are your training schedules today? Share leg-day updates, calorie counts, or cardio goals..."
            placeholderTextColor={THEME.COLORS.textMuted}
            value={newPostText}
            onChangeText={setNewPostText}
            style={styles.pubInput}
          />

          {/* Mock Attached Images */}
          <View style={styles.imageSelectorBlock}>
            <Text style={styles.selectorLabel}>Attach Workout Image</Text>
            <View style={styles.mockImagesRow}>
              {mockFeedImages.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedMockImage(selectedMockImage === img ? undefined : img)}
                  style={[styles.mockImageBtn, selectedMockImage === img && styles.mockImageBtnActive]}
                >
                  <Image source={{ uri: img }} style={styles.mockImg} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.publishBtn} onPress={handleCreatePost}>
            <Text style={styles.publishBtnText}>Publish Post</Text>
            <Sparkles size={12} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. SOCIAL COMMUNITY FEED */}
      {!showPublisher && (
        <View style={styles.feedList}>
          {posts.map((post) => (
            <View key={post.id} style={styles.feedItem}>
              {/* Header profile info */}
              <View style={styles.profileHeader}>
                <Image source={{ uri: post.avatar }} style={styles.feedAvatar} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.feedAuthor}>{post.author}</Text>
                  <Text style={styles.feedRole}>{post.role} • {post.timestamp}</Text>
                </View>
              </View>

              {/* Text content */}
              <Text style={styles.feedContent}>
                {post.content}
              </Text>

              {/* Image attachment */}
              {post.image && (
                <Image source={{ uri: post.image }} style={styles.feedImage} />
              )}

              {/* Liking & Comments count controls */}
              <View style={styles.controlsRow}>
                <TouchableOpacity 
                  onPress={() => toggleLikePost(post.id)}
                  style={[styles.controlBtn, post.likedByMe && styles.controlBtnActive]}
                >
                  <Heart size={12} color={post.likedByMe ? THEME.COLORS.primary : THEME.COLORS.textSecondary} fill={post.likedByMe ? THEME.COLORS.primary : 'none'} style={{ marginRight: 4 }} />
                  <Text style={[styles.controlBtnText, post.likedByMe && styles.controlBtnTextActive]}>
                    {post.likes} Likes
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.controlBtn}>
                  <MessageCircle size={12} color={THEME.COLORS.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.controlBtnText}>{post.comments.length} Comments</Text>
                </View>
              </View>

              {/* Comments drawer */}
              {post.comments.length > 0 && (
                <View style={styles.commentsDrawer}>
                  {post.comments.map((c) => (
                    <View key={c.id} style={styles.commentItem}>
                      <Image source={{ uri: c.avatar }} style={styles.commentAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.commentAuthor}>{c.author}</Text>
                        <Text style={styles.commentContent}>{c.content}</Text>
                        <Text style={styles.commentTime}>{c.timestamp}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Write Comment Box */}
              <View style={styles.writeCommentRow}>
                <TextInput
                  placeholder="Write a supportive comment..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={commentInputs[post.id] || ''}
                  onChangeText={(val) => setCommentInputs(prev => ({ ...prev, [post.id]: val }))}
                  style={styles.commentInput}
                />
                <TouchableOpacity 
                  onPress={() => handleSendComment(post.id)}
                  style={styles.commentSendBtn}
                >
                  <Send size={10} color={THEME.COLORS.primary} />
                </TouchableOpacity>
              </View>

            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    
    fontWeight: '900',
    fontSize: 20,
  },
  descText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  pubBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesContainer: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 20,
  },
  badgeTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  publisherCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    gap: 14,
  },
  publisherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  publisherHeaderTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  publisherHeaderCancel: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  pubInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    height: 80,
    color: '#ffffff',
    fontSize: 11,
    textAlignVertical: 'top',
  },
  imageSelectorBlock: {
    gap: 6,
  },
  selectorLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  mockImagesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mockImageBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mockImageBtnActive: {
    borderColor: THEME.COLORS.primary,
  },
  mockImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  publishBtn: {
    backgroundColor: THEME.COLORS.primary,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  publishBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedList: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 10,
  },
  feedItem: {
    backgroundColor: 'rgba(22, 23, 33, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    objectFit: 'cover',
  },
  feedAuthor: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  feedRole: {
    color: THEME.COLORS.primary,
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  feedContent: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  feedImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    objectFit: 'cover',
  },
  controlsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    paddingHorizontal: 2,
    gap: 20,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtnActive: {
    // highlighted states
  },
  controlBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  controlBtnTextActive: {
    color: THEME.COLORS.primary,
  },
  commentsDrawer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 16,
    gap: 10,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    objectFit: 'cover',
    marginTop: 2,
  },
  commentAuthor: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 9,
  },
  commentContent: {
    color: '#ffffff',
    fontSize: 9,
    lineHeight: 12,
    marginTop: 1,
  },
  commentTime: {
    color: THEME.COLORS.textMuted,
    fontSize: 7,
    marginTop: 2,
  },
  writeCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 36,
    color: '#ffffff',
    fontSize: 9,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    borderColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
