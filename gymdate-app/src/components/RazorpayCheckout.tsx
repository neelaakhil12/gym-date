/**
 * RazorpayCheckout — Cross-platform Razorpay payment component.
 *
 * - On Web: Injects the Razorpay checkout.js script and opens the native browser checkout.
 * - On Native (Android/iOS): Opens a full-screen WebView containing the Razorpay checkout page,
 *   then listens for postMessage to get the payment result.
 */
import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getApiUrl } from '../config';
import { THEME } from '../theme';
import { X } from 'lucide-react-native';

export interface RazorpayPaymentOptions {
  gymId: string;
  gymName: string;
  planName: string;
  /** Amount in INR (not paise) */
  amount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail: string;
  startDate?: string;
  useWallet?: boolean;
  onSuccess?: (bookingId: string, paymentId: string) => void;
  onFailure?: (error: string) => void;
  onDismiss?: () => void;
}

interface OrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function buildRazorpayHTML(order: OrderResponse, options: RazorpayPaymentOptions): string {
  const safeName = (options.customerName || '').replace(/'/g, "\\'");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>GymDate Payment</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0b10;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .logo{font-size:22px;font-weight:900;color:#e50914;letter-spacing:-0.5px;margin-bottom:8px}
    .subtitle{font-size:12px;color:#6b7280;margin-bottom:32px}
    .card{background:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:24px;width:100%;max-width:380px;margin-bottom:24px}
    .row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13px}
    .label{color:#6b7280}.val{font-weight:700}.amount{color:#22c55e;font-size:20px;font-weight:900;font-family:monospace}
    .divider{height:1px;background:rgba(255,255,255,0.06);margin:12px 0}
    .btn{width:100%;background:#e50914;color:#fff;border:none;border-radius:14px;padding:16px;font-size:14px;font-weight:800;cursor:pointer}
    .btn:disabled{opacity:0.7}
    .status{display:none;font-size:12px;color:#6b7280;text-align:center;margin-top:16px}
  </style>
</head>
<body>
  <div class="logo">GymDate</div>
  <div class="subtitle">Secure Payment Gateway</div>
  <div class="card">
    <div class="row"><span class="label">Gym</span><span class="val">${options.gymName}</span></div>
    <div class="row"><span class="label">Plan</span><span class="val">${options.planName}</span></div>
    <div class="divider"></div>
    <div class="row"><span class="label">Total</span><span class="amount">&#8377;${options.amount}</span></div>
  </div>
  <button class="btn" id="payBtn" onclick="startPayment()">Pay &#8377;${options.amount} with Razorpay</button>
  <div class="status" id="status">Processing...</div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function startPayment(){
      document.getElementById('payBtn').disabled=true;
      document.getElementById('status').style.display='block';
      var opts={
        key:'${order.keyId}',amount:${order.amount},currency:'${order.currency}',
        name:'GymDate',description:'${options.planName} - ${options.gymName}',
        order_id:'${order.orderId}',
        prefill:{name:'${safeName}',email:'${options.customerEmail}',contact:'${options.customerPhone || ''}'},
        theme:{color:'#e50914'},
        modal:{ondismiss:function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'DISMISS'}))}},
        handler:function(r){window.ReactNativeWebView.postMessage(JSON.stringify({type:'SUCCESS',razorpay_payment_id:r.razorpay_payment_id,razorpay_order_id:r.razorpay_order_id,razorpay_signature:r.razorpay_signature}))}
      };
      try{
        var rzp=new Razorpay(opts);
        rzp.on('payment.failed',function(r){window.ReactNativeWebView.postMessage(JSON.stringify({type:'FAILURE',error:r.error.description||'Payment failed'}))});
        rzp.open();
      }catch(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:'FAILURE',error:e.message}))}
    }
    window.addEventListener('load',function(){setTimeout(startPayment,600)});
  </script>
