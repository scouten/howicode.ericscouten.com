;(function () {
  'use strict'

  // Wait for hljs to be available (loaded from CDN)
  function initHighlight() {
    if (typeof hljs === 'undefined') {
      setTimeout(initHighlight, 50)
      return
    }

    // Configure highlight.js for better compatibility
    hljs.configure({
      ignoreUnescapedHTML: true
    })

    // Highlight all code blocks with data-lang attribute
    document.querySelectorAll('pre code[data-lang]').forEach(function (node) {
      // Get the language from the data-lang attribute
      var lang = node.getAttribute('data-lang')
      if (lang && hljs.getLanguage(lang)) {
        try {
          var result = hljs.highlight(node.textContent, { language: lang })
          node.innerHTML = result.value
          node.classList.add('hljs')
        } catch (e) {
          console.warn('Error highlighting code:', e)
          // Fallback to auto-detection
          hljs.highlightElement(node)
        }
      } else {
        // Fallback to auto-detection
        hljs.highlightElement(node)
      }
    })
  }

  // Start the initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHighlight)
  } else {
    initHighlight()
  }
})()
