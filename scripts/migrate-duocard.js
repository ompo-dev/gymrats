const fs = require('fs');
const path = require('path');

const dirs = ['app', 'components'];
const ext = ['.tsx', '.ts'];

function walk(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.includes('node_modules') && !item.name.includes('.next')) {
      walk(full, files);
    } else if (ext.some(e => item.name.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

let total = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const orig = content;
    if (!content.includes('DuoCard') && !content.includes('DuoCardHeader') && !content.includes('DuoCardContent') && !content.includes('DuoCardFooter')) continue;
    content = content.replace(/import \{ DuoCard, DuoCardHeader \} from/g, 'import { DuoCard } from');
    content = content.replace(/import \{ DuoCard, DuoCardContent, DuoCardFooter, DuoCardHeader \} from/g, 'import { DuoCard } from');
    content = content.replace(/import \{ DuoCardHeader \} from/g, 'import { DuoCard } from');
    content = content.replace(/DuoCard,\s+DuoCardHeader,/g, 'DuoCard,');
    content = content.replace(/DuoCardHeader,\s+DuoStatCard,/g, 'DuoStatCard,');
    content = content.replace(/DuoCardHeader,\s+DuoStatsGrid/g, 'DuoStatsGrid');
    content = content.replace(/DuoCard,\s+DuoCardContent,\s+DuoCardFooter,\s+DuoCardHeader,/g, 'DuoCard,');
    content = content.replace(/<DuoCard(?![.\w])/g, '<DuoCard.Root');
    content = content.replace(/<\/DuoCard>/g, '</DuoCard.Root>');
    content = content.replace(/<DuoCardHeader/g, '<DuoCard.Header');
    content = content.replace(/<\/DuoCardHeader>/g, '</DuoCard.Header>');
    content = content.replace(/<DuoCardContent/g, '<DuoCard.Content');
    content = content.replace(/<\/DuoCardContent>/g, '</DuoCard.Content>');
    content = content.replace(/<DuoCardFooter/g, '<DuoCard.Footer');
    content = content.replace(/<\/DuoCardFooter>/g, '</DuoCard.Footer>');
    if (content !== orig) {
      fs.writeFileSync(file, content);
      total++;
      console.log('Updated:', file);
    }
  }
}
console.log('Total files updated:', total);
