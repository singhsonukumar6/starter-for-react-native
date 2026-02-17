import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CodePlaygroundProps {
  initialCode: string;
  language?: 'html' | 'javascript' | 'python' | 'react' | 'c' | 'cpp' | 'java' | 'go';
  onSuccess?: () => void;
  onValidationChange?: (isValid: boolean) => void;
  height?: number;
  expectedOutput?: string;
  expectedCodePattern?: string; // Regex pattern to match expected code structure
  hints?: string[]; // Hints to show when code is incorrect
  taskTitle?: string;
}

/**
 * CodePlayground Component
 * 
 * For HTML/CSS/JavaScript/React: Uses in-device execution via WebView
 * For Python: Uses Skulpt in-browser interpreter
 * For C/C++/Java/Go: Validates code patterns and extracts output from print statements
 * 
 * For coding challenges with real execution: Use ChallengeSolveScreen (Judge0 API)
 */
export const CodePlayground: React.FC<CodePlaygroundProps> = ({ 
  initialCode, 
  language = 'html',
  onSuccess,
  onValidationChange,
  height = SCREEN_HEIGHT * 0.55, 
  expectedOutput,
  expectedCodePattern,
  hints = [],
  taskTitle
}) => {
  const webViewRef = useRef<WebView>(null);
  const [key, setKey] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'output'>('code');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        webViewRef.current.injectJavaScript(`
            if (typeof showTab === 'function') {
                showTab('${activeTab}');
            }
            true;
        `);
    }
  }, [activeTab]);

  /**
   * Run code - executes or validates based on language
   */
  const runCode = () => {
    setIsRunning(true);
    setFeedback(null);
    onValidationChange?.(false);
    setActiveTab('output');

    const validationScript = `
      (function() {
        try {
          const isPython = '${language}' === 'python';
          
          window.capturedOutput = "";
          
          if (typeof window.runEditorCode === 'function') {
             window.runEditorCode(); 
          } else {
             throw new Error("Editor not ready. Please wait a moment.");
          }
          
          let attempts = 0;
          const checkInterval = setInterval(() => {
             attempts++;
             
             if (window.executionFinished || attempts > 20) {
                 clearInterval(checkInterval);
                 
                 // Get the code from editor
                 const editorEl = document.getElementById('editor');
                 const code = editorEl ? editorEl.value : '';
                 
                 window.ReactNativeWebView.postMessage(JSON.stringify({
                   type: 'execution_result',
                   output: window.capturedOutput,
                   error: window.executionError,
                   code: code
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

  const handleMessage = (event: any) => {
      try {
          const rawData = typeof event.nativeEvent.data === 'string' 
              ? event.nativeEvent.data 
              : JSON.stringify(event.nativeEvent.data);
          
          const data = JSON.parse(rawData);
          
          if (data.type === 'execution_result') {
              setIsRunning(false);
              const actualOutput = (data.output || '').trim();
              const hasRuntimeError = !!data.error;
              const code = data.code || '';
              const lang = language;

              if (hasRuntimeError) {
                  setFeedback({ 
                    type: 'error', 
                    message: data.error 
                  });
                  return;
              }
              
              // For C/C++/Java/Go - simulated validation using pattern matching
              if (['c', 'cpp', 'java', 'go'].includes(lang)) {
                  // Check if expected code pattern is provided
                  if (expectedCodePattern) {
                      try {
                          const regex = new RegExp(expectedCodePattern, 'i');
                          if (regex.test(code)) {
                              setFeedback({ type: 'success', message: 'Correct! Great job!' });
                              onValidationChange?.(true);
                              if (onSuccess) onSuccess();
                          } else {
                              // Show hint if available
                              const hint = hints.length > 0 ? hints[Math.floor(Math.random() * hints.length)] : 'Check your code and try again!';
                              setFeedback({ type: 'error', message: hint });
                              onValidationChange?.(false);
                          }
                      } catch (e) {
                          setFeedback({ type: 'error', message: 'Check your code and try again!' });
                          onValidationChange?.(false);
                      }
                      return;
                  }
                  
                  // If expected output is provided, check against it
                  if (expectedOutput) {
                      const normalizedActual = actualOutput.replace(/\r\n/g, '\n').trim();
                      const normalizedExpected = expectedOutput.replace(/\r\n/g, '\n').trim();
                      
                      if (normalizedActual === normalizedExpected) {
                          setFeedback({ type: 'success', message: 'Correct! Great job!' });
                          onValidationChange?.(true);
                          if (onSuccess) onSuccess();
                      } else {
                          const hint = hints.length > 0 ? hints[Math.floor(Math.random() * hints.length)] : 'Output doesn\'t match. Check your code!';
                          setFeedback({ type: 'error', message: hint });
                          onValidationChange?.(false);
                      }
                      return;
                  }
                  
                  // No validation required - just check code structure
                  if (code.trim().length > 0) {
                      setFeedback({ type: 'success', message: 'Code ran successfully!' });
                      onValidationChange?.(true);
                      if (onSuccess) onSuccess();
                  } else {
                      setFeedback({ type: 'error', message: 'Please write some code first!' });
                      onValidationChange?.(false);
                  }
                  return;
              }
              
              // For HTML/React/JavaScript/Python - use actual output validation
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
                        message: 'Output doesn\'t match. Check your code!'
                      });
                      onValidationChange?.(false);
                  }
              } else {
                  // No strict validation required - success for lesson completion
                  if (!hasRuntimeError) {
                       setFeedback({ type: 'success', message: 'Code ran successfully!' });
                       onValidationChange?.(true);
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
          
          .tab-content {
             display: none;
             height: 100%;
             flex-direction: column;
          }
          .tab-content.active {
             display: flex;
          }

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
            color: #dcdcaa;
            line-height: 1.5;
            width: 100%;
            box-sizing: border-box;
          }

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
             display: none;
          }
          #console-output {
             flex: 1;
             padding: 16px;
             font-family: monospace;
             font-size: 13px;
             color: #ccc;
             overflow-y: auto;
             white-space: pre-wrap;
             display: none;
          }
          
          .log-line { border-bottom: 1px solid #333; padding: 2px 0; }
          .error-line { color: #ff6b6b; }
          
          .empty-state {
              color: #666;
              text-align: center;
              margin-top: 40px;
              font-style: italic;
          }
        </style>
      </head>
      <body>

        <div id="tab-code" class="tab-content active">
           <textarea id="editor" spellcheck="false" placeholder="Type your code here..."></textarea>
        </div>

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
             const empty = consoleOutput.querySelector('.empty-state');
             if (empty) empty.remove();

             const div = document.createElement('div');
             div.className = isError ? 'log-line error-line' : 'log-line';
             div.innerText = text;
             consoleOutput.appendChild(div);
             
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
             const editorVal = document.getElementById('editor');
             if (!editorVal) return;
             
             const code = editorVal.value;
             window.capturedOutput = "";
             window.executionFinished = false;
             window.executionError = null;
             
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
                  // SIMULATED EXECUTION for lessons
                  consoleOutput.style.display = 'block';
                  previewFrame.style.display = 'none';
                  
                  // Extract print statements to simulate output
                  let simulatedOutput = "";
                  
                  // Python-like print extraction for C/C++/Java/Go
                  const printPatterns = [
                      /printf\\s*\\(\\s*"([^"]*)"/g,           // C/C++ printf
                      /cout\\s*<<\\s*"([^"]*)"/g,              // C++ cout
                      /System\\.out\\.print(?:ln)?\\s*\\(\\s*"([^"]*)"/g,  // Java
                      /fmt\\.Print(?:ln)?\\s*\\(\\s*"([^"]*)"/g,         // Go
                      /print\\s*\\(\\s*"([^"]*)"/g,            // Python-like
                  ];
                  
                  // Extract strings from print statements
                  for (const pattern of printPatterns) {
                      let match;
                      while ((match = pattern.exec(code)) !== null) {
                          simulatedOutput += match[1].replace(/\\\\n/g, '\\n').replace(/\\\\t/g, '\\t');
                      }
                  }
                  
                  // Also check for console.log style
                  const consolePattern = /console\\.log\\s*\\(\\s*"([^"]*)"/g;
                  let match;
                  while ((match = consolePattern.exec(code)) !== null) {
                      simulatedOutput += match[1];
                  }
                  
                  if (simulatedOutput) {
                      logToConsole(simulatedOutput, false);
                      window.capturedOutput = simulatedOutput;
                  } else {
                      window.capturedOutput = "";
                  }
                  
                  window.executionFinished = true;
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

                   const result = eval(code);
                   
                   console.log = originalLog;
                   console.error = originalError;
                   
                   if (result !== undefined && logs.length === 0) {
                       outf(String(result) + '\\n');
                   }
                   
                   window.executionFinished = true;
                } catch (e) {
                   window.executionError = e.toString();
                   logToConsole(e.toString(), true);
                   window.executionFinished = true;
                }
             }
             else if (lang === 'python') {
                consoleOutput.style.display = 'block';
                previewFrame.style.display = 'none';
                
                if (typeof Sk !== 'undefined') {
                   Sk.configure({
                      output: outf,
                      read: builtinRead,
                      __future__: Sk.python3
                   });
                   
                   Sk.misceval.asyncToPromise(function() {
                      return Sk.importMainWithBody("<stdin>", false, code, true);
                   }).then(function(mod) {
                      window.executionFinished = true;
                   }).catch(function(err) {
                      window.executionError = err.toString();
                      logToConsole(err.toString(), true);
                      window.executionFinished = true;
                   });
                } else {
                   window.executionError = "Python interpreter not loaded";
                   window.executionFinished = true;
                }
             }
             else {
                window.executionError = "Unsupported language";
                window.executionFinished = true;
             }
          };
          
          // Initialize editor with initial code
          editor.value = ${JSON.stringify(initialCode)};
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'code' && styles.activeTab]}
          onPress={() => setActiveTab('code')}
        >
          <Ionicons name="code-slash" size={16} color={activeTab === 'code' ? COLORS.primary : '#888'} />
          <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>Code</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'output' && styles.activeTab]}
          onPress={() => setActiveTab('output')}
        >
          <Ionicons name="terminal" size={16} color={activeTab === 'output' ? COLORS.primary : '#888'} />
          <Text style={[styles.tabText, activeTab === 'output' && styles.activeTabText]}>Output</Text>
        </TouchableOpacity>
      </View>

      {/* WebView Editor */}
      <View style={styles.webViewContainer}>
        <WebView
          key={key}
          ref={webViewRef as any}
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>

      {/* Feedback Area */}
      {feedback && (
        <View style={[styles.feedbackBar, feedback.type === 'success' ? styles.successBar : styles.errorBar]}>
          <Ionicons 
            name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={18} 
            color={feedback.type === 'success' ? '#10B981' : '#EF4444'} 
          />
          <Text style={[styles.feedbackText, feedback.type === 'success' ? styles.successText : styles.errorText]}>
            {feedback.message}
          </Text>
        </View>
      )}

      {/* Run Button */}
      <TouchableOpacity 
        style={styles.runButton} 
        onPress={runCode}
        disabled={isRunning}
      >
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.runButtonGradient}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="play" size={18} color="#FFF" />
              <Text style={styles.runButtonText}>Run Code</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  webViewContainer: {
    flex: 1,
  },
  feedbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  successBar: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.3)',
  },
  errorBar: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.3)',
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
  },
  successText: {
    color: '#10B981',
  },
  errorText: {
    color: '#EF4444',
  },
  runButton: {
    margin: 12,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  runButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  runButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
