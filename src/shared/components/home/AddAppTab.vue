<template>
  <div>
    <div class="flex items-center mb-6">
      <div
        class="bg-green-500 text-white text-2xl font-bold rounded-full w-12 h-12 flex items-center justify-center mr-4"
      >
        ➕
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">
          Adding Apps to Your EXISTING SSO Network
        </h2>
        <p class="text-slate-600 text-sm">
          Use this process when you already have a Firebase project and want to add another
          app
        </p>
      </div>
    </div>
    <div class="space-y-8">
      <!-- Prerequisites -->
      <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <h3 class="font-semibold text-amber-800 mb-2">📋 Prerequisites</h3>
        <div class="text-amber-700 text-sm space-y-1">
          <p>• You already have a Firebase project from your first app</p>
          <p>• You have the Firebase configuration values saved</p>
          <p>• Your first app is working with authentication</p>
        </div>
      </div>

      <!-- Step 1: Create Repository -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-green-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          1
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Create Repository from Template</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Go to this repository on GitHub:
              https://github.com/Mharbulous/Coryphaeus.git
            </p>
            <p>
              2. Click the
              <span
                class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                >"Use this template"</span
              >
              button
            </p>
            <p>
              3. Name your new app repository (e.g.,
              <code class="bg-slate-100 px-1 rounded">my-bookkeeping-app</code>,
              <code class="bg-slate-100 px-1 rounded">my-files-app</code>)
            </p>
            <p>4. Clone your new repository locally</p>
            <p>5. Run <code class="bg-slate-100 px-1 rounded">npm install</code></p>
          </div>
        </div>
      </div>

      <!-- Step 2: Use Existing Firebase Project -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-green-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          2
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">
            Configure with Existing Firebase Project
          </h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Copy <code class="bg-slate-100 px-1 rounded">.env.example</code> to
              <code class="bg-slate-100 px-1 rounded">.env</code>
            </p>
            <p>
              2. Use the <strong>EXACT SAME</strong> Firebase configuration from your first
              app:
            </p>
            <div class="bg-slate-50 p-3 rounded mt-2 font-mono text-xs">
              <div>VITE_FIREBASE_API_KEY=your-same-api-key</div>
              <div>VITE_FIREBASE_AUTH_DOMAIN=your-same-project.firebaseapp.com</div>
              <div>VITE_FIREBASE_PROJECT_ID=your-same-project-id</div>
              <div>VITE_FIREBASE_STORAGE_BUCKET=your-same-project.appspot.com</div>
              <div>VITE_FIREBASE_MESSAGING_SENDER_ID=same-123456789</div>
              <div>VITE_FIREBASE_APP_ID=same-1:123456789:web:abcdef123456</div>
              <div class="text-blue-600">VITE_APP_DOMAIN=yourdomain.com</div>
            </div>
            <div class="bg-red-50 border-l-4 border-red-400 p-3 rounded">
              🚨 <strong>Critical:</strong> The Firebase configuration must be
              <strong>identical</strong> to your first app. Different values = no SSO!
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Deploy New App -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-green-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          3
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Deploy Your New App</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Test locally: <code class="bg-slate-100 px-1 rounded">npm run dev</code>
            </p>
            <p>2. Build: <code class="bg-slate-100 px-1 rounded">npm run build</code></p>
            <p>3. Deploy to a <strong>different subdomain</strong>:</p>
            <div class="bg-slate-50 p-3 rounded mt-2 font-mono text-xs space-y-1">
              <div class="text-green-600">• app1.yourdomain.com (existing first app)</div>
              <div class="text-blue-600">• app2.yourdomain.com (this new app)</div>
              <div class="text-purple-600">• app3.yourdomain.com (future apps)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Update Firebase Authorized Domains -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-green-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          4
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Add New Domain to Firebase</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Go to
              <a
                href="https://console.firebase.google.com"
                class="text-blue-600 hover:underline"
                target="_blank"
                >Firebase Console</a
              >
            </p>
            <p>
              2. Select your existing project → Authentication → Settings → Authorized
              domains
            </p>
            <p>
              3. Click
              <span class="bg-teal-100 text-teal-800 px-2 py-1 rounded text-xs font-medium"
                >"Add domain"</span
              >
            </p>
            <p>
              4. Add your new app's domain (e.g.,
              <code class="bg-slate-100 px-1 rounded">app2.yourdomain.com</code>)
            </p>
            <div class="bg-teal-50 border-l-4 border-teal-400 p-3 rounded">
              💡 Your authorized domains list should look like:
              <div class="mt-2 font-mono text-xs">
                <div>• app1.yourdomain.com</div>
                <div>• app2.yourdomain.com</div>
                <div>• localhost</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 5: Test SSO -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-green-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          5
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Test Your SSO Connection</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>1. Make sure you're logged out of all apps</p>
            <p>2. Go to your first app and login</p>
            <p>3. Navigate to your new app's URL</p>
            <p class="bg-green-50 border-l-4 border-green-400 p-3 rounded">
              🎉 <strong>Success!</strong> You should be automatically logged in without
              re-entering credentials!
            </p>
            <p><strong>If SSO isn't working:</strong></p>
            <ul class="ml-4 text-xs space-y-1">
              <li>• Double-check Firebase configuration is identical</li>
              <li>• Verify domain is added to authorized domains</li>
              <li>• Clear browser cache and cookies</li>
              <li>• Check browser console for errors</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Step 6: Add Navigation -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-green-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          6
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Connect Apps with Navigation</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Update the
              <code class="bg-slate-100 px-1 rounded">AppSwitcher.vue</code> component in
              both apps
            </p>
            <p>
              2. Add entries for both apps in the
              <code class="bg-slate-100 px-1 rounded">availableApps</code> array
            </p>
            <p>3. Users can now seamlessly navigate between apps using the app switcher</p>
            <div class="bg-green-50 border-l-4 border-green-400 p-3 rounded">
              🎯 <strong>Pro tip:</strong> Consider creating a shared component library for
              consistent navigation across all apps.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'AddAppTab',
});
</script>

<style scoped>
/* AddAppTab component styles */
</style>
