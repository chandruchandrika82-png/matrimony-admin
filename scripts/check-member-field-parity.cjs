const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
function initializer(file, name) {
  let result;
  traverse(parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }), { VariableDeclarator({ node }) { if (node.id.name === name) result = node.init; } });
  assert(result, `${name} missing`); return result;
}
const main = initializer(path.resolve(__dirname, '../../matrimony-app/frontend/src/pages/AddProfile.js'), 'initialForm').properties.map(node => node.key.name);
const editor = initializer(path.resolve(__dirname, '../src/components/MemberFields.js'), 'memberGroups').elements.flatMap(group => group.elements[1].elements.map(field => field.elements[0].value));
const server = initializer(path.resolve(__dirname, '../../matrimony-app/backend/server.js'), 'adminMemberFields').elements.map(node => node.value);
for (const key of main.filter(key => key !== 'password')) {
  assert(editor.includes(key), `Admin editor missing ${key}`);
  assert(server.includes(key), `Admin backend missing ${key}`);
}
console.log(`All ${main.length - 1} main profile detail fields are available in the admin form and backend.`);
