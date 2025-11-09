<template>
  <div>
    <div class="flex items-center mb-6">
      <div
        class="bg-blue-500 text-white text-2xl font-bold rounded-full w-12 h-12 flex items-center justify-center mr-4"
      >
        🆕
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">Setting Up Your FIRST SSO App</h2>
        <p class="text-slate-600 text-sm">
          This will create the Firebase project that all your apps will share
        </p>
      </div>
    </div>
    <div class="space-y-8">
      <!-- Step 1: Create Repository -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
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
              3. Name your new repository (e.g.,
              <code class="bg-slate-100 px-1 rounded">my-intranet-app</code>,
              <code class="bg-slate-100 px-1 rounded">my-booking-app</code>)
            </p>
            <p>4. Clone your new repository locally</p>
          </div>
        </div>
      </div>

      <!-- Step 2: Set up Firebase -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          2
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Create New Firebase Project</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Go to
              <a
                href="https://console.firebase.google.com"
                class="text-blue-600 hover:underline"
                target="_blank"
                >console.firebase.google.com</a
              >
            </p>
            <p>
              2. Click
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                >"Create a project"</span
              >
            </p>
            <p>3. Name your project (e.g., "My Company SSO")</p>
            <p>4. Enable Google Analytics (optional)</p>
            <p>
              5. Click
              <span
                class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                >"Create project"</span
              >
            </p>
            <div class="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              💡 <strong>Remember:</strong> All your future apps will use this same Firebase
              project for SSO.
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Enable Services -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          3
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Enable Firebase Services</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p><strong>Enable Authentication:</strong></p>
            <p>1. Go to Authentication → Get started</p>
            <p>2. Sign-in method → Email/Password → Enable → Save</p>
            <p><strong>Create Firestore Database:</strong></p>
            <p>1. Go to Firestore Database → Create database</p>
            <p>2. Start in production mode → Next</p>
            <p>3. Choose location → Done</p>
          </div>
        </div>
      </div>

      <!-- Step 4: Configure Environment -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          4
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Configure Environment Variables</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Copy <code class="bg-slate-100 px-1 rounded">.env.example</code> to
              <code class="bg-slate-100 px-1 rounded">.env</code>
            </p>
            <p>2. Get Firebase config from Project Settings → General → Your apps</p>
            <p>3. Fill in your <code class="bg-slate-100 px-1 rounded">.env</code> file:</p>
            <div class="bg-slate-50 p-3 rounded mt-2 font-mono text-xs">
              <div>VITE_FIREBASE_API_KEY=your-api-key</div>
              <div>VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com</div>
              <div>VITE_FIREBASE_PROJECT_ID=your-project-id</div>
              <div>VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com</div>
              <div>VITE_FIREBASE_MESSAGING_SENDER_ID=123456789</div>
              <div>VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456</div>
              <div class="text-blue-600">VITE_APP_DOMAIN=yourdomain.com</div>
            </div>
            <p class="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              💡 <strong>Save these values:</strong> You'll need the exact same
              configuration for all future apps in your SSO network.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 5: Deploy Firestore Rules -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          5
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Deploy Firestore Security Rules</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Install Firebase CLI:
              <code class="bg-slate-100 px-1 rounded">npm install -g firebase-tools</code>
            </p>
            <p>2. Login: <code class="bg-slate-100 px-1 rounded">firebase login</code></p>
            <p>
              3. Initialize:
              <code class="bg-slate-100 px-1 rounded">firebase init firestore</code>
            </p>
            <p>
              4. Deploy rules:
              <code class="bg-slate-100 px-1 rounded"
                >firebase deploy --only firestore:rules</code
              >
            </p>
            <p class="text-xs text-slate-500">
              The template includes firm-based security rules in
              <code>firestore.rules</code>
            </p>
          </div>
        </div>
      </div>

      <!-- Step 6: Deploy App -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          6
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Deploy to Production</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p><strong>Choose your deployment platform:</strong></p>

            <div class="border rounded-lg p-3 mt-2">
              <p class="font-medium text-slate-700">Option A: Vercel (Recommended)</p>
              <p>
                1. Connect your GitHub repo to
                <a
                  href="https://vercel.com"
                  class="text-blue-600 hover:underline"
                  target="_blank"
                  >Vercel</a
                >
              </p>
              <p>2. Add environment variables in Vercel dashboard</p>
              <p>
                3. Set custom domain (e.g.,
                <code class="bg-slate-100 px-1 rounded">intranet.yourdomain.com</code>)
              </p>
              <p class="text-xs text-green-600 mt-1">
                ✅ HTTPS certificates automatically provided
              </p>
            </div>

            <div class="border rounded-lg p-3">
              <p class="font-medium text-slate-700">Option B: Netlify</p>
              <p>
                1. Connect repo to
                <a
                  href="https://netlify.com"
                  class="text-blue-600 hover:underline"
                  target="_blank"
                  >Netlify</a
                >
              </p>
              <p>
                2. Build command:
                <code class="bg-slate-100 px-1 rounded">npm run build</code>
              </p>
              <p>
                3. Publish directory: <code class="bg-slate-100 px-1 rounded">dist</code>
              </p>
              <p>4. Add environment variables and custom domain</p>
              <p class="text-xs text-green-600 mt-1">
                ✅ HTTPS certificates automatically provided
              </p>
            </div>

            <div class="border rounded-lg p-3">
              <p class="font-medium text-slate-700">Option C: Firebase Hosting</p>
              <p>1. <code class="bg-slate-100 px-1 rounded">firebase init hosting</code></p>
              <p>2. Build: <code class="bg-slate-100 px-1 rounded">npm run build</code></p>
              <p>
                3. Deploy: <code class="bg-slate-100 px-1 rounded">firebase deploy</code>
              </p>
              <p>4. Configure custom domain in Firebase Console</p>
              <p class="text-xs text-green-600 mt-1">
                ✅ HTTPS certificates automatically provided
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 7: Configure Authorized Domains -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          7
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">
            Add Authorized Domains in Firebase
          </h3>
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
            <p>2. Select your project → Authentication → Settings → Authorized domains</p>
            <p>3. Add each of your app domains:</p>
            <div class="bg-slate-50 p-3 rounded mt-2 font-mono text-xs space-y-1">
              <div>• intranet.yourdomain.com</div>
              <div>• bookkeeping.yourdomain.com</div>
              <div>• files.yourdomain.com</div>
              <div>• admin.yourdomain.com</div>
              <div class="text-slate-500">• localhost (for development)</div>
            </div>
            <p class="bg-red-50 border-l-4 border-red-400 p-3 rounded">
              🚨 <strong>Critical:</strong> All app domains must be added here or
              authentication will fail!
            </p>
          </div>
        </div>
      </div>

      <!-- Step 8: Test SSO -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          8
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Test Your Multi-App SSO</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Open your first app (e.g.,
              <code class="bg-slate-100 px-1 rounded">https://intranet.yourdomain.com</code
              >)
            </p>
            <p>2. Login with your credentials</p>
            <p>
              3. Open your second app (e.g.,
              <code class="bg-slate-100 px-1 rounded"
                >https://bookkeeping.yourdomain.com</code
              >)
            </p>
            <p class="bg-green-50 border-l-4 border-green-400 p-3 rounded">
              🎉 <strong>Success!</strong> You should be automatically logged in without
              re-entering credentials!
            </p>
            <p>
              4. Add navigation links between apps using the
              <code class="bg-slate-100 px-1 rounded">AppSwitcher</code> component
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'FirstAppTab',
});
</script>

<style scoped>
/* FirstAppTab component styles */
</style>
