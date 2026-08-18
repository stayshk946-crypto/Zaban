// app.js - منطق برنامه به زبان فارسی
const App = (function(){
  // داده‌های پیش‌فرض
  const defaults = {
    user: {name:'کاربر', xp:0, level:0, streak:0, correct:0, words:0},
    settings: {theme:'light', language:'فارسی'} ,
    vocab: [
      {word:'کتاب', meaning:'book', pron:'/ketâb/'},
      {word:'سلام', meaning:'hello', pron:'/salaam/'}
    ],
    quiz: [
      {q:'معنی کلمه "کتاب" چیست؟', options:['book','pen','apple','chair'], answer:0},
      {q:'معنی "سلام" چیست؟', options:['bye','hello','thanks','please'], answer:1},
      {q:'کدام‌یک اسم است؟', options:['run','eat','book','sleep'], answer:2}
    ]
  };

  // ذخیره‌سازی
  function load(){
    const raw = localStorage.getItem('zaban_data');
    if(raw) return JSON.parse(raw);
    localStorage.setItem('zaban_data', JSON.stringify(defaults));
    return JSON.parse(localStorage.getItem('zaban_data'));
  }
  function save(state){ localStorage.setItem('zaban_data', JSON.stringify(state)); }

  let state = load();

  // helper
  function $(sel){return document.querySelector(sel)}
  function $all(sel){return Array.from(document.querySelectorAll(sel))}

  // UI init
  function init(){
    applyTheme();
    bindButtons();
    renderHome();
    renderProfile();
    renderVocab();
  }

  function applyTheme(){
    document.body.classList.toggle('dark', state.settings.theme==='dark');
    // theme color
    document.querySelector('meta[name=theme-color]').setAttribute('content', state.settings.theme==='dark' ? '#071025' : '#E6F2FF');
  }

  function bindButtons(){
    $all('[data-route]').forEach(btn=>btn.addEventListener('click',e=>navigate(e.currentTarget.dataset.route)));
    $all('.nav-btn').forEach(btn=>btn.addEventListener('click',e=>navigate(e.currentTarget.dataset.route)));
    $('#themeToggle').addEventListener('click',toggleTheme);
    $('#editNameBtn').addEventListener('click',openEditName);
    $('#settingsBtn').addEventListener('click',openSettings);
    $('#addWordBtn').addEventListener('click',openAddWord);
    $('#modalClose').addEventListener('click',closeModal);
    $('#modalSave').addEventListener('click',saveModal);
    $('#startDailyBtn').addEventListener('click',startDaily);

    // quiz
    $('#nextQuestionBtn').addEventListener('click',nextQuestion);
    $('#endQuizBtn').addEventListener('click',endQuiz);

    // initial navigation
    navigate('home');
  }

  function navigate(route){
    $all('.page').forEach(p=>p.classList.add('hidden'));
    const el = $('#'+route);
    if(el) el.classList.remove('hidden');
  }

  function renderHome(){
    $('#userName').textContent = state.user.name;
    $('#xpValue').textContent = state.user.xp;
    $('#levelValue').textContent = state.user.level;
    $('#streakValue').textContent = state.user.streak;
    const percent = Math.min(100, (state.user.xp % 100));
    $('#progressBar').style.width = percent + '%';
  }

  function renderProfile(){
    $('#profileName').textContent = state.user.name;
    $('#profileLevel').textContent = state.user.level;
    $('#profileXP').textContent = state.user.xp;
    $('#correctAnswers').textContent = state.user.correct;
    $('#wordsLearned').textContent = state.user.words;
    const percent = Math.min(100, (state.user.xp % 100));
    $('#progressPercent').textContent = percent + '%';
    $('#profileProgressBar').style.width = percent + '%';
  }

  // Edit name modal
  function openEditName(){
    openModal('تغییر نام', `<label>نام جدید</label><input id="inputName" class="modal-input" value="${state.user.name}" />`);
  }

  function openSettings(){
    const langs = ['فارسی','English','العربية','Русский','Français','Deutsch','Español','Italiano','Türkçe','中文','日本語','한국어','Português','Nederlands','हिन्दी'];
    const options = langs.map(l=>`<option value="${l}" ${l===state.settings.language? 'selected':''}>${l}</option>`).join('');
    openModal('تنظیمات', `<label>حالت</label><select id="selTheme" class="modal-input"><option value=light ${state.settings.theme==='light'?'selected':''}>روشن</option><option value=dark ${state.settings.theme==='dark'?'selected':''}>تاریک</option></select>
      <label style="margin-top:8px">زبان رابط</label>
      <select id="selLang" class="modal-input">${options}</select>
    `);
  }

  function openAddWord(){
    openModal('افزودن کلمه', `<label>کلمه</label><input id="w_word" class="modal-input" />
      <label>معنی</label><input id="w_meaning" class="modal-input" />
      <label>تلفظ</label><input id="w_pron" class="modal-input" placeholder="مثال: /ketâb/" />`);
  }

  function openModal(title, body){
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = body;
    $('#modal').classList.remove('hidden');
  }
  function closeModal(){ $('#modal').classList.add('hidden'); }

  function saveModal(){
    const title = $('#modalTitle').textContent;
    if(title==='تغییر نام'){
      const v = $('#inputName').value.trim() || 'کاربر';
      state.user.name = v;
    } else if(title==='تنظیمات'){
      state.settings.theme = $('#selTheme').value;
      state.settings.language = $('#selLang').value;
      applyTheme();
    } else if(title==='افزودن کلمه'){
      const w = $('#w_word').value.trim();
      const m = $('#w_meaning').value.trim();
      const p = $('#w_pron').value.trim();
      if(w && m){
        state.vocab.push({word:w,meaning:m,pron:p});
        state.user.words = state.vocab.length;
      }
      renderVocab();
    }
    save(state);
    renderHome();renderProfile();
    closeModal();
  }

  // Vocab
  function renderVocab(){
    const list = $('#vocabList'); list.innerHTML = '';
    state.vocab.forEach((v,idx)=>{
      const div = document.createElement('div'); div.className='vocab-card card';
      div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div style='font-weight:700'>${v.word}</div><div class='muted'>${v.meaning}</div></div><div><button data-idx='${idx}' class='btn small play-pron'>🔊</button></div></div>`;
      list.appendChild(div);
    });
    $all('.play-pron').forEach(b=>b.addEventListener('click',e=>{
      const idx = +e.currentTarget.dataset.idx; speak(state.vocab[idx]);
    }));
  }

  function speak(item){
    // استفاده از SpeechSynthesis اگر موجود باشد
    if('speechSynthesis' in window){
      const utter = new SpeechSynthesisUtterance(item.word);
      utter.lang = 'fa-IR';
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    } else alert('پخش تلفظ پشتیبانی نمی‌شود');
  }

  // Quiz
  let qIndex = 0; let score = 0;
  function startQuiz(){
    qIndex = 0; score = 0; $('#quizResult').classList.add('hidden'); $('#quiz').classList.remove('hidden'); renderQuestion();
  }
  function renderQuestion(){
    const q = state.quiz[qIndex];
    if(!q){ endQuiz(); return; }
    $('#questionText').textContent = q.q;
    const opts = $('#options'); opts.innerHTML = '';
    q.options.forEach((o,i)=>{
      const btn = document.createElement('button'); btn.className='option-btn'; btn.textContent = o; btn.addEventListener('click',()=>chooseOption(i)); opts.appendChild(btn);
    });
  }
  function chooseOption(i){
    const q = state.quiz[qIndex];
    const opts = $all('.option-btn');
    opts.forEach((b,idx)=>{
      b.disabled = true;
      if(idx===q.answer){ b.classList.add('correct'); }
      if(idx===i && idx!==q.answer){ b.classList.add('wrong'); }
    });
    if(i===q.answer){
      showResult(true);
      score+=10; state.user.xp+=10; state.user.correct+=1;
      // level up
      state.user.level = Math.floor(state.user.xp/100);
    } else {
      showResult(false);
    }
    save(state); renderHome(); renderProfile();
  }
  function showResult(ok){
    $('#quizResult').classList.remove('hidden');
    $('#resultMessage').textContent = ok? 'آفرین! عالی بود! 🎉' : 'اشکالی نداره! دوباره تلاش کن 💪';
    $('#quizScore').textContent = score;
  }
  function nextQuestion(){ qIndex++; $('#quizResult').classList.add('hidden'); renderQuestion(); }
  function endQuiz(){
    $('#quizResult').classList.remove('hidden'); $('#resultMessage').textContent = 'آزمون پایان یافت';
    $('#quizScore').textContent = score;
  }

  function startDaily(){
    // ساده: یک سوال روزانه از کوییز
    navigate('quiz'); startQuiz();
  }

  function toggleTheme(){ state.settings.theme = state.settings.theme==='light' ? 'dark' : 'light'; applyTheme(); save(state); }

  // expose some actions
  return { init, startQuiz };
})();

// راه‌��ندازی
document.addEventListener('DOMContentLoaded', ()=>{
  App.init();
  // ثبت سرویس‌ورکر برای PWA
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').catch(e=>console.log('SW Error',e));
  }
});
