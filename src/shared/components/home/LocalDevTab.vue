<template>
  <div>
    <div class="flex items-center mb-6">
      <div
        class="bg-purple-500 text-white text-2xl font-bold rounded-full w-12 h-12 flex items-center justify-center mr-4"
      >
        🛠️
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">Local Development Setup</h2>
        <p class="text-slate-600 text-sm">
          Configure your development environment to test multiple SSO apps locally
        </p>
      </div>
    </div>

    <div class="space-y-8">
      <!-- Step 1: Hosts File Configuration -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-purple-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          1
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Configure Hosts File</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              <strong>Windows:</strong> Edit
              <code class="bg-slate-100 px-1 rounded"
                >C:\Windows\System32\drivers\etc\hosts</code
              >
              (as Administrator)
            </p>
            <p>
              <strong>macOS/Linux:</strong> Edit
              <code class="bg-slate-100 px-1 rounded">/etc/hosts</code> (with sudo)
            </p>
            <p>Add these lines:</p>
            <div class="bg-slate-50 p-3 rounded mt-2 font-mono text-xs space-y-1">
              <div>127.0.0.1 intranet.localhost</div>
              <div>127.0.0.1 bookkeeping.localhost</div>
              <div>127.0.0.1 files.localhost</div>
              <div>127.0.0.1 admin.localhost</div>
            </div>
            <div class="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              💡 <strong>Tip:</strong> You may need to restart your browser after editing
              the hosts file.
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Environment Setup -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-purple-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          2
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Set Up Multiple App Directories</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>Create separate directories for each app you want to test:</p>
            <div class="bg-slate-50 p-3 rounded mt-2 font-mono text-xs space-y-1">
              <div>mkdir my-apps</div>
              <div>cd my-apps</div>
              <div>git clone &lt;intranet-repo&gt; intranet-app</div>
              <div>git clone &lt;bookkeeping-repo&gt; bookkeeping-app</div>
              <div>git clone &lt;files-repo&gt; files-app</div>
            </div>
            <p>
              Each directory should have identical
              <code class="bg-slate-100 px-1 rounded">.env</code> files with the same
              Firebase configuration.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 3: Start Development Servers -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-purple-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          3
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Start Development Servers</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>Open separate terminals for each app:</p>
            <div class="grid md:grid-cols-3 gap-4 mt-3">
              <div class="border rounded p-3">
                <p class="font-medium text-slate-700 mb-2">Terminal 1 - Intranet</p>
                <div class="bg-slate-50 p-2 rounded font-mono text-xs">
                  <div>cd intranet-app</div>
                  <div>npm run dev:intranet</div>
                </div>
                <p class="text-xs text-slate-500 mt-1">Runs on intranet.localhost:3000</p>
              </div>
              <div class="border rounded p-3">
                <p class="font-medium text-slate-700 mb-2">Terminal 2 - Bookkeeping</p>
                <div class="bg-slate-50 p-2 rounded font-mono text-xs">
                  <div>cd bookkeeping-app</div>
                  <div>npm run dev:bookkeeping</div>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  Runs on bookkeeping.localhost:3001
                </p>
              </div>
              <div class="border rounded p-3">
                <p class="font-medium text-slate-700 mb-2">Terminal 3 - Files</p>
                <div class="bg-slate-50 p-2 rounded font-mono text-xs">
                  <div>cd files-app</div>
                  <div>npm run dev:files</div>
                </div>
                <p class="text-xs text-slate-500 mt-1">Runs on files.localhost:3002</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Firebase Configuration -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-purple-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          4
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">
            Update Firebase Authorized Domains
          </h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>Add local development domains to Firebase Console:</p>
            <p>
              1. Go to Firebase Console → Authentication → Settings → Authorized domains
            </p>
            <p>2. Add these domains:</p>
            <div class="bg-slate-50 p-3 rounded mt-2 font-mono text-xs space-y-1">
              <div>• intranet.localhost</div>
              <div>• bookkeeping.localhost</div>
              <div>• files.localhost</div>
              <div>• admin.localhost</div>
              <div class="text-slate-500">• localhost (fallback)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 5: Test SSO Locally -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-purple-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          5
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Test Local SSO</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <p>
              1. Navigate to
              <code class="bg-slate-100 px-1 rounded">http://intranet.localhost:3000</code>
            </p>
            <p>2. Login with your credentials</p>
            <p>
              3. Open a new tab and go to
              <code class="bg-slate-100 px-1 rounded"
                >http://bookkeeping.localhost:3001</code
              >
            </p>
            <p class="bg-green-50 border-l-4 border-green-400 p-3 rounded">
              🎉 <strong>Success!</strong> You should be automatically logged in!
            </p>
            <p><strong>Troubleshooting:</strong></p>
            <ul class="ml-4 text-xs space-y-1">
              <li>• Clear browser cache and cookies</li>
              <li>• Check that hosts file was saved correctly</li>
              <li>• Verify all apps have identical Firebase configuration</li>
              <li>• Check browser console for CORS or network errors</li>
              <li>• Restart browser after hosts file changes</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Step 6: Development Tips -->
      <div class="flex items-start space-x-4">
        <div
          class="bg-purple-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          6
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 mb-2">Development Tips</h3>
          <div class="text-slate-600 text-sm space-y-2">
            <div class="grid md:grid-cols-2 gap-4">
              <div class="bg-blue-50 p-3 rounded">
                <p class="font-medium text-blue-800 mb-2">🚀 Hot Reloading</p>
                <p class="text-blue-700 text-xs">
                  All apps support hot reloading. Changes will appear instantly without
                  losing authentication state.
                </p>
              </div>
              <div class="bg-green-50 p-3 rounded">
                <p class="font-medium text-green-800 mb-2">🔄 Shared State</p>
                <p class="text-green-700 text-xs">
                  Authentication and firm context are shared. Login changes reflect across
                  all running apps.
                </p>
              </div>
              <div class="bg-yellow-50 p-3 rounded">
                <p class="font-medium text-yellow-800 mb-2">🐛 Debugging</p>
                <p class="text-yellow-700 text-xs">
                  Use browser dev tools to inspect Firebase auth tokens and localStorage
                  across domains.
                </p>
              </div>
              <div class="bg-purple-50 p-3 rounded">
                <p class="font-medium text-purple-800 mb-2">⚡ Performance</p>
                <p class="text-purple-700 text-xs">
                  Run only the apps you're actively developing to save system resources.
                </p>
              </div>
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
  name: 'LocalDevTab',
});
</script>

<style scoped>
/* LocalDevTab component styles */
</style>
