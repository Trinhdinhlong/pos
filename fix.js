const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { results = results.concat(walk(file)); }
        else { if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file); }
    });
    return results;
}
const files = walk('e:/Workspace/DO_AN_PHAN_MEM/my-app/src');
let changed = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const orig = content;
    
    // 1. `.status === true || .status === "success" || res.status === 200`
    content = content.replace(/\.status === true \|\| \.status === "success" \|\| ([a-zA-Z0-9_]+)\.status === 200/g, '$1.status === true || $1.status === "success" || $1.status === 200');
    
    // 2. data.status === 200 || .status === true || .status === "success"
    content = content.replace(/([a-zA-Z0-9_]+)\.status === 200 \|\| \.status === true \|\| \.status === "success"/g, '$1.status === 200 || $1.status === true || $1.status === "success"');
    
    // 3. prodRes.status === true || .status === true || .status === "success" || prodRes.status === 200
    content = content.replace(/([a-zA-Z0-9_]+)\.status === true \|\| \.status === true \|\| \.status === "success" \|\| \1\.status === 200/g, '$1.status === true || $1.status === "success" || $1.status === 200');

    // 4. users/page.tsx: data.status === 200 || data.status === 201 || .status === true || .status === "success"
    content = content.replace(/([a-zA-Z0-9_]+)\.status === 201 \|\| \.status === true \|\| \.status === "success"/g, '$1.status === 201 || $1.status === true || $1.status === "success"');

    if (orig !== content) {
        fs.writeFileSync(file, content);
        changed++;
        console.log("Fixed: " + file);
    }
});
console.log("Total fixed: " + changed);
