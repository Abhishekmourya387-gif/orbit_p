package com.starrypath.app.vpn;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import android.widget.Toast;

import com.starrypath.app.LauncherActivity;

import java.io.IOException;
import java.net.InetAddress;
import java.util.List;

/**
 * Android VpnService that routes DNS traffic through a filtering DNS resolver
 * (CleanBrowsing Family Filter by default).
 *
 * Implements strict panic locking: if engaged during a Panic session, the VPN
 * CANNOT be stopped until the panic protocol is completed.
 */
public class ContentFilterVpnService extends VpnService {

    private static final String TAG = "ContentFilterVpn";
    private static final String PREFS_NAME = "orbit_content_filter_prefs";
    private static final String PREF_IS_ACTIVE = "vpn_is_active";
    private static final String PREF_PANIC_LOCKED = "vpn_panic_locked";

    public static final String ACTION_START = "com.starrypath.app.vpn.START";
    public static final String ACTION_STOP = "com.starrypath.app.vpn.STOP";
    public static final String ACTION_LOCK_PANIC = "com.starrypath.app.vpn.LOCK_PANIC";
    public static final String ACTION_UNLOCK_PANIC = "com.starrypath.app.vpn.UNLOCK_PANIC";

    public static final String EXTRA_LOCK_BY_PANIC = "extra_lock_by_panic";

    public static final String NOTIFICATION_CHANNEL_ID = "orbit_content_filter_channel";
    public static final int NOTIFICATION_ID = 4099;

    private ParcelFileDescriptor vpnInterface = null;
    private static boolean isRunning = false;
    private static boolean isLockedByPanic = false;

    public static boolean isVpnRunning() {
        return isRunning;
    }

    public static boolean isPanicLocked() {
        return isLockedByPanic;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_STICKY;
        }

        String action = intent.getAction();
        Log.d(TAG, "onStartCommand received action: " + action);

        if (ACTION_START.equals(action)) {
            boolean lock = intent.getBooleanExtra(EXTRA_LOCK_BY_PANIC, false);
            if (lock) {
                isLockedByPanic = true;
            }
            startVpn();
        } else if (ACTION_LOCK_PANIC.equals(action)) {
            isLockedByPanic = true;
            persistState();
            updateNotification();
            Log.i(TAG, "Panic lock engaged. VPN is now locked until panic protocol finishes.");
        } else if (ACTION_UNLOCK_PANIC.equals(action)) {
            isLockedByPanic = false;
            persistState();
            updateNotification();
            Log.i(TAG, "Panic lock released.");
        } else if (ACTION_STOP.equals(action)) {
            if (isLockedByPanic) {
                Log.w(TAG, "Stop request blocked: Content Filter is locked during Panic session!");
                Toast.makeText(
                        this,
                        "Content Filter is locked while Panic Mode is active. Complete rescue first!",
                        Toast.LENGTH_LONG
                ).show();
            } else {
                stopVpn();
            }
        }

        return START_STICKY;
    }

    private synchronized void startVpn() {
        if (isRunning && vpnInterface != null) {
            updateNotification();
            return;
        }

        try {
            Builder builder = new Builder();
            builder.setSession("Orbit Content Filter");

            // Local virtual interface address
            builder.addAddress("10.0.0.2", 32);

            // Configure filtering DNS resolver (CleanBrowsing Family Filter)
            DnsEndpoints.DnsProvider provider = DnsEndpoints.DEFAULT;
            List<String> dnsServers = provider.getIpv4Servers();

            for (String dns : dnsServers) {
                builder.addDnsServer(InetAddress.getByName(dns));
                // Route only DNS server IPs through VPN so standard non-DNS traffic is untouched
                builder.addRoute(InetAddress.getByName(dns), 32);
            }

            // Route IPv6 DNS if supported
            for (String dns6 : provider.getIpv6Servers()) {
                try {
                    builder.addDnsServer(InetAddress.getByName(dns6));
                    builder.addRoute(InetAddress.getByName(dns6), 128);
                } catch (Exception ignored) {
                }
            }

            builder.setBlocking(false);

            vpnInterface = builder.establish();
            if (vpnInterface != null) {
                isRunning = true;
                persistState();
                Notification notification = buildNotification();
                startForeground(NOTIFICATION_ID, notification);
                Log.i(TAG, "Content Filter VPN established successfully using " + provider.getName());
            } else {
                Log.e(TAG, "Failed to establish VPN interface (null returned)");
                stopSelf();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting VPN tunnel", e);
            stopSelf();
        }
    }

    private synchronized void stopVpn() {
        if (isLockedByPanic) {
            Log.w(TAG, "Attempted to stop VPN while panic locked. Action aborted.");
            return;
        }

        isRunning = false;
        isLockedByPanic = false;
        persistState();

        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing VPN descriptor", e);
            }
            vpnInterface = null;
        }

        stopForeground(true);
        stopSelf();
        Log.i(TAG, "Content Filter VPN stopped.");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "Content Filter Protection",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows status when DNS content filtering is active");
            channel.setShowBadge(false);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent appIntent = new Intent(this, LauncherActivity.class);
        PendingIntent pendingAppIntent = PendingIntent.getActivity(
                this, 0, appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        String title = "🛡️ Content Filter Active";
        String contentText;
        if (isLockedByPanic) {
            contentText = "🔒 Enforced during Panic Protocol (Cannot be stopped until finished)";
        } else {
            contentText = "CleanBrowsing Family DNS active • Adult & unsafe content blocked";
        }

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, NOTIFICATION_CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        builder.setContentTitle(title)
                .setContentText(contentText)
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingAppIntent)
                .setOngoing(true);

        // Add stop action button only if NOT locked by panic
        if (!isLockedByPanic) {
            Intent stopIntent = new Intent(this, ContentFilterVpnService.class);
            stopIntent.setAction(ACTION_STOP);
            PendingIntent pendingStop = PendingIntent.getService(
                    this, 1, stopIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );
            builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Filter", pendingStop);
        }

        return builder.build();
    }

    private void updateNotification() {
        if (!isRunning) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private void persistState() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putBoolean(PREF_IS_ACTIVE, isRunning)
                .putBoolean(PREF_PANIC_LOCKED, isLockedByPanic)
                .apply();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        persistState();
        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (IOException ignored) {}
            vpnInterface = null;
        }
        Log.i(TAG, "ContentFilterVpnService destroyed.");
    }
}
