package com.starrypath.app.vpn;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

/**
 * Handles the Android VpnService.prepare() consent flow.
 * Launched when the user toggles the Content Filter on or starts Panic Mode.
 */
public class VpnPermissionActivity extends Activity {

    private static final String TAG = "VpnPermissionActivity";
    private static final int REQUEST_CODE_VPN_PREPARE = 1010;

    public static final String EXTRA_ACTION = "extra_vpn_action";
    public static final String EXTRA_LOCK_BY_PANIC = "extra_lock_by_panic";

    public static void start(Context context, String action, boolean lockByPanic) {
        Intent intent = new Intent(context, VpnPermissionActivity.class);
        intent.putExtra(EXTRA_ACTION, action);
        intent.putExtra(EXTRA_LOCK_BY_PANIC, lockByPanic);
        if (!(context instanceof Activity)) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        }
        context.startActivity(intent);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = getIntent();
        String targetAction = intent != null ? intent.getStringExtra(EXTRA_ACTION) : ContentFilterVpnService.ACTION_START;
        boolean lockByPanic = intent != null && intent.getBooleanExtra(EXTRA_LOCK_BY_PANIC, false);

        if (ContentFilterVpnService.ACTION_STOP.equals(targetAction)) {
            Intent stopIntent = new Intent(this, ContentFilterVpnService.class);
            stopIntent.setAction(ContentFilterVpnService.ACTION_STOP);
            startService(stopIntent);
            finish();
            return;
        }

        if (ContentFilterVpnService.ACTION_UNLOCK_PANIC.equals(targetAction)) {
            Intent unlockIntent = new Intent(this, ContentFilterVpnService.class);
            unlockIntent.setAction(ContentFilterVpnService.ACTION_UNLOCK_PANIC);
            startService(unlockIntent);
            finish();
            return;
        }

        // Check if VPN permission is already prepared
        Intent prepareIntent = VpnService.prepare(this);
        if (prepareIntent != null) {
            // Must ask user for consent via Android system dialog
            try {
                startActivityForResult(prepareIntent, REQUEST_CODE_VPN_PREPARE);
            } catch (Exception e) {
                Log.e(TAG, "Error launching VPN prepare intent", e);
                Toast.makeText(this, "Could not open VPN permission dialog", Toast.LENGTH_SHORT).show();
                finish();
            }
        } else {
            // Already prepared, proceed directly to start service
            launchVpnService(lockByPanic);
            finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_CODE_VPN_PREPARE) {
            boolean lockByPanic = getIntent() != null && getIntent().getBooleanExtra(EXTRA_LOCK_BY_PANIC, false);

            if (resultCode == RESULT_OK) {
                launchVpnService(lockByPanic);
                Toast.makeText(this, "Content Filter activated", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "VPN permission is required to enable Content Filter", Toast.LENGTH_LONG).show();
                Log.w(TAG, "User denied VPN permission request");
            }
            finish();
        }
    }

    private void launchVpnService(boolean lockByPanic) {
        Intent serviceIntent = new Intent(this, ContentFilterVpnService.class);
        serviceIntent.setAction(ContentFilterVpnService.ACTION_START);
        serviceIntent.putExtra(ContentFilterVpnService.EXTRA_LOCK_BY_PANIC, lockByPanic);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }
}
