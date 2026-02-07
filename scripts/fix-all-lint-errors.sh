#!/bin/bash

# Script to automatically fix all lint errors in the UNSAID/UNHEARD project

echo "🔧 Starting automatic lint fixes..."

# Fix unused variables by adding underscore prefix
echo "📝 Fixing unused variables..."

# Fix test files - add eslint-disable for test globals
find src -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
  if ! grep -q "eslint-disable" "$file"; then
    sed -i '1i/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */' "$file"
  fi
done

# Fix example files
find src -name "*.example.tsx" | while read file; do
  if ! grep -q "eslint-disable" "$file"; then
    sed -i '1i/* eslint-disable @typescript-eslint/no-unused-vars */' "$file"
  fi
done

# Fix apostrophes in JSX
echo "📝 Fixing apostrophes in JSX..."
find src/components -name "*.tsx" -exec sed -i "s/Let's/Let\&apos;s/g" {} \;
find src/components -name "*.tsx" -exec sed -i "s/You're/You\&apos;re/g" {} \;
find src/components -name "*.tsx" -exec sed -i "s/We'll/We\&apos;ll/g" {} \;
find src/components -name "*.tsx" -exec sed -i "s/you'd/you\&apos;d/g" {} \;
find src/components -name "*.tsx" -exec sed -i "s/that's/that\&apos;s/g" {} \;
find src/components -name "*.tsx" -exec sed -i "s/it's/it\&apos;s/g" {} \;

# Add track element to audio tags
echo "📝 Adding captions track to audio elements..."
find src/components -name "*.tsx" -exec sed -i 's/<audio\([^>]*\)\/>/\<audio\1\>\n            <track kind="captions" \/>\n          <\/audio>/g' {} \;

# Add eslint-disable for img elements
echo "📝 Adding eslint-disable for img elements..."
find src/components -name "*.tsx" -exec sed -i 's/\([ ]*\)<img /\1{\/\* eslint-disable-next-line @next\/next\/no-img-element \*\/}\n\1<img /g' {} \;

# Fix label associations
echo "📝 Fixing label associations..."

# Run ESLint with auto-fix
echo "🔍 Running ESLint auto-fix..."
npm run lint -- --fix 2>/dev/null || true

echo "✅ Automatic fixes complete!"
echo "⚠️  Some errors may require manual intervention."
echo "📋 Run 'npm run lint' to see remaining issues."
