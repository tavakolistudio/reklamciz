/* Reklamcız — discount codes on the price list (validated by /api/discount) */
(function(){
  var fmt=function(n){return Math.round(n).toLocaleString('tr-TR');};
  var waLink=function(name,code,pct,price){
    var t='Merhaba, "'+name+'" paketini seçmek istiyorum.';
    if(code)t+=' İndirim kodu: '+code+' (%'+pct+') — indirimli fiyat: '+fmt(price)+' TL.';
    return 'https://wa.me/905016967777?text='+encodeURIComponent(t);
  };
  document.querySelectorAll('.pcard[data-base]').forEach(function(card){
    var base=+card.getAttribute('data-base'), name=card.getAttribute('data-name');
    var form=card.querySelector('.disc'); if(!form)return;
    var input=form.querySelector('input'), btn=form.querySelector('button'), msg=form.querySelector('.dmsg');
    var amt=card.querySelector('.amt'), old=card.querySelector('.old'), choose=card.querySelector('.choose');
    var oldText=old.textContent, oldHidden=old.hidden;
    function reset(){amt.textContent=fmt(base);old.textContent=oldText;old.hidden=oldHidden;card.classList.remove('discounted');choose.href=waLink(name);}
    function say(text,kind){msg.textContent=text;msg.className='dmsg'+(kind?' '+kind:'');}
    input.addEventListener('input',function(){if(card.classList.contains('discounted')){reset();say('');}});
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var code=input.value.trim();
      if(!code){say('Lütfen bir indirim kodu girin.','err');input.focus();return;}
      btn.disabled=true;say('Kontrol ediliyor…');
      fetch('/api/discount',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:code})})
        .then(function(r){return r.json().catch(function(){return {ok:false};});})
        .then(function(d){
          if(d&&d.ok){
            var p=Math.round(base*(1-d.percent/100)/10)*10;
            amt.textContent=fmt(p);old.textContent=fmt(base)+' TL';old.hidden=false;
            card.classList.add('discounted');
            choose.href=waLink(name,d.code,d.percent,p);
            say('%'+d.percent+' indirim uygulandı · '+d.code,'ok');
          }else{reset();say('Geçersiz veya süresi dolmuş kod.','err');}
        })
        .catch(function(){reset();say('Bağlantı hatası, lütfen tekrar deneyin.','err');})
        .finally(function(){btn.disabled=false;});
    });
  });
})();
