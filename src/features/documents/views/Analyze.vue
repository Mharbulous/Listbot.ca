<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-4"
      >
        EDRM Stage 6: Analysis
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Analyze Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Analysis stage goes beyond document-by-document review to uncover patterns, relationships,
        and strategic insights that inform case strategy—revealing the "story behind the data."
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-violet-50 to-purple-50 border-l-4 border-purple-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">🔍</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Competitive Opportunity</h3>
          <p class="text-slate-700">
            Advanced analytics differentiate premium platforms from basic review tools. This stage is
            where
            <span class="font-bold text-purple-700">strategic insights emerge</span>
            through AI-powered pattern detection, timeline visualization, and communication analysis.
          </p>
        </div>
      </div>
    </div>

    <!-- Current Implementation Status -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Current Implementation</h2>
      <div class="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
        <div class="flex items-start gap-3">
          <div class="text-2xl">🚧</div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Under Development</h3>
            <p class="text-slate-700">
              The Analysis stage represents the largest competitive opportunity for ListBot.ca.
              Advanced analytics, AI-powered insights, and visualization tools are currently in the
              planning phase, with implementation following a phased roadmap.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Planned Features -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Features</h2>

      <!-- Phase 1: Quick Wins -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800"
          >
            PHASE 1
          </span>
          Quick Wins (1-2 months)
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Timeline Visualization -->
          <div class="bg-white border-2 border-emerald-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📅</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Timeline Visualization</h4>
                <p class="text-sm text-emerald-600 font-medium">High Value - Lawyers Love This</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Interactive chronological display of case events with document linking, enabling visual
              case narrative development for strategy and trial preparation.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Features:</span> Filter by custodian/type/tags</div>
              <div><span class="font-medium">Controls:</span> Zoom, pan, date range selection</div>
              <div><span class="font-medium">Export:</span> PDF export for client presentations</div>
            </div>
          </div>

          <!-- Exact Duplicate Detection -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔍</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Exact Duplicate Detection</h4>
                <p class="text-sm text-blue-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              MD5/SHA256 hash-based duplicate identification with "review one, tag all" functionality
              to maximize efficiency.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div>
                <span class="font-medium">Implementation:</span> Firebase Cloud Functions processing
              </div>
              <div><span class="font-medium">Benefit:</span> Instant duplicate grouping in UI</div>
            </div>
          </div>

          <!-- Basic Email Threading -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📧</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Basic Email Threading</h4>
                <p class="text-sm text-blue-600 font-medium">Quick Win</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Parse email headers (Subject, In-Reply-To, References) to build conversation
              relationships with tree visualization.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Component:</span> Vue 3 tree component for thread
              visualization
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 2: AI-Powered Features -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"
          >
            PHASE 2
          </span>
          AI-Powered Features (3-6 months)
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Concept Clustering -->
          <div class="bg-white border-2 border-purple-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🧠</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Gemini-Powered Concept Clustering</h4>
                <p class="text-sm text-purple-600 font-medium">AI Innovation</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Group similar documents using unsupervised machine learning with AI-generated cluster
              labels, revealing themes without pre-defined search terms.
            </p>
            <div class="bg-purple-50 border border-purple-200 rounded p-3 mb-2">
              <div class="text-sm font-medium text-purple-900 mb-1">Cost Estimate:</div>
              <div class="text-lg font-bold text-purple-700">$8-10</div>
              <div class="text-sm text-purple-800">per 1,000 documents (using Gemini Flash)</div>
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Visualization:</span> D3.js sunburst charts with drill-down
            </div>
          </div>

          <!-- Document Summarization -->
          <div class="bg-white border border-purple-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📝</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">AI Document Summarization</h4>
                <p class="text-sm text-purple-600 font-medium">Efficiency Boost</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              One-click document summaries with entity extraction, document type identification, and
              key passage highlighting powered by Gemini API.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Caching:</span> Results stored in Firestore</div>
              <div><span class="font-medium">Benefit:</span> Understand content without full read</div>
            </div>
          </div>

          <!-- Natural Language Search -->
          <div class="bg-white border border-purple-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔎</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Advanced Search with NLP</h4>
                <p class="text-sm text-purple-600 font-medium">User-Friendly AI</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Ask questions in plain English and receive relevant documents with AI-powered semantic
              search understanding context and synonyms.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Example:</span> "Show me emails about the contract dispute"
            </div>
          </div>

          <!-- Interactive Timeline Builder -->
          <div class="bg-white border border-purple-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🎯</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Interactive Timeline Builder</h4>
                <p class="text-sm text-purple-600 font-medium">Collaboration Tool</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Drag-and-drop timeline creation with custom events, multiple timelines per case, and
              real-time collaboration via Firestore.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Features:</span> Theater/presentation mode</div>
              <div><span class="font-medium">Export:</span> PDF and HTML formats</div>
            </div>
          </div>

          <!-- Sentiment Analysis -->
          <div class="bg-white border border-purple-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">😊</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Sentiment Analysis</h4>
                <p class="text-sm text-purple-600 font-medium">Risk Detection</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Identify emotionally charged language and potential risk factors with
              positive/negative/neutral classification using Gemini API.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Accuracy:</span> 98% on legal text (CNN-LSTM models)
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 3: Advanced Features -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
          >
            PHASE 3
          </span>
          Complex Builds (6+ months)
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Communication Network Analysis -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🕸️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Communication Network Analysis</h4>
                <p class="text-sm text-slate-600 font-medium">Advanced Analytics</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Network graphs showing who communicated with whom and when, using PageRank algorithms to
              identify key players in the case.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Visualization:</span> Cytoscape.js graph rendering</div>
              <div><span class="font-medium">Analysis:</span> Time-based pattern evolution</div>
            </div>
          </div>

          <!-- TAR/Predictive Coding -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🎓</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Full TAR/Predictive Coding</h4>
                <p class="text-sm text-slate-600 font-medium">Enterprise Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Continuous Active Learning (CAL) that learns from reviewer decisions, promoting relevant
              documents with defensibility metrics for court acceptance.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Reduces review time while maintaining
              accuracy
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- What Lawyers Expect -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">What Lawyers Expect from Analysis Tools</h2>
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Timeline Tools -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">📅</div>
              <div>
                <h3 class="font-semibold text-slate-900">Timeline Visualization</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Consistently cited as one of the most valuable features for case strategy, settlement
              discussions, and trial preparation.
            </p>
          </div>

          <!-- Communication Analysis -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">💬</div>
              <div>
                <h3 class="font-semibold text-slate-900">Communication Analysis</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Network graphs and email threading reveal patterns invisible in linear document review,
              often uncovering case-critical information.
            </p>
          </div>

          <!-- Concept Clustering -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">🗂️</div>
              <div>
                <h3 class="font-semibold text-slate-900">Concept Clustering</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Explore themes and topics without pre-defined search terms using unsupervised machine
              learning with visual cluster maps.
            </p>
          </div>

          <!-- Advanced Search -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">🔍</div>
              <div>
                <h3 class="font-semibold text-slate-900">Advanced Search</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Boolean operators, proximity searches, fuzzy matching, and semantic search with natural
              language query interfaces.
            </p>
          </div>

          <!-- Entity Extraction -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">🏷️</div>
              <div>
                <h3 class="font-semibold text-slate-900">Entity Extraction</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Automatically identify people, organizations, dates, monetary amounts, and locations
              across the entire document corpus.
            </p>
          </div>

          <!-- AI Document Q&A -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">💡</div>
              <div>
                <h3 class="font-semibold text-slate-900">Generative AI Q&A</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Ask questions of entire document collections and receive answers with citations—like
              DISCO Cecilia and Everlaw Deep Dive.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Benefits -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Key Benefits</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🎯</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Strategic Insights</h3>
              <p class="text-slate-600">
                Uncover patterns and relationships that inform case strategy, settlement positions, and
                trial preparation.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">⚡</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Efficiency Gains</h3>
              <p class="text-slate-600">
                AI-powered summaries and clustering reduce time spent searching for relevant
                information by up to 60%.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🏆</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Competitive Advantage</h3>
              <p class="text-slate-600">
                Advanced analytics differentiate ListBot.ca from basic platforms, rivaling enterprise
                solutions like Relativity and Everlaw.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">💰</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Cost-Effective AI</h3>
              <p class="text-slate-600">
                Gemini API integration provides cutting-edge capabilities at a fraction of the cost of
                proprietary ML models.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- EDRM Workflow Integration -->
    <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">EDRM Workflow Integration</h2>
      <p class="text-slate-700 mb-4">
        The Analysis stage builds on insights from earlier stages and informs subsequent workflow
        steps:
      </p>
      <div class="space-y-3">
        <div class="flex items-center">
          <span class="text-xl mr-3">🤖</span>
          <span class="font-semibold text-slate-900 mr-2">Process</span>
          <span class="text-slate-600">→ Deduplicated, threaded emails ready for analysis</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">👁️</span>
          <span class="font-semibold text-slate-900 mr-2">Review</span>
          <span class="text-slate-600">→ Reviewer decisions feed predictive coding models</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🔍</span>
          <span class="font-semibold text-slate-900 mr-2">Analyze</span>
          <span class="text-slate-600"
            >→ Patterns and insights emerge from AI-powered tools</span
          >
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">📋</span>
          <span class="font-semibold text-slate-900 mr-2">Produce</span>
          <span class="text-slate-600">→ Targeted production sets based on analysis findings</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">📊</span>
          <span class="font-semibold text-slate-900 mr-2">Present</span>
          <span class="text-slate-600">→ Timelines and visualizations ready for trial</span>
        </div>
      </div>
    </div>

    <!-- Technical Foundation -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Technical Foundation</h2>
      <p class="text-slate-700 mb-4">
        The Analysis stage will leverage ListBot.ca's modern technology stack for optimal performance:
      </p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Vue 3 + D3.js</h3>
          <p class="text-slate-600 text-sm">
            Interactive visualizations for timelines, network graphs, and cluster exploration
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Firebase + Firestore</h3>
          <p class="text-slate-600 text-sm">
            Real-time collaboration on timelines and annotations with automatic synchronization
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Gemini AI</h3>
          <p class="text-slate-600 text-sm">
            Cutting-edge AI for clustering, summarization, and natural language search
          </p>
        </div>
      </div>
    </div>

    <!-- Cost Management -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Cost-Effective AI Strategy</h2>
      <p class="text-slate-700 mb-4">
        Gemini API pricing makes advanced AI features accessible without enterprise budgets:
      </p>
      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <div class="bg-white rounded p-4">
          <div class="text-sm font-medium text-slate-600 mb-1">Document Summarization</div>
          <div class="text-2xl font-bold text-blue-600">$0.21</div>
          <div class="text-xs text-slate-500">per 1,000 documents (Gemini Flash)</div>
        </div>
        <div class="bg-white rounded p-4">
          <div class="text-sm font-medium text-slate-600 mb-1">Concept Clustering</div>
          <div class="text-2xl font-bold text-blue-600">$8-10</div>
          <div class="text-xs text-slate-500">per 1,000 documents (embeddings)</div>
        </div>
        <div class="bg-white rounded p-4">
          <div class="text-sm font-medium text-slate-600 mb-1">Mid-Size Firm</div>
          <div class="text-2xl font-bold text-blue-600">$500-1,500</div>
          <div class="text-xs text-slate-500">per month (100K docs, moderate AI)</div>
        </div>
      </div>
      <p class="text-sm text-slate-600">
        <span class="font-medium">Strategy:</span> Aggressive caching in Firestore, selective
        on-demand processing, and smart model selection (Flash vs. Pro) keep costs low while
        delivering enterprise-grade AI capabilities.
      </p>
    </div>

    <!-- Implementation Timeline -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Implementation Timeline</h2>
      <div class="space-y-4">
        <!-- Phase 1 -->
        <div class="border-l-4 border-emerald-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Quick Wins</h3>
            <span class="text-sm text-slate-600">(1-2 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Basic timeline visualization with vis.js</li>
            <li>Exact duplicate detection (MD5/SHA256)</li>
            <li>Basic email threading with header parsing</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-purple-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: AI-Powered Features</h3>
            <span class="text-sm text-slate-600">(3-6 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Gemini-powered concept clustering with D3.js visualization</li>
            <li>AI document summarization and entity extraction</li>
            <li>Advanced search with natural language processing</li>
            <li>Interactive timeline builder with real-time collaboration</li>
            <li>Basic sentiment analysis</li>
          </ul>
        </div>

        <!-- Phase 3 -->
        <div class="border-l-4 border-blue-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 3: Advanced Analytics</h3>
            <span class="text-sm text-slate-600">(6+ months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Communication network analysis with Cytoscape.js</li>
            <li>Full TAR/Predictive Coding with continuous active learning</li>
            <li>Advanced entity extraction and pattern detection</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Competitive Positioning -->
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Positioning</h2>
      <p class="text-slate-700 mb-4">
        Analysis features will differentiate ListBot.ca from basic platforms and rival enterprise
        solutions:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Timeline visualization</span> - consistently cited as most
            valuable feature
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Gemini AI integration</span> - cutting-edge at fraction of
            enterprise cost
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Real-time collaboration</span> - built-in via Firebase, not
            bolted on
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Modern UX</span> - Vue 3 + D3.js for superior interactivity
          </div>
        </div>
      </div>
    </div>

    <!-- Coming Soon Banner -->
    <div
      class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white text-center"
    >
      <h2 class="text-3xl font-bold mb-4">Coming Soon</h2>
      <p class="text-xl mb-2">
        The Analysis stage represents our most ambitious feature set, bringing enterprise-level
        analytics and AI to Canadian legal professionals.
      </p>
      <p class="text-lg opacity-90">
        Development is underway following a phased roadmap prioritizing highest-value features first.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
/* Fade-in animation */
div {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
