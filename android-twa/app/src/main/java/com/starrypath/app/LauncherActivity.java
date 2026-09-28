/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.starrypath.app;

import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;



public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    

    

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Setting an orientation crashes the app due to the transparent background on Android 8.0
        // Oreo and below. We only set the orientation on Oreo and above. This only affects the
        // splash screen and Chrome will still respect the orientation.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/496 for details.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }

        handleVpnIntent(getIntent());
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleVpnIntent(intent);
    }

    private void handleVpnIntent(android.content.Intent intent) {
        if (intent == null || intent.getData() == null) return;
        Uri uri = intent.getData();
        if ("starrypath".equalsIgnoreCase(uri.getScheme())) {
            String host = uri.getHost();
            String path = uri.getPath();
            if ("content-filter".equalsIgnoreCase(host) || (path != null && path.contains("content-filter"))) {
                if (path != null && path.contains("panic-start")) {
                    com.starrypath.app.vpn.ContentFilterController.startFilter(this, true);
                } else if (path != null && path.contains("panic-end")) {
                    com.starrypath.app.vpn.ContentFilterController.releasePanicLock(this);
                } else if (path != null && path.contains("start")) {
                    com.starrypath.app.vpn.ContentFilterController.startFilter(this, false);
                } else if (path != null && path.contains("stop")) {
                    com.starrypath.app.vpn.ContentFilterController.stopFilter(this);
                }
            }
        }
    }

    @Override
    protected Uri getLaunchingUrl() {
        // Get the original launch Url.
        Uri uri = super.getLaunchingUrl();
        return uri;
    }
}
