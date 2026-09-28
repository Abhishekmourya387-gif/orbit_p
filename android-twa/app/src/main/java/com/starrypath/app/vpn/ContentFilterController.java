package com.starrypath.app.vpn;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/**
 * Controller class to manage the Content Filter VPN service, check state,
 * and coordinate panic locking.
 */
public class ContentFilterController {

    private static final String PREFS_NAME = "orbit_content_filter_prefs";
    private static final String PREF_IS_ACTIVE = "vpn_is_active";
    private static final String PREF_PANIC_LOCKED = "vpn_panic_locked";

    public static boolean isFilterActive(Context context) {
        if (ContentFilterVpnService.isVpnRunning()) {
            return true;
        }
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(PREF_IS_ACTIVE, false);
    }

    public static boolean isPanicLocked(Context context) {
        if (ContentFilterVpnService.isPanicLocked()) {
            return true;
        }
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(PREF_PANIC_LOCKED, false);
    }

    public static void startFilter(Context context, boolean lockByPanic) {
        VpnPermissionActivity.start(context, ContentFilterVpnService.ACTION_START, lockByPanic);
    }

    public static boolean stopFilter(Context context) {
        if (isPanicLocked(context)) {
            // Refuse stop while panic locked
            return false;
        }
        VpnPermissionActivity.start(context, ContentFilterVpnService.ACTION_STOP, false);
        return true;
    }

    public static void lockForPanic(Context context) {
        Intent intent = new Intent(context, ContentFilterVpnService.class);
        intent.setAction(ContentFilterVpnService.ACTION_LOCK_PANIC);
        context.startService(intent);
    }

    public static void releasePanicLock(Context context) {
        Intent intent = new Intent(context, ContentFilterVpnService.class);
        intent.setAction(ContentFilterVpnService.ACTION_UNLOCK_PANIC);
        context.startService(intent);
    }
}
