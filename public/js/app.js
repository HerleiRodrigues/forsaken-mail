/**
 * Traduzido e Ajustado para BrightAds
 */

$(function(){
  $('.ui.modal')
    .modal()
  ;

  var clipboard = new Clipboard('.copyable');

  $customShortId = $('#customShortid');
  $shortId = $('#shortid');
  $customTheme = 'check';
  
  // Alteração do Domínio: Ajuste aqui para o seu domínio principal
  var fixedDomain = "brightads.com.br";
  
  // Traduções dos Placeholders
  $placeholder_old = 'Aguardando atribuição de e-mail...';
  $placeholder_new = 'Digite o nome do e-mail (sem o @)';
  
  $customShortId.on('click',function() {
    var self = $(this);
    var editEnable = true;
    $shortId.prop('disabled', false);
    if(self.hasClass('edit')) {
      $shortId.val('');
      self.removeClass('edit');
      self.toggleClass($customTheme);
      $shortId.prop('placeholder', $placeholder_new);
    } else {
      $shortId.prop('disabled', true);
      self.removeClass('check');
      self.toggleClass('edit');
      $shortId.prop('placeholder',$placeholder_old);
      $mailUser = $shortId.val();
      
      // Ajuste: Usando o domínio fixo em vez de location.hostname
      var mailaddress = $mailUser + '@' + fixedDomain;
      setMailAddress($mailUser);
      $shortId.val(mailaddress);
      window.location.reload();
    }
  });
  
  $maillist = $('#maillist');

  $maillist.on('click', 'tr', function() {
    var mail = $(this).data('mail');
    // Tradução: "Sem Assunto"
    $('#mailcard .header').text(mail.headers.subject || 'Sem Assunto');
    $('#mailcard .content:last').html(mail.html);
    $('#mailcard i').click(function() {
      $('#raw').modal('show');
    });
    $('#raw .header').text('CONTEÚDO ORIGINAL (RAW)');
    $('#raw .content').html($('<pre>').html($('<code>').addClass('language-json').html(JSON.stringify(mail, null, 2))));
    Prism.highlightAll();
  });

  var socket = io();

  var setMailAddress = function(id) {
    localStorage.setItem('shortid', id);
    // Ajuste: Usando o domínio fixo aqui também
    var mailaddress = id + '@' + fixedDomain;
    $('#shortid').val(mailaddress).parent().siblings('button').find('.mail').attr('data-clipboard-text', mailaddress);
  };

  $('#refreshShortid').click(function() {
    socket.emit('request shortid', true);
  });

  socket.on('connect', function() {
    if(('localStorage' in window)) {
      var shortid = localStorage.getItem('shortid');
      if(!shortid) {
        socket.emit('request shortid', true);
      }
      else {
        socket.emit('set shortid', shortid);
      }
    }
  });

  socket.on('shortid', function(id) {
    setMailAddress(id);
  });

  socket.on('mail', function(mail) {
    if(('Notification' in window)) {
      if(Notification.permission === 'granted') {
        new Notification('Novo e-mail de: ' + mail.headers.from);
      }
      else if(Notification.permission !== 'denied') {
        Notification.requestPermission(function(permission) {
          if(permission === 'granted') {
            new Notification('Novo e-mail de: ' + mail.headers.from);
          }
        })
      }
    }
    $tr = $('<tr>').data('mail', mail);
    $tr
      .append($('<td>').text(mail.headers.from))
      // Tradução: "Sem Assunto"
      .append($('<td>').text(mail.headers.subject || 'Sem Assunto'))
      .append($('<td>').text((new Date(mail.headers.date)).toLocaleTimeString()));
    $maillist.prepend($tr);
  });
});
