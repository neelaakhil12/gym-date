// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] React caught crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#060608', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#E50914', fontSize: 20, fontWeight: '900', marginBottom: 12 }}>GymDate Crashed</Text>
          <Text style={{ color: '#ffffff', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || String(this.state.error)}
          </Text>
          <View style={{ width: '100%', height: 300, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderRadius: 16, padding: 12 }}>
            <ScrollView style={{ flex: 1 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'monospace', lineHeight: 14 }}>
                {this.state.error?.stack || 'No JS stack trace available.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

export default RootErrorBoundary;
