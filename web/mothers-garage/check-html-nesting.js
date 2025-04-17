const fs = require('fs');
const path = require('path');

// Patterns to look for
const patterns = [
  {
    container: /<p[^>]*>([\s\S]*?)<\/p>/g,
    invalid: /<div[^>]*>/,
    message: '<div> inside <p> tag'
  },
  {
    container: /<CardDescription[^>]*>([\s\S]*?)<\/CardDescription>/g,
    invalid: /<div[^>]*>/,
    message: '<div> inside <CardDescription> component'
  },
  {
    container: /<DialogDescription[^>]*>([\s\S]*?)<\/DialogDescription>/g,
    invalid: /<div[^>]*>/,
    message: '<div> inside <DialogDescription> component'
  },
  {
    container: /<p[^>]*>([\s\S]*?)<\/p>/g,
    invalid: /<section[^>]*>/,
    message: '<section> inside <p> tag'
  },
  {
    container: /<p[^>]*>([\s\S]*?)<\/p>/g,
    invalid: /<article[^>]*>/,
    message: '<article> inside <p> tag'
  },
  {
    container: /<p[^>]*>([\s\S]*?)<\/p>/g,
    invalid: /<aside[^>]*>/,
    message: '<aside> inside <p> tag'
  },
  {
    container: /<p[^>]*>([\s\S]*?)<\/p>/g,
    invalid: /<header[^>]*>/,
    message: '<header> inside <p> tag'
  },
  {
    container: /<p[^>]*>([\s\S]*?)<\/p>/g,
    invalid: /<footer[^>]*>/,
    message: '<footer> inside <p> tag'
  }
];

// Function to check a file
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let issues = [];
    
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.container);
      while ((match = regex.exec(content)) !== null) {
        const containerContent = match[1];
        if (pattern.invalid.test(containerContent)) {
          issues.push({
            file: filePath,
            message: pattern.message,
            line: getLineNumber(content, match.index),
            content: match[0].substring(0, 100) + '...' // Show a snippet of the problematic code
          });
        }
      }
    });
    
    return issues;
  } catch (error) {
    console.error(`Error checking file ${filePath}:`, error);
    return [];
  }
}

// Helper to get line number
function getLineNumber(content, index) {
  const lines = content.slice(0, index).split('\n');
  return lines.length;
}

// Walk directory recursively
function walkDir(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && 
          !filePath.includes('node_modules') && 
          !filePath.includes('.next')) {
        results = results.concat(walkDir(filePath));
      } else if (
        stat.isFile() && 
        (filePath.endsWith('.tsx') || 
         filePath.endsWith('.jsx') || 
         filePath.endsWith('.js'))
      ) {
        results.push(filePath);
      }
    });
  } catch (error) {
    console.error(`Error walking directory ${dir}:`, error);
  }
  
  return results;
}

// Main function
function main() {
  console.log('Checking for HTML nesting issues...');
  
  // First check the test file
  const testFile = './test-eslint.tsx';
  if (fs.existsSync(testFile)) {
    console.log(`Checking test file: ${testFile}`);
    const issues = checkFile(testFile);
    if (issues.length > 0) {
      console.log('Found issues in test file:');
      issues.forEach(issue => {
        console.log(`  Line ${issue.line}: ${issue.message}`);
        console.log(`  Code: ${issue.content}`);
      });
    } else {
      console.log('No issues found in test file. This is unexpected as it contains a div inside a p.');
      console.log('The script might need adjustment to properly detect the issues.');
    }
  } else {
    console.log('Test file not found. Make sure test-eslint.tsx exists in the project root.');
  }
  
  // Then check specific components
  const specificFiles = [
    './components/ui/card.tsx',
    './components/ui/dialog.tsx'
  ];
  
  specificFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`\nChecking specific file: ${file}`);
      const issues = checkFile(file);
      if (issues.length > 0) {
        console.log(`Found issues in ${file}:`);
        issues.forEach(issue => {
          console.log(`  Line ${issue.line}: ${issue.message}`);
          console.log(`  Code: ${issue.content}`);
        });
      } else {
        console.log(`No issues found in ${file}`);
      }
    } else {
      console.log(`File not found: ${file}`);
    }
  });
  
  // Finally check all files
  console.log('\nChecking all project files...');
  const startDir = './';
  const files = walkDir(startDir);
  let allIssues = [];
  
  files.forEach(file => {
    const issues = checkFile(file);
    allIssues = allIssues.concat(issues.map(issue => ({...issue, file})));
  });
  
  if (allIssues.length > 0) {
    console.log('\nFound HTML nesting issues in project:');
    allIssues.forEach(issue => {
      console.log(`${issue.file} (line ${issue.line}): ${issue.message}`);
      console.log(`  Code: ${issue.content}`);
    });
  } else {
    console.log('\nNo HTML nesting issues found in project files!');
  }
}

main();