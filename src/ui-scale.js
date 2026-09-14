// Menu mockup coordinates. One scale applies to layout, type, art and hit areas.
export const REFERENCE = Object.freeze({width:1792,height:1008});
export function syncUIScale(){
  const {width,height}=REFERENCE;
  const landscape=innerWidth>=1000&&innerHeight>=560&&innerWidth>innerHeight;
  const scale=landscape?Math.min(innerWidth/width,innerHeight/height):1;
  document.documentElement.style.setProperty('--ui-scale',String(scale));
  document.documentElement.style.setProperty('--dialog-height',`${innerHeight/scale*.9}px`);
  document.body.classList.toggle('scaled-ui',landscape&&!document.body.classList.contains('battle-mode'));
  document.body.classList.toggle('scaled-dialogs',landscape);
}
window.addEventListener('resize',syncUIScale);
