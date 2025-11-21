<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-4"
      >
        EDRM Stage 6: Analysis
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Analysis Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Analysis stage evaluates electronically stored information (ESI) for patterns,
        relationships, and strategic insights that inform case strategy—going beyond
        document-by-document review to uncover the "story behind the data."
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">🎯</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">
            Largest Competitive Opportunity
          </h3>
          <p class="text-slate-700">
            Advanced analytics differentiate premium platforms from basic review tools.
            <span class="font-bold text-purple-700"
              >Email threading alone reduces review time by 40-74%</span
            >, while AI-powered insights (timelines, communication patterns, concept clustering)
            transform raw data into compelling case narratives.
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
              The Analysis stage is planned as ListBot.ca's key competitive differentiator,
              leveraging Gemini AI for cutting-edge analytics capabilities. Implementation follows
              a phased roadmap building from high-ROI quick wins to sophisticated AI-powered
              analysis.
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
          Quick Wins (1-2 months) - Highest ROI
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Email Threading -->
          <div class="bg-white border-2 border-emerald-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📧</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Basic Email Threading</h4>
                <p class="text-sm text-emerald-600 font-medium">40-74% Review Time Reduction</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Parse email headers to reconstruct conversation threads, identifying inclusive emails
              that contain all prior messages—eliminating redundant review.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Method:</span> Parse Subject, In-Reply-To, References</div>
              <div><span class="font-medium">Display:</span> Vue 3 tree component visualization</div>
              <div>
                <span class="font-medium">Impact:</span> Review only inclusive emails, skip
                duplicates
              </div>
              <div>
                <span class="font-medium">ROI:</span> Industry-leading time savings (40-74%)
              </div>
            </div>
          </div>

          <!-- Timeline Visualization -->
          <div class="bg-white border-2 border-emerald-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📊</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Basic Timeline Visualization</h4>
                <p class="text-sm text-emerald-600 font-medium">Strategic Case Tool</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Chronological event visualization showing document relationships over time—consistently
              cited as one of the most valuable features for case strategy.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Library:</span> vis.js Timeline component</div>
              <div><span class="font-medium">Filtering:</span> By custodian, type, tags</div>
              <div><span class="font-medium">Controls:</span> Zoom, pan, date range selection</div>
              <div><span class="font-medium">Export:</span> PDF generation via html2canvas</div>
            </div>
          </div>

          <!-- Exact Duplicate Detection -->
          <div class="bg-white border border-emerald-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔍</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Exact Duplicate Detection</h4>
                <p class="text-sm text-emerald-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Hash-based duplicate identification (MD5/SHA256) enabling "review one, tag all"
              functionality for identical documents.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Processing:</span> Firebase Cloud Functions hashing</div>
              <div><span class="font-medium">Grouping:</span> UI display of duplicate families</div>
              <div><span class="font-medium">Action:</span> Review once, apply to all duplicates</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 2: AI-Powered Analytics -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            PHASE 2
          </span>
          AI-Powered Analytics (3-6 months)
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Concept Clustering -->
          <div class="bg-white border-2 border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🧩</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">
                  Gemini-Powered Concept Clustering
                </h4>
                <p class="text-sm text-indigo-600 font-medium">Theme Discovery</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Unsupervised machine learning groups similar documents, revealing themes and topics
              without pre-defined search terms—enabling exploration of unknown patterns.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Embeddings:</span> Gemini API document vectors</div>
              <div><span class="font-medium">Clustering:</span> k-means with ml.js library</div>
              <div><span class="font-medium">Visualization:</span> D3.js sunburst diagrams</div>
              <div><span class="font-medium">Labels:</span> AI-generated cluster descriptions</div>
              <div><span class="font-medium">Cost:</span> ~$8-10 per 1,000 documents (Flash)</div>
            </div>
          </div>

          <!-- Document Summarization -->
          <div class="bg-white border-2 border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📝</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Gemini Document Summarization</h4>
                <p class="text-sm text-indigo-600 font-medium">Quick Understanding</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              One-click 2-3 sentence summaries enable content understanding without reading entire
              documents—dramatically accelerating review and analysis.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Summaries:</span> Auto-generated document overviews</div>
              <div><span class="font-medium">Entities:</span> Extract people, dates, amounts</div>
              <div><span class="font-medium">Type:</span> Document classification (contract, email)</div>
              <div><span class="font-medium">Caching:</span> Firestore storage (one-time cost)</div>
            </div>
          </div>

          <!-- Interactive Timeline Builder -->
          <div class="bg-white border border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🎬</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Interactive Timeline Builder</h4>
                <p class="text-sm text-indigo-600 font-medium">Case Strategy</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Advanced timeline creation with drag-drop document addition, custom events, and
              real-time collaboration—perfect for settlement discussions and trial prep.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Creation:</span> Drag-drop document addition</div>
              <div><span class="font-medium">Events:</span> Custom events with descriptions</div>
              <div><span class="font-medium">Multiple:</span> Multiple timelines per case</div>
              <div><span class="font-medium">Collab:</span> Real-time via Firestore</div>
              <div><span class="font-medium">Present:</span> Theater/presentation mode</div>
            </div>
          </div>

          <!-- Advanced Search -->
          <div class="bg-white border border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔎</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">
                  Natural Language Search with Gemini
                </h4>
                <p class="text-sm text-indigo-600 font-medium">Semantic Understanding</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Ask questions in plain English and receive relevant documents with AI explanations—moving
              beyond keyword matching to semantic understanding.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Input:</span> Plain English queries</div>
              <div><span class="font-medium">Conversion:</span> Gemini converts to structured search</div>
              <div><span class="font-medium">Context:</span> Understands synonyms and legal terms</div>
            </div>
          </div>

          <!-- Sentiment Analysis -->
          <div class="bg-white border border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">💭</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Basic Sentiment Analysis</h4>
                <p class="text-sm text-indigo-600 font-medium">Risk Identification</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Identify emotionally charged language and potential risk factors in communications—research
              shows 98% accuracy on legal text with CNN-LSTM models.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div>
                <span class="font-medium">Classification:</span> Positive/negative/neutral via Gemini
              </div>
              <div><span class="font-medium">Flagging:</span> Problematic language detection</div>
              <div><span class="font-medium">Trends:</span> Sentiment visualization over time</div>
            </div>
          </div>

          <!-- Near-Duplicate Detection -->
          <div class="bg-white border border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔗</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Near-Duplicate Detection</h4>
                <p class="text-sm text-indigo-600 font-medium">Advanced Deduplication</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Identify similar (but not identical) documents using fuzzy matching and similarity
              scoring—further reducing review volume beyond exact duplicates.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Matching:</span> Fuzzy text comparison</div>
              <div><span class="font-medium">Scoring:</span> Similarity percentage calculation</div>
              <div><span class="font-medium">Review:</span> Review representative, note variations</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 3: Advanced AI -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-100 text-violet-800"
          >
            PHASE 3
          </span>
          Advanced AI & Intelligence (6+ months)
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Communication Network Analysis -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🕸️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Communication Network Analysis</h4>
                <p class="text-sm text-slate-600 font-medium">Key Player Identification</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Network graphs showing who communicated with whom and when, using PageRank algorithms to
              identify key players and communication patterns invisible in linear review.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Visualization:</span> Cytoscape.js graph networks</div>
              <div><span class="font-medium">Analysis:</span> PageRank key player identification</div>
              <div><span class="font-medium">Evolution:</span> Time-based pattern changes</div>
            </div>
          </div>

          <!-- Full TAR -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🤖</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">
                  Full TAR/Predictive Coding
                </h4>
                <p class="text-sm text-slate-600 font-medium">Continuous Active Learning</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Machine learning that continuously improves from attorney review decisions, promoting
              relevant documents to the top of review queues with defensible metrics for court
              acceptance.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Learning:</span> Active learning from decisions</div>
              <div><span class="font-medium">Improvement:</span> Continuous model refinement</div>
              <div><span class="font-medium">Metrics:</span> Defensibility reporting for court</div>
            </div>
          </div>

          <!-- Entity Extraction -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🏢</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Advanced Entity Extraction</h4>
                <p class="text-sm text-slate-600 font-medium">Cross-Document Intelligence</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Automatically identify and track people, organizations, dates, monetary amounts, and
              locations across entire document corpus.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Extraction:</span> People, orgs, dates, amounts, locations
              across all docs
            </div>
          </div>

          <!-- Document Q&A -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">💬</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">
                  Generative AI Document Q&A
                </h4>
                <p class="text-sm text-slate-600 font-medium">Revolutionary Analysis</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Ask questions of entire document collections and receive answers with citations—similar
              to DISCO Cecilia Q&A and Everlaw Deep Dive, revolutionizing early case assessment.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Capability:</span> Natural language questions answered with
              citations across corpus
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- What Lawyers Expect -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">
        What Lawyers Expect from Analysis Tools
      </h2>
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Timeline Visualization -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">📊</div>
              <div>
                <h3 class="font-semibold text-slate-900">Timeline Visualization Tools</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Chronological event sequences with document linking, date filtering, and zoom/pan
              controls—consistently cited as one of the most valuable features for case strategy,
              settlement discussions, and trial preparation.
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
              Network graphs showing who communicated with whom and when, email threading analysis,
              social network visualizations identifying key players, and frequency heatmaps revealing
              case-critical information.
            </p>
          </div>

          <!-- Concept Clustering -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">🧩</div>
              <div>
                <h3 class="font-semibold text-slate-900">Concept Clustering</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Visual cluster maps with drill-down capabilities, overlay of coding decisions, and
              AI-generated cluster labels enabling theme exploration without pre-defined searches.
            </p>
          </div>

          <!-- Advanced Search -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">🔍</div>
              <div>
                <h3 class="font-semibold text-slate-900">Advanced Search Capabilities</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Boolean operators, proximity searches, fuzzy matching for misspellings, semantic search
              understanding context and synonyms, and natural language query interfaces for plain
              English questions.
            </p>
          </div>

          <!-- Sentiment Analysis -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">💭</div>
              <div>
                <h3 class="font-semibold text-slate-900">Sentiment Analysis</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Identification of emotionally charged language, potential risk factors, and problematic
              communications—research shows CNN-LSTM models achieve 98% accuracy on legal text.
            </p>
          </div>

          <!-- Predictive Coding -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">🤖</div>
              <div>
                <h3 class="font-semibold text-slate-900">Predictive Coding/TAR</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Model performance metrics, ranked document lists by predicted relevance, continuous
              learning from ongoing review decisions, and generative AI document interrogation for
              revolutionary case assessment.
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
            <div class="text-2xl">⚡</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Massive Time Savings</h3>
              <p class="text-slate-600">
                Email threading alone delivers 40-74% review time reduction—the highest ROI feature
                in e-discovery. Combined with AI summarization and clustering, analysis tools
                dramatically accelerate case understanding.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🎯</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Strategic Insights</h3>
              <p class="text-slate-600">
                Uncover patterns and relationships invisible in linear document review. Communication
                networks, timelines, and concept clustering reveal the story behind the data,
                informing settlement negotiations and trial strategy.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🤖</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">AI-Powered Innovation</h3>
              <p class="text-slate-600">
                Gemini API integration provides cutting-edge capabilities (clustering, summarization,
                semantic search) at a fraction of the cost of proprietary ML models—enabling
                enterprise features at mid-market pricing.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">💰</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Cost Reduction</h3>
              <p class="text-slate-600">
                Advanced analytics reduce review costs (which represent 80% of total e-discovery
                expenses) through deduplication, threading, and TAR—with quantifiable ROI for client
                reporting.
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
        The Analysis stage bridges review and production, transforming individual document judgments
        into strategic case intelligence:
      </p>
      <div class="space-y-3">
        <div class="flex items-center">
          <span class="text-xl mr-3">📊</span>
          <span class="font-semibold text-slate-900 mr-2">Process</span>
          <span class="text-slate-600">→ Deduplicated corpus ready for threading and clustering</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">👁️</span>
          <span class="font-semibold text-slate-900 mr-2">Review</span>
          <span class="text-slate-600">→ Coding decisions inform TAR and pattern analysis</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🔍</span>
          <span class="font-semibold text-slate-900 mr-2">Analysis</span>
          <span class="text-slate-600"
            >→ Timelines, networks, and insights guide case strategy</span
          >
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">📋</span>
          <span class="font-semibold text-slate-900 mr-2">Produce</span>
          <span class="text-slate-600">→ Organized document families and relationships</span>
        </div>
      </div>
    </div>

    <!-- Technical Foundation -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Technical Foundation</h2>
      <p class="text-slate-700 mb-4">
        The Analysis stage leverages ListBot.ca's modern technology stack combined with Gemini AI
        for optimal performance and innovation:
      </p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Vue 3 + Visualization Libraries</h3>
          <p class="text-slate-600 text-sm">
            vis.js for timelines, D3.js for clustering sunbursts, Cytoscape.js for network graphs
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Gemini AI (Flash & Pro)</h3>
          <p class="text-slate-600 text-sm">
            Flash ($0.075/1M tokens) for summarization, Pro ($1.25/1M) for complex clustering and
            analysis
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Firebase + ML Libraries</h3>
          <p class="text-slate-600 text-sm">
            Cloud Functions for batch processing, ml.js for k-means clustering, Firestore caching
          </p>
        </div>
      </div>
    </div>

    <!-- Competitive Context -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Competitive Context</h2>
      <p class="text-slate-700 mb-4">
        Leading platforms demonstrate the strategic value of advanced analytics:
      </p>
      <div class="grid gap-3 md:grid-cols-2 mb-4">
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Everlaw Deep Dive</span> - GenAI document interrogation of
            entire corpus with citations
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">DISCO Cecilia Q&A</span> - Natural language questions answered
            with 5+ citations
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Relativity aiR</span> - GPT-4 powered review with
            rationale explanations
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Everlaw Breakthrough Clustering</span> - Terabyte-scale
            clustering with auto-labels
          </div>
        </div>
      </div>
      <p class="text-sm text-slate-600">
        <span class="font-medium">ListBot.ca Advantage:</span> Gemini API integration delivers
        comparable AI capabilities at dramatically lower cost ($8-10 per 1,000 documents for
        clustering vs. millions in proprietary ML R&D), enabling enterprise features at mid-market
        pricing.
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
            <li>Basic Email Threading (40-74% review time reduction - PRIORITY)</li>
            <li>Basic Timeline Visualization with vis.js</li>
            <li>Exact Duplicate Detection with hash grouping</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-indigo-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: AI-Powered Analytics</h3>
            <span class="text-sm text-slate-600">(3-6 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Gemini-Powered Concept Clustering with D3.js visualization</li>
            <li>Gemini Document Summarization with entity extraction</li>
            <li>Interactive Timeline Builder with real-time collaboration</li>
            <li>Natural Language Search with semantic understanding</li>
            <li>Basic Sentiment Analysis for risk identification</li>
            <li>Near-Duplicate Detection with similarity scoring</li>
          </ul>
        </div>

        <!-- Phase 3 -->
        <div class="border-l-4 border-violet-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 3: Advanced AI & Intelligence</h3>
            <span class="text-sm text-slate-600">(6+ months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Communication Network Analysis with PageRank algorithms</li>
            <li>Full TAR/Predictive Coding with continuous active learning</li>
            <li>Advanced Entity Extraction across document corpus</li>
            <li>Generative AI Document Q&A with citations</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Competitive Positioning -->
    <div
      class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-8"
    >
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Positioning</h2>
      <p class="text-slate-700 mb-4">
        Analysis features will position ListBot.ca as an AI-powered innovation leader:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Email threading</span> - 40-74% time savings (highest ROI
            feature)
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Gemini AI integration</span> - Cutting-edge capabilities at
            low cost
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Modern visualizations</span> - Superior UX vs. legacy
            platforms
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Cost-effective AI</span> - Enterprise features at mid-market
            pricing
          </div>
        </div>
      </div>
    </div>

    <!-- Coming Soon Banner -->
    <div
      class="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow-lg p-8 text-white text-center"
    >
      <h2 class="text-3xl font-bold mb-4">Coming Soon</h2>
      <p class="text-xl mb-2">
        The Analysis stage will transform ListBot.ca into an AI-powered analytics platform,
        delivering insights that inform case strategy and dramatically reduce review time.
      </p>
      <p class="text-lg opacity-90">
        Development prioritizes email threading (40-74% time savings) and AI-powered features
        (clustering, summarization, timelines) for maximum competitive differentiation.
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
