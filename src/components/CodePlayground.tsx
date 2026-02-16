import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// API Configuration
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

interface CodePlaygroundProps {
  initialCode: string;
  language?: 'html' | 'javascript' | 'python' | 'react' | 'c' | 'cpp' | 'java' | 'go';
  onSuccess?: () => void;
  onValidationChange?: (isValid: boolean) => void;
  height?: number;
  expectedOutput?: string;
  taskTitle?: string;
}

const API_LANG_MAP: Record<string, { language: string, version: string }> = {
  'c': { language: 'c', version: '10.2.0' },
  'cpp': { language: 'cpp', version: '10.2.0' },
  'java': { language: 'java', version: '15.0.2' },
  'go': { language: 'go', version: '1.16.2' },
  'python': { language: 'python', version: '3.10.0' }, // Optional override if Skulpt fails
};

export const CodePlayground: React.FC<CodePlaygroundProps> = ({ 
  initialCode, 
  language = 'html',
  onSuccess,
  onValidationChange,
  height = SCREEN_HEIGHT * 0.55, 
  expectedOutput,
  taskTitle // New prop for instructions
}) => {
  const webViewRef = useRef<WebView>(null);
  const [key, setKey] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'output'>('code');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New state to toggle showing the instructions/expected output details
  const [showDetails, setShowDetails] = useState(true);
  
  // Update editor content when initialCode prop changes
  useEffect(() => {
    if (webViewRef.current) {
        const safeCode = JSON.stringify(initialCode);
        webViewRef.current.injectJavaScript(`
            (function() {
                var el = document.getElementById('editor');
                if (el) el.value = ${safeCode};
            })();
            true;
        `);
    }
  }, [initialCode]);

  // Sync tab state with WebView logic
  useEffect(() => {
    if (webViewRef.current) {
        // We use a safe-ish timeout to ensure WebView is ready, 
        // though strictly `onLoad` is better. 
        // For simple toggling, injecting this safe guard is okay.
        webViewRef.current.injectJavaScript(`
            if (typeof showTab === 'function') {
                showTab('${activeTab}');
            }
            true;
        `);
    }
  }, [activeTab]);

  const runCode = () => {
    setIsRunning(true);
    setFeedback(null);
    onValidationChange?.(false); // Invalidate previous success when re-running
    setActiveTab('output'); // Auto switch to output tab to show result

    const validationScript = `
      (function() {
        try {
          // Identify environment
          const isPython = '${language}' === 'python';
          
          // Clear previous validation state
          window.capturedOutput = "";
          
          // Call internal run function defined in HTML
          if (typeof window.runEditorCode === 'function') {
             window.runEditorCode(); 
          } else {
             throw new Error("Editor not ready. Please wait a moment.");
          }
          
          // Poll for completion or simple timeout for JS/HTML
          let attempts = 0;
          const checkInterval = setInterval(() => {
             attempts++;
             // For Python, we wait for the promise to resolve internally
             // For JS/HTML, runEditorCode is synchronous-ish but logs might be async? 
             // Actually JS console intercept check is instant.
             
             if (window.executionFinished || attempts > 20) {
                 clearInterval(checkInterval);
                 
                 // Send result back to RN
                 window.ReactNativeWebView.postMessage(JSON.stringify({
                   type: 'execution_result',
                   output: window.capturedOutput,
                   error: window.executionError
                 }));
             }
          }, 200);
          
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: e.toString()}));
        }
      })();
      true;
    `;
    
    webViewRef.current?.injectJavaScript(validationScript);
  };

  const executeRemoteCode = async (lang: string, codeCode: string) => {
      // Find API config by key from our map, not by finding locally
      const config = API_LANG_MAP[lang];
      if (!config) {
         Alert.alert("Error", "Language config not found");
         setIsRunning(false);
         return;
      }

      try {
          const body = {
              language: config.language,
              version: config.version,
              files: [
                  {
                      content: codeCode
                  }
              ]
          };

          const response = await fetch('https://emkc.org/api/v2/piston/execute', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json' 
              },
              body: JSON.stringify(body)
          });
          
          const result = await response.json();

          if (result.message) {
              // Usually API error
              throw new Error(result.message);
          }

          const run = result.run;
          if (!run) throw new Error("No output returned");
          
          const output = (run.stdout || "") + (run.stderr || "");
          const isError = run.code !== 0;

          const safeOutput = JSON.stringify(output);
          const safeError = isError ? JSON.stringify(run.stderr || "Error") : 'null';

          // Send back to WebView for display
          webViewRef.current?.injectJavaScript(`
              showAPIResult(${safeOutput}, ${safeError}); 
              true;
          `);
          
          // Trigger local state update (validation check)
          const mockEvent = {
              nativeEvent: {
                  data: JSON.stringify({
                      type: 'execution_result',
                      output: output,
                      error: isError ? (run.stderr || "Run Failed") : null
                  })
              }
          };
          
          // Recursively call handleMessage with the result to trigger validation logic
          // Note: handleMessage expects stringified data in nativeEvent.data usually if coming from webview
          // But our implementation uses JSON.parse(event.nativeEvent.data) so we simply pass string
          handleMessage(mockEvent); 

      } catch (e: any) {
          setIsRunning(false);
          const msg = e.message || "Network Error";
          webViewRef.current?.injectJavaScript(`showAPIResult(null, ${JSON.stringify(msg)}); true;`);
          setFeedback({ type: 'error', message: "Execution Failed: " + msg });
      }
  };

  const handleMessage = (event: any) => {
      try {
          const rawData = typeof event.nativeEvent.data === 'string' 
              ? event.nativeEvent.data 
              : JSON.stringify(event.nativeEvent.data); // sometimes it's object
          
          const data = JSON.parse(rawData);
          
          if (data.type === 'api_request') {
              // Trigger explicit run
              executeRemoteCode(data.language, data.code);
              return;
          }

          if (data.type === 'execution_result') {
              setIsRunning(false);
              const actualOutput = (data.output || '').trim();
              const hasRuntimeError = !!data.error;

              if (hasRuntimeError) {
                  setFeedback({ 
                    type: 'error', 
                    message: data.error 
                  });
                  return;
              }
              
              if (expectedOutput) {
                  const normalizedActual = actualOutput.replace(/\r\n/g, '\n').trim();
                  const normalizedExpected = expectedOutput.replace(/\r\n/g, '\n').trim();
                  
                  if (normalizedActual === normalizedExpected) {
                      setFeedback({ type: 'success', message: 'Correct! Great job!' });
                      onValidationChange?.(true);
                      if (onSuccess) onSuccess();
                  } else {
                      setFeedback({ 
                        type: 'error', 
                        // message: `Expected: "${normalizedExpected}"\nGot: "${normalizedActual}"`
                        message: `Incorrect output. Check your code and try again!`
                      });
                      onValidationChange?.(false);
                  }
              } else {
                  // No strict validation required
                  if (!hasRuntimeError) {
                       setFeedback({ type: 'success', message: 'Code ran successfully! (Practice Mode)' });
                       onValidationChange?.(true); // Treat as valid so blockStatus becomes true
                       // For non-strict playgrounds, running without error counts as success
                       if (onSuccess) onSuccess();
                  } else {
                       onValidationChange?.(false);
                  }
              }
          } else if (data.type === 'error') {
             setIsRunning(false);
             setFeedback({ type: 'error', message: data.message });
             onValidationChange?.(false);
          }
      } catch (e) {
          setIsRunning(false);
      }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js"></script>
        <!-- React & Babel for React Playground -->
        <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>
          body { 
            margin: 0; padding: 0; 
            height: 100vh; 
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #1e1e1e;
            color: #eee;
            overflow: hidden;
          }
          
          /* Container for Tabs Logic */
          .tab-content {
             display: none;
             height: 100%;
             flex-direction: column;
          }
          .tab-content.active {
             display: flex;
          }

          /* Editor Styles */
          #editor-container {
             flex: 1;
             display: flex;
             flex-direction: column;
          }
          #editor { 
            flex: 1; 
            border: none; 
            padding: 16px; 
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace; 
            font-size: 14px; 
            outline: none; 
            resize: none; 
            background: #1e1e1e; 
            color: #dcdcaa; /* VS Code variable colorish */
            line-height: 1.5;
            width: 100%;
            box-sizing: border-box;
          }

          /* Output Styles */
          #output-container {
             flex: 1;
             display: flex;
             flex-direction: column;
             background: #1e1e1e;
          }
          #preview-frame {
             flex: 1;
             background: #fff;
             border: none;
             display: none; /* Toggled by JS based on language */
          }
          #console-output {
             flex: 1;
             padding: 16px;
             font-family: monospace;
             font-size: 13px;
             color: #ccc;
             overflow-y: auto;
             white-space: pre-wrap;
             display: none; /* Toggled by JS */
          }
          
          /* Console Line Styles */
          .log-line { border-bottom: 1px solid #333; padding: 2px 0; }
          .error-line { color: #ff6b6b; }
          
          /* Placeholder when empty */
          .empty-state {
             color: #666;
             text-align: center;
             margin-top: 40px;
             font-style: italic;
          }
        </style>
      </head>
      <body>

        <!-- Editor Tab -->
        <div id="tab-code" class="tab-content active">
           <!-- Ideally we would escape initialCode for HTML safety -->
           <textarea id="editor" spellcheck="false" placeholder="Type your code here..."></textarea>
        </div>

        <!-- Output Tab -->
        <div id="tab-output" class="tab-content">
           <div id="output-container">
              <iframe id="preview-frame"></iframe>
              <div id="console-output">
                 <div class="empty-state">Run code to see output</div>
              </div>
           </div>
        </div>

        <script>
          const editor = document.getElementById('editor');
          const previewFrame = document.getElementById('preview-frame');
          const consoleOutput = document.getElementById('console-output');
          const tabCode = document.getElementById('tab-code');
          const tabOutput = document.getElementById('tab-output');

          // Global state for execution limits/results
          window.capturedOutput = "";
          window.executionFinished = false;
          window.executionError = null;

          function showTab(tabName) {
              if (tabName === 'code') {
                  if (tabCode) tabCode.classList.add('active');
                  if (tabOutput) tabOutput.classList.remove('active');
              } else {
                  if (tabCode) tabCode.classList.remove('active');
                  if (tabOutput) tabOutput.classList.add('active');
              }
          }

          function logToConsole(text, isError = false) {
             // Remove empty state if present
             const empty = consoleOutput.querySelector('.empty-state');
             if (empty) empty.remove();

             const div = document.createElement('div');
             div.className = isError ? 'log-line error-line' : 'log-line';
             div.innerText = text;
             consoleOutput.appendChild(div);
             
             // Auto scroll
             consoleOutput.scrollTop = consoleOutput.scrollHeight;
          }

          function outf(text) { 
             window.capturedOutput += text;
             logToConsole(text);
          } 
          
          function builtinRead(x) {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
              throw "File not found: '" + x + "'";
            return Sk.builtinFiles["files"][x];
          }

          // EXPOSE TO WINDOW EXPLICITLY
          window.runEditorCode = function() {
             // Ensure editor exists
             const editorVal = document.getElementById('editor');
             if (!editorVal) return;
             
             const code = editorVal.value;
             window.capturedOutput = "";
             window.executionFinished = false;
             window.executionError = null;
             
             // Reset UI
             // consoleOutput.innerHTML = ''; 
             
             const lang = '${language}';
             
             if (lang === 'html') {


                consoleOutput.style.display = 'none';
                previewFrame.style.display = 'block';
                previewFrame.srcdoc = code;
                window.executionFinished = true;
                window.capturedOutput = code;
             }
             else if (lang === 'react') {
                consoleOutput.style.display = 'none';
                previewFrame.style.display = 'block';
                
                // For React, we need an isolated environment with Babel
                // Use standard string concatenation to avoid template literal escaping hell
                var reactDoc = '<html><head>';
                reactDoc += '<script src="https://unpkg.com/react@17/umd/react.development.js"><\\/script>';
                reactDoc += '<script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"><\\/script>';
                reactDoc += '<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>';
                reactDoc += '<style>body { margin: 0; padding: 10px; font-family: sans-serif; }</style>';
                reactDoc += '</head><body><div id="root"></div>';
                reactDoc += '<script type="text/babel">';
                reactDoc += 'try { ' + code + ' } catch (err) { document.body.innerHTML = "<div style=\\"color:red; white-space:pre;\\">" + err.toString() + "</div>"; }';
                reactDoc += '<\\/script></body></html>';

                previewFrame.srcdoc = reactDoc;
                window.executionFinished = true;
             }
             else if (['c', 'cpp', 'java', 'go'].includes(lang)) {
                 consoleOutput.style.display = 'block';
                 previewFrame.style.display = 'none';
                 logToConsole("Compiling and running remotely...", false);
                 
                 // Request native side to execute via API
                 window.ReactNativeWebView.postMessage(JSON.stringify({
                     type: 'api_request',
                     code: code,
                     language: lang
                 }));
             }
             else if (lang === 'javascript') {
                consoleOutput.style.display = 'block';
                previewFrame.style.display = 'none';
                try {
                   const originalLog = console.log;
                   const originalError = console.error;
                   const logs = [];
                   
                   console.log = function(...args) {
                       const msg = args.join(' ');
                       logs.push(msg);
                       outf(msg + '\\n');
                   };
                   console.error = function(...args) {
                       const msg = args.join(' ');
                       logs.push(msg); 
                       logToConsole(msg, true);
                   };

                   eval(code);

                   console.log = originalLog;
                   console.error = originalError;
                } catch (err) {
                   window.executionError = err.toString();
                   logToConsole(err.toString(), true);
                }
                window.executionFinished = true;
             }
             else if (lang === 'python') {
                consoleOutput.style.display = 'block';
                previewFrame.style.display = 'none';
                
                Sk.pre = "output";
                Sk.configure({output:outf, read:builtinRead}); 

                var myPromise = Sk.misceval.asyncToPromise(function() {
                   return Sk.importMainWithBody("<stdin>", false, code, true);
                });

                myPromise.then(function(mod) {
                   window.executionFinished = true;
                }, function(err) {
                   const errStr = err.toString();
                   window.executionError = errStr;
                   logToConsole(errStr, true);
                   window.executionFinished = true;
                });
             }
          }
          
          // Helper for API results
          function showAPIResult(output, error) {
             // Clear "Running..." message
             consoleOutput.innerHTML = '';
             
             if (output) outf(output);
             if (error) {
                 logToConsole(error, true);
                 window.executionError = error;
             }
             window.executionFinished = true;
          }
        </script>
      </body>
    </html>
  `;

  const webViewSource = useMemo(() => ({ html: htmlContent }), [htmlContent]);

  // Inject initial code safely via JS to avoid HTML template literal issues
  const injectedOnLoad = `
    (function() {
        var el = document.getElementById('editor');
        if (el) {
            el.value = ${JSON.stringify(initialCode || "")};
        }
    })();
    true;
  `;

  return (
    <View style={[styles.container, { height }]}>
      {/* Task Instruction Header */}
      {taskTitle && (
        <View style={styles.instructionPanel}>
           <View style={styles.instructionHeader}>
              <Ionicons name="school-outline" size={18} color="#FFF" />
              <Text style={styles.instructionTitle} numberOfLines={2}>{taskTitle}</Text>
              <TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
                 <Ionicons name={showDetails ? "chevron-up" : "chevron-down"} size={18} color="#888" />
              </TouchableOpacity>
           </View>
           
           {showDetails && expectedOutput ? (
               <View style={styles.goalBox}>
                  <Text style={styles.goalLabel}>GOAL OUTPUT:</Text>
                  <Text style={styles.goalValue}>{expectedOutput}</Text>
               </View>
           ) : null}
        </View>
      )}

      {/* Top Bar: Tabs + Run Wrapper */}
      <View style={styles.topBar}>
        
        {/* Tabs */}
        <View style={styles.tabsContainer}>
           <TouchableOpacity 
             style={[styles.tab, activeTab === 'code' && styles.activeTab]}
             onPress={() => setActiveTab('code')}
           >
             <Ionicons name="code-slash" size={14} color={activeTab === 'code' ? '#fff' : '#888'} />
             <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>Code</Text>
           </TouchableOpacity>

           <TouchableOpacity 
             style={[styles.tab, activeTab === 'output' && styles.activeTab]}
             onPress={() => setActiveTab('output')}
           >
             <Ionicons name="terminal" size={14} color={activeTab === 'output' ? '#fff' : '#888'} />
             <Text style={[styles.tabText, activeTab === 'output' && styles.activeTabText]}>Output</Text>
           </TouchableOpacity>
           
           {/* Strict Check Badge - To Debug */}
           {expectedOutput ? (
               <View style={styles.badgeWrapper}>
                   <Ionicons name="shield-checkmark" size={12} color="#fab005" />
                   <Text style={styles.strictBadge}>Strict</Text>
               </View>
           ) : null}
        </View>

        {/* Run Button */}
        <TouchableOpacity onPress={runCode} style={styles.runBtn} activeOpacity={0.7} disabled={isRunning}>
          {isRunning ? (
            <ActivityIndicator color="#000" size="small" /> 
          ) : (
            <>
               <Ionicons name="play" size={16} color="#000" />
               <Text style={styles.runText}>Run</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* WebView Content */}
      <View style={styles.webviewWrapper}>
        <WebView
          key={key}
          ref={webViewRef}
          injectedJavaScript={injectedOnLoad}
          originWhitelist={['*']}
          source={webViewSource}
          style={styles.webview}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleMessage}
        />
      </View>

      {/* Persistent Feedback Area (Toast style over content or bottom bar?) */}
      {/* We'll put it at the bottom overlay over the editor/output */}
      {feedback && (
        <View style={[
            styles.feedback, 
            feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
        ]}>
          <Ionicons 
             name={feedback.type === 'success' ? "checkmark-circle" : "alert-circle"} 
             size={20} 
             color="#fff" 
          />
          <Text style={styles.feedbackText}>{feedback.message}</Text>
          <TouchableOpacity onPress={() => setFeedback(null)}>
             <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E', // Codecademy dark theme background
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
    ...SHADOWS.small,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#151515', // Slightly darker header
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#252526',
    borderRadius: 6,
    padding: 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    gap: 6
  },
  activeTab: {
    backgroundColor: '#3C3C3C',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    gap: 4,
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  strictBadge: {
    color: '#fab005',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700', // Codecademy yellow-ish or generic bright
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6
  },
  runText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: '#1e1e1e', 
  },
  webview: {
    flex: 1,
    backgroundColor: '#1e1e1e', // Match body bg
  },
  feedback: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  feedbackSuccess: {
    backgroundColor: '#107c10', // VS Code green
  },
  feedbackError: {
    backgroundColor: '#d13438', // VS Code error red
  },
  feedbackText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  // INSTRUCTION PANEL STYLES
  instructionPanel: {
     backgroundColor: '#252526', // Toolbar color
     borderBottomWidth: 1,
     borderBottomColor: '#1e1e1e',
     padding: 10,
  },
  instructionHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 8,
  },
  instructionTitle: {
     color: '#CCCCCC',
     fontSize: 13,
     fontWeight: '600',
     fontFamily: 'System',
     flex: 1,
  },
  goalBox: {
     marginTop: 8,
     backgroundColor: '#1E1E1E',
     padding: 8,
     borderRadius: 4,
     borderLeftWidth: 3,
     borderLeftColor: '#fab005',
     flexDirection: 'row',
     alignItems: 'center',
     gap: 8,
  },
  goalLabel: {
     color: '#888',
     fontSize: 10,
     fontWeight: '700',
     letterSpacing: 0.5,
  },
  goalValue: {
     color: '#fab005', 
     fontSize: 12,
     fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  }
});
