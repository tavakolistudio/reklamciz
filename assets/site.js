/* Reklamcız — shared helpers: contour texture, scroll reveal, active nav */
(function(){
  /* topographic contour texture: marching squares over 3-octave value noise */
  function genContour(){
    if(window.__contour) return window.__contour;
    var clamp=function(v,a,b){return Math.max(a,Math.min(b,v));};
    var hash=function(x,y,s){var h=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,982451653))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967295;};
    var vn=function(x,y,s){var xi=Math.floor(x),yi=Math.floor(y),u=x-xi,v=y-yi;u=u*u*(3-2*u);v=v*v*(3-2*v);
      var a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
    var F=function(x,y){return .65*vn(x/260,y/260,11)+.25*vn(x/120,y/120,23)+.10*vn(x/55,y/55,37);};
    var G=12,NX=1440/G,NY=900/G,V=[],i,j;
    for(j=0;j<=NY;j++){V[j]=[];for(i=0;i<=NX;i++)V[j][i]=F(i*G,j*G);}
    var P=['','','',''],f=function(n){return Math.round(n*10)/10;};
    var seg=function(p,q){var mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,dx=(mx-720)/720,dy=(my-450)/450;
      var w=clamp((Math.max(Math.abs(dx)*1.05,Math.abs(dy)*.6)-.35)/.5,0,1);if(w<=.05)return;
      var b=w<.3?0:w<.55?1:w<.8?2:3;P[b]+='M'+f(p[0])+' '+f(p[1])+'L'+f(q[0])+' '+f(q[1]);};
    for(var L=.30;L<=.8001;L+=.03){
      for(j=0;j<NY;j++)for(i=0;i<NX;i++){
        var a=V[j][i],b=V[j][i+1],c=V[j+1][i+1],d=V[j+1][i],x=i*G,y=j*G;
        var it=function(v1,v2){return (L-v1)/(v2-v1);};
        var T=(a>L)!==(b>L)?[x+G*it(a,b),y]:null, R=(b>L)!==(c>L)?[x+G,y+G*it(b,c)]:null,
            B=(d>L)!==(c>L)?[x+G*it(d,c),y+G]:null, Lf=(a>L)!==(d>L)?[x,y+G*it(a,d)]:null;
        var pts=[T,R,B,Lf].filter(Boolean);
        if(pts.length===2)seg(pts[0],pts[1]);
        else if(pts.length===4){var ctr=(a+b+c+d)/4;if((ctr>L)===(a>L)){seg(T,R);seg(B,Lf);}else{seg(T,Lf);seg(R,B);}}
      }
    }
    var op=[.18,.36,.55,.75];
    var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="none"><g fill="none" stroke="#9AA0A6" stroke-width="1" stroke-linecap="round">';
    P.forEach(function(d,k){if(d)svg+='<path vector-effect="non-scaling-stroke" stroke-opacity="'+op[k]+'" d="'+d+'"/>';});
    svg+='</g></svg>';
    window.__contour='url("data:image/svg+xml;base64,'+btoa(svg)+'")';
    return window.__contour;
  }
  window.genContour=genContour;

  function init(){
    document.querySelectorAll('.bgtex,[data-contour]').forEach(function(el){el.style.backgroundImage=genContour();});
    /* active nav link */
    var here=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'')||'index';
    document.querySelectorAll('[data-page]').forEach(function(a){if(a.getAttribute('data-page')===here)a.setAttribute('aria-current','page');});
    /* scroll reveal */
    var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els=document.querySelectorAll('.reveal');
    if(rm||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    els.forEach(function(e){io.observe(e);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