</body>
</html>`;
}

export const RazorpayCheckout: React.FC<{
  options: RazorpayPaymentOptions | null;
  onClose: () => void;
}> = ({ options, onClose }) => {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasOpened = useRef(false);
  const apiUrl = getApiUrl();

  React.useEffect(() => {
    if (!options) { setOrder(null); setError(null); hasOpened.current = false; return; }
    createOrder(options);
  }, [options?.gymId, options?.planName, options?.amount]);

  const createOrder = async (opts: RazorpayPaymentOptions) => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: opts.amount, planName: opts.planName, gymId: opts.gymId, gymName: opts.gymName }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Could not create payment order'); return; }
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (rzpResponse: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    if (!options) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`${apiUrl}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rzpResponse,
          gymId: options.gymId,
          planName: options.planName,
          amount: options.amount,
          startDate: options.startDate || new Date().toISOString(),
          customerName: options.customerName || '',
          customerPhone: options.customerPhone || '',
          customerEmail: options.customerEmail,
          useWallet: options.useWallet || false,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        options.onFailure?.(result.error || 'Payment verification failed');
      } else {
        options.onSuccess?.(result.bookingId, rzpResponse.razorpay_payment_id);
      }
    } catch (err: any) {
      options.onFailure?.(err.message || 'Verification error');
    } finally {
      setIsVerifying(false);
      onClose();
    }
  };

  // Web: use window.Razorpay directly
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !options || !order || hasOpened.current) return;
    hasOpened.current = true;

    const doWebPayment = async () => {
      const loaded = await loadRazorpayScript();
      if (!loaded) { options.onFailure?.('Failed to load Razorpay script'); onClose(); return; }
      const rzpOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'GymDate',
        description: `${options.planName} — ${options.gymName}`,
        order_id: order.orderId,
        prefill: { email: options.customerEmail, name: options.customerName || '', contact: options.customerPhone || '' },
        theme: { color: '#e50914', backdrop_color: '#0a0a0a' },
        modal: { ondismiss: () => { options.onDismiss?.(); onClose(); } },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          await verifyPayment(response);
        },
      };
      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
      onClose(); // close loading modal, razorpay opens its own UI
    };
    doWebPayment();
  }, [order]);

  if (Platform.OS === 'web') {
    if (!options) return null;
    return (
      <Modal visible={!!options} transparent animationType="fade">
        <View style={s.backdrop}>
          <View style={s.loadCard}>
            <ActivityIndicator color={THEME.COLORS.primary} size="large" />
            <Text style={s.loadText}>Opening Razorpay checkout...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={!!options} animationType="slide" onRequestClose={() => { options?.onDismiss?.(); onClose(); }}>
      <View style={s.webviewContainer}>
        <View style={s.webviewHeader}>
          <Text style={s.webviewTitle}>Secure Payment</Text>
          <TouchableOpacity onPress={() => { options?.onDismiss?.(); onClose(); }} style={s.closeBtn}>
            <X size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={s.centeredFill}>
            <ActivityIndicator color={THEME.COLORS.primary} size="large" />
            <Text style={s.statusText}>Creating payment order...</Text>
          </View>
        )}

        {error && !isLoading && (
          <View style={s.centeredFill}>
            <Text style={s.errorIcon}>⚠️</Text>
            <Text style={s.errorTitle}>Payment Setup Failed</Text>
            <Text style={s.errorDesc}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => options && createOrder(options)}>
              <Text style={s.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {isVerifying && (
          <View style={s.verifyOverlay}>
            <ActivityIndicator color="#ffffff" size="large" />
            <Text style={s.verifyText}>Verifying payment...</Text>
          </View>
        )}

        {order && !isLoading && !error && options && (
          <WebView
            style={{ flex: 1, backgroundColor: '#0a0b10' }}
            source={{ html: buildRazorpayHTML(order, options) }}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            onMessage={(e) => {
              try {
                const msg = JSON.parse(e.nativeEvent.data);
                if (msg.type === 'SUCCESS') {
                  verifyPayment({ razorpay_payment_id: msg.razorpay_payment_id, razorpay_order_id: msg.razorpay_order_id, razorpay_signature: msg.razorpay_signature });
                } else if (msg.type === 'DISMISS') {
                  options.onDismiss?.(); onClose();
                } else if (msg.type === 'FAILURE') {
                  options.onFailure?.(msg.error || 'Payment failed'); onClose();
                }
              } catch {}
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  loadCard: { backgroundColor: '#111827', borderRadius: 24, padding: 32, alignItems: 'center', gap: 16, minWidth: 200 },
  loadText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  webviewContainer: { flex: 1, backgroundColor: '#0a0b10' },
  webviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14, backgroundColor: '#0a0b10', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  webviewTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  centeredFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  statusText: { color: '#6b7280', fontSize: 13, fontWeight: '600', marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  errorDesc: { color: '#9ca3af', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  retryBtn: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  retryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  verifyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 999 },
  verifyText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
