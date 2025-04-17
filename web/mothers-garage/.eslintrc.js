module.exports = {
    extends: [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended"
    ],
    parser: "@typescript-eslint/parser",
    plugins: [
      "react",
      "jsx-a11y",
      "@typescript-eslint"
    ],
    rules: {
      // Rules to prevent invalid HTML nesting
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      
      // Custom rules to prevent common hydration errors
      "react/no-children-prop": "error",
      
      // Add a custom rule to catch <div> inside <p> and similar issues
      "react/no-unknown-property": "error",
      
      // This rule helps catch issues with components that should only contain specific children
      "react/self-closing-comp": "error",
      
      // Ensure proper JSX nesting
      "react/jsx-no-undef": "error",

      "html-nesting/no-div-in-p": "error"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }