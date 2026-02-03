(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, el = document) => el.querySelectorAll(sel);

  const screens = {
    start: $('start-screen'),
    quiz: $('quiz-screen'),
    result: $('result-screen'),
  };

  const quizEl = {
    currentNum: $('current-num'),
    totalNum: $('total-num'),
    progressFill: $('progress-fill'),
    question: $('quiz-question'),
    hint: $('quiz-hint'),
    choices: $('choices'),
    feedback: $('feedback'),
    nextBtn: $('next-btn'),
  };

  const resultEl = {
    scoreNum: $('score-num'),
    scoreTotal: $('score-total'),
    scorePercent: $('score-percent'),
    resultMessage: $('result-message'),
  };

  let state = {
    quizType: 'word-to-meaning',
    totalCount: 10,
    currentIndex: 0,
    quizItems: [],
    score: 0,
    answered: false,
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getWrongChoices(correctMeaning, count = 3) {
    const others = WORD_LIST.filter((w) => w.meaning !== correctMeaning);
    return shuffle(others)
      .slice(0, count)
      .map((w) => w.meaning);
  }

  function getWrongWords(correctWord, count = 3) {
    const others = WORD_LIST.filter((w) => w.word !== correctWord);
    return shuffle(others)
      .slice(0, count)
      .map((w) => w.word);
  }

  function buildQuizItems() {
    const shuffled = shuffle(WORD_LIST);
    const count = Math.min(state.totalCount, shuffled.length);
    const items = shuffled.slice(0, count).map((item) => {
      if (state.quizType === 'word-to-meaning') {
        const wrongs = getWrongChoices(item.meaning);
        const options = shuffle([item.meaning, ...wrongs]);
        return {
          question: item.word,
          correct: item.meaning,
          options,
          hint: '뜻을 고르세요.',
        };
      } else {
        const wrongs = getWrongWords(item.word);
        const options = shuffle([item.word, ...wrongs]);
        return {
          question: item.meaning,
          correct: item.word,
          options,
          hint: '알맞은 영어 단어를 고르세요.',
        };
      }
    });
    state.quizItems = items;
    state.currentIndex = 0;
    state.score = 0;
  }

  function renderQuiz() {
    const item = state.quizItems[state.currentIndex];
    if (!item) {
      showResult();
      return;
    }

    state.answered = false;
    quizEl.currentNum.textContent = state.currentIndex + 1;
    quizEl.totalNum.textContent = state.quizItems.length;
    quizEl.progressFill.style.width =
      (state.currentIndex / state.quizItems.length) * 100 + '%';

    quizEl.question.textContent = item.question;
    quizEl.hint.textContent = item.hint;
    quizEl.feedback.classList.add('hidden');
    quizEl.nextBtn.classList.add('hidden');

    quizEl.choices.innerHTML = '';
    item.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleChoice(opt, btn, item));
      quizEl.choices.appendChild(btn);
    });
  }

  function handleChoice(selected, btnEl, item) {
    if (state.answered) return;
    state.answered = true;

    const correct = selected === item.correct;
    if (correct) state.score += 1;

    $$('.choice-btn', quizEl.choices).forEach((b) => {
      b.classList.add('disabled');
      if (b.textContent === item.correct) b.classList.add('correct');
      if (b === btnEl && !correct) b.classList.add('wrong');
    });

    quizEl.feedback.textContent = correct
      ? '정답입니다!'
      : `오답입니다. 정답: ${item.correct}`;
    quizEl.feedback.className = 'feedback ' + (correct ? 'correct-msg' : 'wrong-msg');
    quizEl.feedback.classList.remove('hidden');
    quizEl.nextBtn.classList.remove('hidden');
  }

  function nextQuestion() {
    state.currentIndex += 1;
    if (state.currentIndex < state.quizItems.length) {
      renderQuiz();
    } else {
      showResult();
    }
  }

  function showResult() {
    const total = state.quizItems.length;
    const percent = total ? Math.round((state.score / total) * 100) : 0;

    resultEl.scoreNum.textContent = state.score;
    resultEl.scoreTotal.textContent = total;
    resultEl.scorePercent.textContent = percent + '%';

    let msg = '';
    if (percent >= 90) msg = '훌륭해요! 거의 다 맞추셨네요.';
    else if (percent >= 70) msg = '잘했어요! 조금만 더 연습해 보세요.';
    else msg = '다시 도전해 보세요. 단어를 복습한 뒤 퀴즈를 풀어보면 좋아요.';
    resultEl.resultMessage.textContent = msg;

    showScreen('result');
  }

  function startQuiz() {
    state.quizType = $('quiz-type').value;
    state.totalCount = parseInt($('quiz-count').value, 10);
    buildQuizItems();
    showScreen('quiz');
    renderQuiz();
  }

  function openContactModal() {
    const modal = $('contact-modal');
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeContactModal() {
    const modal = $('contact-modal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  function showFormStatus(message, isError) {
    const status = $('contact-form-status');
    if (!status) return;
    status.textContent = message;
    status.className = 'form-status ' + (isError ? 'error' : 'success');
    status.classList.remove('hidden');
  }

  function handleContactSubmit(e) {
    e.preventDefault();
    const nameEl = $('contact-name');
    const phoneEl = $('contact-phone');
    const emailEl = $('contact-email');
    const submitBtn = $('contact-submit');
    const statusEl = $('contact-form-status');
    if (!nameEl || !phoneEl || !emailEl || !submitBtn) return;

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const email = emailEl.value.trim();
    if (!name || !phone || !email) {
      showFormStatus('이름, 전화번호, 이메일을 모두 입력해 주세요.', true);
      return;
    }

    statusEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = '보내는 중…';

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || '전송 실패');
        return res.json();
      })
      .then(() => {
        showFormStatus('전송되었습니다. 연락드리겠습니다!', false);
        nameEl.value = '';
        phoneEl.value = '';
        emailEl.value = '';
        setTimeout(closeContactModal, 1500);
      })
      .catch(() => {
        showFormStatus('전송에 실패했습니다. 잠시 후 다시 시도해 주세요.', true);
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = '보내기';
      });
  }

  function init() {
    $('start-btn').addEventListener('click', startQuiz);
    quizEl.nextBtn.addEventListener('click', nextQuestion);
    $('retry-btn').addEventListener('click', () => showScreen('start'));

    const contactCta = $('contact-cta-btn');
    const contactModal = $('contact-modal');
    const contactClose = $('contact-modal-close');
    const contactForm = $('contact-form');

    if (contactCta) contactCta.addEventListener('click', openContactModal);
    if (contactClose) contactClose.addEventListener('click', closeContactModal);
    if (contactModal) {
      contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) closeContactModal();
      });
    }
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);
  }

  init();
})();
