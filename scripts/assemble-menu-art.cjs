// SVG viewports assemble reusable slices of the supplied menu; original pixels are untouched.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'art-review/menu-art-20260914/source/menu.JPG')).toString('base64');
const image='<image width="1792" height="1008" href="data:image/jpeg;base64,'+source+'"/>';
const write=(name,viewBox,body)=>{const [,,width,height]=viewBox.split(' ');fs.writeFileSync(path.join(root,'public/menu-art',name),'<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" preserveAspectRatio="none" viewBox="'+viewBox+'">'+body+'</svg>');};
write('wood.svg','340 300 800 580',image);
write('panel.svg','1288 100 475 665','<defs><mask id="opening" maskUnits="userSpaceOnUse" x="1288" y="100" width="475" height="665"><rect x="1288" y="100" width="475" height="665" fill="white"/><rect x="1322" y="135" width="405" height="589" rx="8" fill="black"/></mask></defs><g mask="url(#opening)">'+image+'</g>');
const header=fs.readFileSync(path.join(root,'public/menu-art/header__08e28e4c.png')).toString('base64');
const headerImage='<image width="1758" height="464" href="data:image/png;base64,'+header+'"/>';
write('gold.svg','1138 122 217 216',headerImage);
write('gems.svg','1428 120 204 232',headerImage);
console.log('Assembled wood and panel SVGs from menu.JPG.');
