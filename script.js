(function () {
  'use strict';
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8ywLW0FR-kTLVmD4w6tDXyS5-KD0qNSzywuCDb7Nuh8Ku4qm4XqF2q6cTDOSAYM1u/exec';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var form = $('#regForm'), steps = $$('.step'), cur = 0, sending = false;
  var vPortada = $('#vPortada'), vForm = $('#vForm'), vPase = $('#vPase');
  var btnNext = $('#btnNext'), btnBack = $('#btnBack'), formMsg = $('#formMsg');

  function show(v) {
    [vPortada, vForm, vPase].forEach(function (x) { x.hidden = x !== v; });
    window.scrollTo(0, 0);
  }
  function val(name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    if (el.length && el[0] && el[0].type === 'radio') {
      var r = $('input[name="' + name + '"]:checked', form);
      return r ? r.value : '';
    }
    return (el.value || '').trim();
  }
  function setErr(name, msg) {
    var s = $('.err[data-for="' + name + '"]', form);
    if (s) s.textContent = msg || '';
    var el = form.elements[name];
    if (el && el.classList) el.classList.toggle('bad', !!msg);
  }
  function isMinor() { var e = parseInt(val('edad'), 10); return !isNaN(e) && e < 18; }
  function digits(s, n) { return new RegExp('^\\d{' + n + '}$').test(s); }

  function validate(i) {
    var ok = true;
    function need(name, cond, msg) { setErr(name, cond ? '' : msg); if (!cond) ok = false; }
    if (i === 0) {
      var n = val('nombre');
      need('nombre', n.length >= 5 && /\s/.test(n), 'Escribe tus nombres y apellidos completos.');
      need('dni', digits(val('dni'), 8), 'El DNI debe tener 8 dígitos.');
      var e = parseInt(val('edad'), 10);
      need('edad', !isNaN(e) && e >= 5 && e <= 99, 'Edad no válida.');
      need('sexo', !!val('sexo'), 'Elige una opción.');
    } else if (i === 1) {
      need('distancia', !!val('distancia'), 'Elige 3K o 5K.');
      need('celular', /^9\d{8}$/.test(val('celular')), 'Ingresa 9 dígitos que empiecen con 9.');
    } else if (i === 2) {
      need('emNombre', val('emNombre').length >= 3, 'Escribe el nombre del contacto.');
      need('emCelular', /^9\d{8}$/.test(val('emCelular')), 'Ingresa 9 dígitos que empiecen con 9.');
      need('medio', !!val('medio'), 'Elige una opción.');
      need('aceptaSalud', !val('salud') || val('aceptaSalud'), 'Marca la autorización para guardar este dato.');
    } else if (i === 3) {
      if (isMinor()) {
        need('tutorNombre', val('tutorNombre').length >= 5, 'Escribe el nombre del tutor.');
        need('tutorDni', digits(val('tutorDni'), 8), 'El DNI debe tener 8 dígitos.');
        need('tutorCel', /^9\d{8}$/.test(val('tutorCel')), 'Ingresa 9 dígitos que empiecen con 9.');
        need('tutorOk', val('tutorOk'), 'El tutor debe autorizar la participación.');
      }
      need('aceptaTerminos', val('aceptaTerminos'), 'Debes aceptar los términos y condiciones.');
      need('aceptaDatos', val('aceptaDatos'), 'Debes autorizar el tratamiento de tus datos.');
    }
    return ok;
  }

  function render() {
    steps.forEach(function (s, i) { s.hidden = i !== cur; });
    $('#stepNo').textContent = cur + 1;
    var pct = (cur + 1) * 25;
    $('#fill').style.width = pct + '%';
    var lane = $('.lane');
    $('#runner').style.left = Math.max(0, lane.offsetLeft + lane.offsetWidth * pct / 100 - 24) + 'px';
    btnBack.hidden = cur === 0;
    btnNext.textContent = cur === 3 ? 'Confirmar inscripción' : 'Siguiente';
    $('#minorBox').hidden = !(cur === 3 && isMinor());
    formMsg.hidden = true;
    window.scrollTo(0, 0);
  }

  $('#btnStart').addEventListener('click', function () { show(vForm); render(); });
  btnBack.addEventListener('click', function () { if (cur > 0) { cur--; render(); } });

  ['dni', 'edad', 'celular', 'emCelular', 'tutorDni', 'tutorCel'].forEach(function (n) {
    form.elements[n].addEventListener('input', function (e) { e.target.value = e.target.value.replace(/\D/g, ''); });
  });
  form.elements.salud.addEventListener('input', function (e) { $('#saludOk').hidden = !e.target.value.trim(); });
  form.addEventListener('input', function (e) { if (e.target.name) setErr(e.target.name, ''); });
  form.addEventListener('change', function (e) { if (e.target.name) setErr(e.target.name, ''); });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;
    if (!validate(cur)) {
      var bad = $('input.bad', form); if (bad) bad.focus();
      return;
    }
    if (cur < 3) { cur++; render(); return; }
    submit();
  });

  function payload() {
    var minor = isMinor();
    return {
      nombre: val('nombre'), dni: val('dni'), edad: parseInt(val('edad'), 10), sexo: val('sexo'),
      distancia: val('distancia'), celular: val('celular'),
      emNombre: val('emNombre'), emCelular: val('emCelular'), medio: val('medio'),
      aceptaTerminos: val('aceptaTerminos'), aceptaDatos: val('aceptaDatos'),
      salud: val('salud'), aceptaSalud: val('aceptaSalud'),
      aceptaFotos: val('aceptaFotos'), aceptaWsp: val('aceptaWsp'),
      tutorNombre: minor ? val('tutorNombre') : '', tutorDni: minor ? val('tutorDni') : '',
      tutorCel: minor ? val('tutorCel') : '', tutorOk: minor ? val('tutorOk') : false
    };
  }

  function showErr(msg) { formMsg.textContent = msg; formMsg.hidden = false; }

  function submit() {
    if (val('web')) { return; }
    sending = true; btnNext.disabled = true; btnNext.textContent = 'Enviando…';
    formMsg.hidden = true;
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'register', data: payload() }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (res) {
      clearTimeout(t);
      if (res && res.ok) { done(res); }
      else { showErr((res && res.error) || 'No pudimos registrar tu inscripción. Inténtalo de nuevo.'); }
    }).catch(function () {
      clearTimeout(t);
      showErr('No pudimos conectar. Revisa tu internet e inténtalo de nuevo. Si ya enviaste, no repitas: escríbenos al 965 772 515.');
    }).then(function () {
      sending = false; btnNext.disabled = false; btnNext.textContent = 'Confirmar inscripción';
    });
  }

  function qrInto(el, text, cell) {
    el.innerHTML = '';
    try {
      var q = qrcode(0, 'M'); q.addData(text); q.make();
      el.innerHTML = q.createSvgTag({ cellSize: cell, margin: 0, scalable: true });
    } catch (e) { el.textContent = text; }
  }

  function done(res) {
    $('#pNombre').textContent = res.nombre || val('nombre').toUpperCase();
    $('#pDist').textContent = res.distancia || val('distancia');
    $('#pCode').textContent = res.id;
    $('#qrCode').textContent = res.id;
    $('#pPending').hidden = !res.pendienteTutor;
    qrInto($('#qrBox'), res.id, 4);
    qrInto($('#qrBig'), res.id, 8);
    show(vPase);
  }

  function openD(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  function closeD(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  $('#openTerms').addEventListener('click', function (e) { e.preventDefault(); openD($('#termsDialog')); });
  $('#closeTerms').addEventListener('click', function () { closeD($('#termsDialog')); });
  $('#btnQr').addEventListener('click', function () { openD($('#qrDialog')); });
  $('#closeQr').addEventListener('click', function () { closeD($('#qrDialog')); });
  window.addEventListener('resize', function () { if (!vForm.hidden) render(); });
})();
