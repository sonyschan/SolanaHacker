/**
 * Script to fix all Firebase imports and references in controllers
 */
const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');
const controllers = ['userController.js', 'lotteryController.js'];

// Replacement patterns
const replacements = [
  // Replace firestore references with db = getFirestore()
  {
    pattern: /firestore\.collection\(/g,
    replacement: 'db.collection('
  },
  {
    pattern: /firestore\.runTransaction\(/g,
    replacement: 'db.runTransaction('
  },
  // Replace FieldValue
  {
    pattern: /firestore\.FieldValue/g,
    replacement: 'admin.firestore.FieldValue'
  }
];

// Add db = getFirestore() to functions that use firestore
const addDbDeclaration = (content) => {
  // Find functions that use 'db.collection' but don't declare 'db'
  const functionPattern = /async function \w+\([^)]*\) \{[^}]*?(?=db\.collection)/g;
  
  return content.replace(functionPattern, (match) => {
    if (!match.includes('const db = getFirestore()')) {
      // Add db declaration after opening brace
      return match.replace('{', '{\n    const db = getFirestore();');
    }
    return match;
  });
};

controllers.forEach(controller => {
  const filePath = path.join(controllersDir, controller);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${controller}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });
  
  // Add db declarations
  content = addDbDeclaration(content);
  
  // Write back
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${controller}`);
});

console.log('🎉 All controllers fixed!');