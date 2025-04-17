module.exports = {
    rules: {
      'no-div-in-p': {
        create: function(context) {
          return {
            JSXElement(node) {
              // Check if this is a <p> element
              if (node.openingElement && 
                  node.openingElement.name && 
                  node.openingElement.name.name === 'p') {
                
                // Check all children
                const children = node.children || [];
                for (const child of children) {
                  // Look for <div>, <section>, etc. inside <p>
                  if (child.type === 'JSXElement' && 
                      child.openingElement && 
                      child.openingElement.name) {
                    
                    const childName = child.openingElement.name.name;
                    const blockElements = ['div', 'section', 'article', 'aside', 'header', 'footer', 'form', 'fieldset', 'nav', 'ul', 'ol', 'table'];
                    
                    if (blockElements.includes(childName)) {
                      context.report({
                        node: child,
                        message: `Do not use <${childName}> inside <p>. This causes hydration errors.`
                      });
                    }
                  }
                }
              }
            }
          };
        }
      }
    }
  };